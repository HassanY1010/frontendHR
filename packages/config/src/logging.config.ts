export const loggingConfig = {
    level: import.meta.env.MODE === 'production' ? 'info' : 'debug',
    enableRemoteLogging: import.meta.env.MODE === 'production',
    sensitiveFields: ['password', 'token', 'creditCard'],
};
