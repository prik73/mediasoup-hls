import { EventEmitter } from 'events';
/**
 * Wrapper for FFmpeg process
 * Handles spawning, monitoring, and killing FFmpeg
 */
export declare class FFmpegProcess extends EventEmitter {
    private process;
    private sdpPath;
    private outputPath;
    constructor(sdpPath: string, outputPath: string);
    /**
     * Start FFmpeg process
     */
    start(): Promise<void>;
    /**
     * Kill FFmpeg process
     */
    kill(): void;
    /**
     * Check if FFmpeg is running
     */
    isRunning(): boolean;
    /**
     * Get process PID
     */
    getPid(): number | undefined;
}
//# sourceMappingURL=FFmpegProcess.d.ts.map