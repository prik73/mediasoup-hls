import type { Worker } from 'mediasoup/node/lib/types.js';
/**
 * Initialize Mediasoup worker
 * Worker handles the low-level media processing
 */
export declare function createWorker(): Promise<Worker>;
/**
 * Get existing worker or create new one
 */
export declare function getWorker(): Worker;
//# sourceMappingURL=worker.d.ts.map