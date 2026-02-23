// apps/api/src/utils/cache.js

import Redis from 'ioredis';
import logger from './logger.js';
import dotenv from 'dotenv';

dotenv.config();

const cache = new Map();
let redis = null;

if (process.env.REDIS_URL) {
    try {
        redis = new Redis(process.env.REDIS_URL, {
            maxRetriesPerRequest: 1,
            retryStrategy: () => null // Don't keep retrying if Redis is down
        });
        redis.on('error', (err) => logger.warn('Redis Cache Error', { error: err.message }));
    } catch (e) {
        logger.warn('Failed to connect to Redis, falling back to memory cache');
    }
}

export const memoryCache = {
    set: async (key, value, ttlSeconds = 60) => {
        if (redis) {
            try {
                await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
                return;
            } catch (e) {
                // Fallback to memory
            }
        }
        const expiry = Date.now() + ttlSeconds * 1000;
        cache.set(key, { value, expiry });
    },

    get: async (key) => {
        if (redis) {
            try {
                const val = await redis.get(key);
                return val ? JSON.parse(val) : null;
            } catch (e) {
                // Fallback to memory
            }
        }
        const item = cache.get(key);
        if (!item) return null;

        if (Date.now() > item.expiry) {
            cache.delete(key);
            return null;
        }

        return item.value;
    },

    delete: async (key) => {
        if (redis) try { await redis.del(key); } catch (e) { }
        cache.delete(key);
    },

    clear: async () => {
        if (redis) try { await redis.flushdb(); } catch (e) { }
        cache.clear();
    }
};
