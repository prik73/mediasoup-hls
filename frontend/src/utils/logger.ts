// Simple console logger
export const logger = {
    info: (...args: any[]) => console.log('[INFO]', ...args),
    error: (...args: any[]) => console.error('[ERROR]', ...args),
    warn: (...args: any[]) => console.warn('[WARN]', ...args),
    debug: (...args: any[]) => {
        if (import.meta.env.DEV) {
            console.debug('[DEBUG]', ...args);
        }
    }
};
