import { ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
/**
 * Wrapper for FFmpeg process
 * Handles spawning, monitoring, and killing FFmpeg
 */
export declare class FFmpegProcess extends EventEmitter {
    private process;
    private sdpPath;
    private outputPath;
    private cwd;
    private filterComplex;
    constructor(sdpPath: string, outputPath: string, filterComplex: string);
    /**
     * Set SDP path (must be called before start() if not provided in constructor)
     */
    setSdpPath(sdpPath: string): void;
    /**
     * Start FFmpeg process with multi-quality adaptive bitrate streaming
     * Returns the process immediately so it can be saved before it exits
     */
    start(): Promise<ChildProcess>;
    /**
     * Setup event handlers for FFmpeg process
     */
    private setupEventHandlers;
    /**
     * Get the child process (for cleanup)
     */
    getProcess(): ChildProcess | null;
    /**
     * Check if FFmpeg is currently running
     */
    isRunning(): boolean;
    /**
     * Gracefully stop the FFmpeg process
     * Sends SIGTERM first, waits for graceful shutdown, then SIGKILL if needed
     */
    stop(): Promise<void>;
    /**
     * Kill the FFmpeg process immediately
     */
    kill(signal?: NodeJS.Signals): void;
    /**
     * Get process PID
     */
    getPid(): number | undefined;
}
//# sourceMappingURL=FFmpegProcess.d.ts.map