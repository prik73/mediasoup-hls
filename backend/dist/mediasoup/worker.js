import * as mediasoup from 'mediasoup';
import { logger } from '../utils/logger.js';
import { mediasoupConfig } from '../config/mediasoup.config.js';
let worker = null;
/**
 * Initialize Mediasoup worker
 * Worker handles the low-level media processing
 */
export async function createWorker() {
    if (worker) {
        return worker;
    }
    logger.info('Creating Mediasoup worker...');
    worker = await mediasoup.createWorker(mediasoupConfig.worker);
    worker.on('died', () => {
        logger.error('Mediasoup worker died, exiting in 2 seconds...');
        setTimeout(() => process.exit(1), 2000);
    });
    logger.info(`Mediasoup worker created [pid:${worker.pid}]`);
    return worker;
}
/**
 * Get existing worker or create new one
 */
export function getWorker() {
    if (!worker) {
        throw new Error('Worker not initialized. Call createWorker() first.');
    }
    return worker;
}
//# sourceMappingURL=worker.js.map