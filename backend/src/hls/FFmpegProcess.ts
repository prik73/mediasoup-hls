import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import { logger } from '../utils/logger.js';
import { FFmpegStartError } from '../utils/errors.js';

/**
 * Wrapper for FFmpeg process
 * Handles spawning, monitoring, and killing FFmpeg
 */
export class FFmpegProcess extends EventEmitter {
    private process: ChildProcess | null = null;
    private sdpPath: string;
    private outputPath: string;
    private cwd: string;
    private filterComplex: string;

    constructor(sdpPath: string, outputPath: string, filterComplex: string) {
        super();
        this.sdpPath = sdpPath;
        this.outputPath = outputPath;
        this.filterComplex = filterComplex;
        // Use outputPath as logical CWD for FFmpeg
        this.cwd = outputPath;
    }

    /**
     * Set SDP path (must be called before start() if not provided in constructor)
     */
    setSdpPath(sdpPath: string): void {
        this.sdpPath = sdpPath;
    }

    /**
     * Start FFmpeg process with multi-quality adaptive bitrate streaming
     * Returns the process immediately so it can be saved before it exits
     */
    async start(): Promise<ChildProcess> {
        // Multi-user layout with multi-quality adaptive bitrate streaming
        // Uses filter_complex to composite users, then encodes at 720p and 360p
        const args: string[] = [
            '-protocol_whitelist', 'file,rtp,udp,crypto,data',

            // Aggressive Jitter Buffer Settings for Multi-User RTP Streams
            // These prevent "max delay reached" errors and packet loss
            '-reorder_queue_size', '50000',      // Increased from 10000
            '-max_delay', '50000000',            // 50 seconds (increased from 10s)
            '-buffer_size', '10000000',          // 10MB input buffer

            '-i', 'stream.sdp',

            // Apply filter complex to composite multiple users into grid layout
            // This creates [vout0]/[vout1]/[vout2]/[vout3] and [aout0]/[aout1]/[aout2]/[aout3]
            '-filter_complex', this.filterComplex,

            // Map the split outputs for 4 quality variants
            '-map', '[vout0]', '-map', '[aout0]',  // 720p
            '-map', '[vout1]', '-map', '[aout1]',  // 480p
            '-map', '[vout2]', '-map', '[aout2]',  // 360p
            '-map', '[vout3]', '-map', '[aout3]',  // 144p

            // 720p HD (High)
            '-c:v:0', 'libx264', '-b:v:0', '2500k', '-s:v:0', '1280x720', '-maxrate:v:0', '3000k', '-bufsize:v:0', '6000k',
            '-c:a:0', 'aac', '-b:a:0', '128k', '-ar:a:0', '48000',

            // 480p SD (Medium)
            '-c:v:1', 'libx264', '-b:v:1', '1200k', '-s:v:1', '854x480', '-maxrate:v:1', '1500k', '-bufsize:v:1', '3000k',
            '-c:a:1', 'aac', '-b:a:1', '96k', '-ar:a:1', '48000',

            // 360p LD (Low)
            '-c:v:2', 'libx264', '-b:v:2', '800k', '-s:v:2', '640x360', '-maxrate:v:2', '1000k', '-bufsize:v:2', '2000k',
            '-c:a:2', 'aac', '-b:a:2', '64k', '-ar:a:2', '48000',

            // 144p Mobile (Data Saver)
            '-c:v:3', 'libx264', '-b:v:3', '250k', '-s:v:3', '256x144', '-maxrate:v:3', '400k', '-bufsize:v:3', '800k',
            '-c:a:3', 'aac', '-b:a:3', '48k', '-ar:a:3', '48000',

            // Common encoding settings
            '-r', '24',                 // Frame rate
            '-preset', 'veryfast',      // Encoding speed vs compression
            '-tune', 'zerolatency',     // Low latency tuning
            '-g', '48',                 // GOP size (2 seconds at 24fps)
            '-keyint_min', '48',
            '-sc_threshold', '0',       // Disable scene change detection for consistent segments

            // Error concealment
            '-err_detect', 'ignore_err',
            '-fflags', '+genpts+igndts',
            '-threads', '0',

            // HLS variant stream settings
            '-f', 'hls',
            '-hls_time', '2',
            '-hls_list_size', '6',
            '-hls_flags', 'delete_segments+append_list+program_date_time+independent_segments',

            // Variant stream mapping
            '-var_stream_map', 'v:0,a:0 v:1,a:1 v:2,a:2 v:3,a:3',
            '-master_pl_name', 'playlist.m3u8',
            '-hls_segment_filename', 'v%v/segment-%03d.ts',
            'v%v/index.m3u8',
        ];

        const argsString = args.join(' ');
        logger.info(`Starting FFmpeg with args: ${argsString}`);
        logger.info(`FFmpeg CWD: ${this.cwd}`);

        // Spawn FFmpeg process in the output directory
        this.process = spawn('ffmpeg', args, {
            stdio: ['ignore', 'pipe', 'pipe'],
            cwd: this.cwd, // Crucial fix: Run inside output directory
        });

        // CRITICAL: Return process immediately so HLSManager can save it
        // before it potentially exits
        const process = this.process;

        // Setup event handlers asynchronously (don't wait)
        this.setupEventHandlers();

        // Small delay to let FFmpeg initialize
        await new Promise((resolve) => setTimeout(resolve, 500));

        logger.info('FFmpeg process spawned');

        return process;
    }

    /**
     * Setup event handlers for FFmpeg process
     */
    private setupEventHandlers(): void {
        if (!this.process) return;

        let stderrBuffer = '';

        // Monitor stdout (optional, FFmpeg usually logs to stderr)
        this.process.stdout?.on('data', (data) => {
            logger.debug(`FFmpeg stdout: ${data}`);
        });

        // Capture stderr for error logging
        this.process.stderr?.on('data', (data) => {
            const message = data.toString();
            stderrBuffer += message;
            // Log to INFO so we can see it in user console during debugging
            logger.info(`FFmpeg stderr: ${message}`);
        });

        // Handle process exit
        this.process.on('exit', (code, signal) => {
            logger.info(`FFmpeg exited with code ${code}, signal ${signal}`);

            if (code !== 0 && code !== null) {
                logger.error('FFmpeg full stderr output:');
                logger.error(stderrBuffer);
            }

            this.emit('exit', code, signal);
            this.process = null;
        });

        // Handle errors
        this.process.on('error', (error) => {
            logger.error('FFmpeg process error:', error);
            this.emit('error', error);
        });
    }

    /**
     * Get the child process (for cleanup)
     */
    getProcess(): ChildProcess | null {
        return this.process;
    }

    /**
     * Check if FFmpeg is currently running
     */
    isRunning(): boolean {
        return this.process !== null && !this.process.killed;
    }

    /**
     * Gracefully stop the FFmpeg process
     * Sends SIGTERM first, waits for graceful shutdown, then SIGKILL if needed
     */
    async stop(): Promise<void> {
        if (!this.process || this.process.killed) {
            return;
        }

        logger.info('Stopping FFmpeg process gracefully...');

        return new Promise<void>((resolve) => {
            if (!this.process) {
                resolve();
                return;
            }

            // Send SIGTERM for graceful shutdown
            this.process.kill('SIGTERM');

            // Wait up to 5 seconds for graceful shutdown
            const timeout = setTimeout(() => {
                if (this.process && !this.process.killed) {
                    logger.warn('FFmpeg did not stop gracefully, sending SIGKILL');
                    this.process.kill('SIGKILL');
                }
                this.process = null;
                resolve();
            }, 5000);

            // If process exits before timeout, clear timeout and resolve
            this.process.once('exit', () => {
                clearTimeout(timeout);
                this.process = null;
                logger.info('FFmpeg process stopped');
                resolve();
            });
        });
    }

    /**
     * Kill the FFmpeg process immediately
     */
    kill(signal: NodeJS.Signals = 'SIGKILL'): void {
        if (this.process && !this.process.killed) {
            logger.info(`Killing FFmpeg process with ${signal}`);
            this.process.kill(signal);
            this.process = null;
        }
    }

    /**
     * Get process PID
     */
    getPid(): number | undefined {
        return this.process?.pid;
    }
}
