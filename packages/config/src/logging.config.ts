/// <reference path="./env.d.ts" />
export const loggingConfig = {
    level: import.meta.env.MODE === 'production' ? 'info' : 'debug',
    enableRemoteLogging: import.meta.env.MODE === 'production',
    sensitiveFields: ['password', 'token', 'creditCard'],
};
