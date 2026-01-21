import type { Router } from 'mediasoup/node/lib/types.js';
import type { ProducerInfo } from '../state/types.js';
/**
 * Orchestrates the entire HLS pipeline
 * Manages PlainTransports, consumers, SDP generation, and FFmpeg process
 */
export declare class HLSManager {
    private router;
    private portAllocator;
    private currentPipeline;
    private roomId;
    constructor(router: Router, roomId: string);
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
     * Write SDP file to disk
     */
    private writeSDP;
    /**
     * Connect PlainTransports to their assigned ports
     */
    private connectPlainTransports;
    /**
     * Create consumers for all producers with keyframe retry
     */
    private createConsumers;
    /**
     * Request keyframe with retry mechanism
     * Ensures fast HLS startup by requesting intra-frames
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