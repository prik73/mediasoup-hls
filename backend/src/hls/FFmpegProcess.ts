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

    constructor(sdpPath: string, outputPath: string) {
        super();
        this.sdpPath = sdpPath;
        this.outputPath = outputPath;
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
        // Multi-quality adaptive bitrate streaming
        // Generate 2 variants: 720p HD and 360p SD
        const args: string[] = [
            '-protocol_whitelist', 'file,rtp,udp,crypto,data',

            // Jitter Buffer Settings
            '-reorder_queue_size', '10000', // Increase buffer for out-of-order packets
            '-max_delay', '10000000', // 10s delay tolerance

            '-i', 'stream.sdp',  // Relative path

            // Map video and audio for both variants
            '-map', '0:v:0', '-map', '0:a:0',  // 720p variant
            '-map', '0:v:0', '-map', '0:a:0',  // 360p variant

            // 720p HD variant (stream 0)
            '-c:v:0', 'libx264',
            '-b:v:0', '2500k',
            '-s:v:0', '1280x720',
            '-maxrate:v:0', '3000k',
            '-bufsize:v:0', '6000k',
            '-c:a:0', 'aac',
            '-b:a:0', '128k',
            '-ar:a:0', '48000',

            // 360p SD variant (stream 1)
            '-c:v:1', 'libx264',
            '-b:v:1', '800k',
            '-s:v:1', '640x360',
            '-maxrate:v:1', '1000k',
            '-bufsize:v:1', '2000k',
            '-c:a:1', 'aac',
            '-b:a:1', '96k',
            '-ar:a:1', '48000',

            // Common encoding settings
            '-r', '30', // 30fps for both variants
            '-preset', 'veryfast',
            '-tune', 'zerolatency',
            '-g', '60',
            '-keyint_min', '60',
            '-sc_threshold', '0',

            // HLS variant stream settings
            '-f', 'hls',
            '-hls_time', '2',
            '-hls_list_size', '10',
            '-hls_flags', 'delete_segments+append_list+program_date_time+independent_segments',

            // Variant stream mapping: v:0,a:0 = 720p, v:1,a:1 = 360p
            '-var_stream_map', 'v:0,a:0 v:1,a:1',
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
     * Kill the FFmpeg process
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
