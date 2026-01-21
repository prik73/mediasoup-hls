import type { Router } from 'mediasoup/node/lib/types.js';
/**
 * Create a router for a room
 * Router handles media routing between participants
 */
export declare function createRouter(roomId: string): Promise<Router>;
/**
 * Get existing router for a room
 */
export declare function getRouter(roomId: string): Router | undefined;
/**
 * Close router and remove from map
 */
export declare function closeRouter(roomId: string): void;
//# sourceMappingURL=router.d.ts.map