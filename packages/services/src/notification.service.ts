// packages/services/src/notification.service.ts
import { apiClient } from './api-client';
import { Notification } from '@hr/types';
import { logger } from '@hr/utils';

type NotificationCallback = (notifications: Notification[], newCount: number) => void;

class NotificationService {
    private subscribers = new Set<NotificationCallback>();
    private pollingInterval: ReturnType<typeof setInterval> | null = null;
    private lastNotifications: Notification[] = [];
    private ws: WebSocket | null = null;
    private wsReconnectTimer: ReturnType<typeof setTimeout> | null = null;

    async getAll(): Promise<Notification[]> {
        const response = await apiClient.get<{ status: string, data: Notification[] }>('/notifications');
        return response.data || [];
    }

    async markAsRead(id: string): Promise<void> {
        logger.info('Marking notification as read', { id });
        await apiClient.patch(`/notifications/${id}/read`);
    }

    async markAllAsRead(): Promise<void> {
        logger.info('Marking all notifications as read');
        await apiClient.post('/notifications/read-all');
    }

    async delete(id: string): Promise<void> {
        logger.info('Deleting notification', { id });
        await apiClient.delete(`/notifications/${id}`);
    }

    async updateMetadata(id: string, metadata: any): Promise<void> {
        logger.info('Updating notification metadata', { id });
        await apiClient.patch(`/notifications/${id}/metadata`, { metadata });
    }

    subscribe(callback: NotificationCallback): () => void {
        this.subscribers.add(callback);
        if (this.subscribers.size === 1) {
            this.start();
        }
        return () => {
            this.subscribers.delete(callback);
            if (this.subscribers.size === 0) {
                this.stop();
            }
        };
    }

    private start(): void {
        this.connectWebSocket();
        this.pollingInterval = setInterval(() => this.poll(), 10000);
        this.poll();
    }

    private stop(): void {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        if (this.wsReconnectTimer) {
            clearTimeout(this.wsReconnectTimer);
            this.wsReconnectTimer = null;
        }
        this.lastNotifications = [];
    }

    private async poll(): Promise<void> {
        try {
            const notifications = await this.getAll();
            const prevCount = this.lastNotifications.length;
            const newCount = notifications.length > prevCount
                ? notifications.length - prevCount
                : 0;
            const hasNew = notifications.some(n =>
                !this.lastNotifications.find(p => p.id === n.id)
            );
            this.lastNotifications = notifications;
            if (hasNew) {
                this.notify(notifications, newCount);
            } else {
                this.notify(notifications, 0);
            }
        } catch (error) {
            logger.warn('Notification poll failed', error);
        }
    }

    private connectWebSocket(): void {
        const token = localStorage.getItem('access_token');
        if (!token) return;
        const wsUrl = import.meta.env.VITE_WS_URL || '';
        if (!wsUrl) return;
        try {
            this.ws = new WebSocket(`${wsUrl}/notifications?token=${token}`);
            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === 'notification') {
                        this.poll();
                    }
                } catch { }
            };
            this.ws.onclose = () => {
                if (this.subscribers.size > 0) {
                    this.wsReconnectTimer = setTimeout(() => this.connectWebSocket(), 5000);
                }
            };
            this.ws.onerror = () => {
                this.ws?.close();
            };
        } catch {
            this.ws = null;
        }
    }

    private notify(notifications: Notification[], newCount: number): void {
        this.subscribers.forEach(cb => {
            try { cb(notifications, newCount); } catch { }
        });
    }
}

export const notificationService = new NotificationService();
