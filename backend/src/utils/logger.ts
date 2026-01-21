// Simple console logger with timestamps
export const logger = {
    info: (...args: any[]) => {
        console.log(`[${new Date().toISOString()}] [INFO]`, ...args);
    },
    error: (...args: any[]) => {
        console.error(`[${new Date().toISOString()}] [ERROR]`, ...args);
    },
    warn: (...args: any[]) => {
        console.warn(`[${new Date().toISOString()}] [WARN]`, ...args);
    },
    debug: (...args: any[]) => {
        if (process.env.DEBUG) {
            console.debug(`[${new Date().toISOString()}] [DEBUG]`, ...args);
        }
    }
};
