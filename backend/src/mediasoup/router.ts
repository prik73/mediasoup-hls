import type { Router } from 'mediasoup/node/lib/types.js';
import { getWorker } from './worker.js';
import { mediasoupConfig } from '../config/mediasoup.config.js';
import { logger } from '../utils/logger.js';

const routers = new Map<string, Router>();

/**
 * Create a router for a room
 * Router handles media routing between participants
 */
export async function createRouter(roomId: string): Promise<Router> {
    if (routers.has(roomId)) {
        return routers.get(roomId)!;
    }

    const worker = getWorker();
    const router = await worker.createRouter(mediasoupConfig.router);

    routers.set(roomId, router);
    logger.info(`Router created for room ${roomId}`);

    return router;
}

/**
 * Get existing router for a room
 */
export function getRouter(roomId: string): Router | undefined {
    return routers.get(roomId);
}

/**
 * Close router and remove from map
 */
export function closeRouter(roomId: string): void {
    const router = routers.get(roomId);
    if (router) {
        router.close();
        routers.delete(roomId);
        logger.info(`Router closed for room ${roomId}`);
    }
}
