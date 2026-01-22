import type { Router } from 'mediasoup/node/lib/types.js';
import type { ProducerInfo } from '../state/types.js';
import type { Server as SocketIOServer } from 'socket.io';
/**
 * Orchestrates the entire HLS pipeline
 * Manages PlainTransports, consumers, SDP generation, and FFmpeg process
 */
export declare class HLSManager {
    private router;
    private portAllocator;
    private currentPipeline;
    private roomId;
    private io;
    constructor(router: Router, roomId: string, io: SocketIOServer);
    /**
     * Clean up all HLS files (static method for server startup)
     */
    static cleanupAll(): Promise<void>;
    /**
     * Restart the HLS pipeline with current producers
     * This is called when producers join/leave or start/stop producing
     */
    restartPipeline(producers: Map<string, ProducerInfo>): Promise<void>;
    /**
     * Create PlainTransports for all users
     */
    private createPlainTransports;
    /**
     * Connect PlainTransports to send RTP to FFmpeg
     */
    private connectPlainTransports;
    /**
     * Create consumers for each producer on the PlainTransports
     * CRITICAL: Returns consumers PAUSED. Do not resume here.
     */
    private createConsumers;
    /**
     * Resume consumers and request keyframes
     * Called AFTER FFmpeg is running and listening
     */
    private resumeAndRequestKeyframes;
    /**
     * Request keyframe with retry mechanism
     */
    private requestKeyframeWithRetry;
    /**
   * Cleanup current pipeline
   */
    private cleanup;
    /**
     * Get current playlist path
     */
    getPlaylistPath(): string | null;
    /**
     * Check if pipeline is running
     */
    isRunning(): boolean;
    /**
     * Destroy HLS manager and cleanup resources
     */
    destroy(): Promise<void>;
}
//# sourceMappingURL=HLSManager.d.ts.map