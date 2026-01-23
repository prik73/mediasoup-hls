import { spawn } from 'child_process';
import { EventEmitter } from 'events';
import { logger } from '../utils/logger.js';
/**
 * Wrapper for FFmpeg process
 * Handles spawning, monitoring, and killing FFmpeg
 */
export class FFmpegProcess extends EventEmitter {
    process = null;
    sdpPath;
    outputPath;
    cwd;
    filterComplex;
    constructor(sdpPath, outputPath, filterComplex) {
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
    setSdpPath(sdpPath) {
        this.sdpPath = sdpPath;
    }
    /**
     * Start FFmpeg process with multi-quality adaptive bitrate streaming
     * Returns the process immediately so it can be saved before it exits
     */
    async start() {
        // Multi-user layout with multi-quality adaptive bitrate streaming
        // Uses filter_complex to composite users, then encodes at 720p and 360p
        const args = [
            '-protocol_whitelist', 'file,rtp,udp,crypto,data',
            // Aggressive Jitter Buffer Settings for Multi-User RTP Streams
            // These prevent "max delay reached" errors and packet loss
            '-reorder_queue_size', '50000', // Increased from 10000
            '-max_delay', '50000000', // 50 seconds (increased from 10s)
            '-buffer_size', '10000000', // 10MB input buffer
            '-i', 'stream.sdp',
            // Apply filter complex to composite multiple users into grid layout
            // This creates [vout0]/[vout1] (split video) and [aout0]/[aout1] (split audio)
            '-filter_complex', this.filterComplex,
            // Map the single output
            '-map', '[vout0]', '-map', '[aout0]',
            // 480p optimized variant (Single Stream)
            '-c:v:0', 'libx264',
            '-b:v:0', '1000k',
            '-s:v:0', '854x480',
            '-maxrate:v:0', '1200k',
            '-bufsize:v:0', '2400k',
            '-c:a:0', 'aac',
            '-b:a:0', '96k',
            '-ar:a:0', '48000',
            // Performance settings for t3.small
            '-r', '24',
            '-preset', 'ultrafast',
            '-tune', 'zerolatency',
            '-g', '48', // 2 second GOP at 24fps
            '-keyint_min', '48',
            '-sc_threshold', '0',
            // Error concealment for corrupt RTP packets
            '-err_detect', 'ignore_err',
            '-fflags', '+genpts+igndts',
            '-threads', '2', // Limit threads to avoid context switching overhead
            // HLS variant stream settings
            '-f', 'hls',
            '-hls_time', '2',
            '-hls_list_size', '10',
            '-hls_flags', 'delete_segments+append_list+program_date_time+independent_segments',
            // Single stream mapping
            '-var_stream_map', 'v:0,a:0',
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
    setupEventHandlers() {
        if (!this.process)
            return;
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
    getProcess() {
        return this.process;
    }
    /**
     * Check if FFmpeg is currently running
     */
    isRunning() {
        return this.process !== null && !this.process.killed;
    }
    /**
     * Gracefully stop the FFmpeg process
     * Sends SIGTERM first, waits for graceful shutdown, then SIGKILL if needed
     */
    async stop() {
        if (!this.process || this.process.killed) {
            return;
        }
        logger.info('Stopping FFmpeg process gracefully...');
        return new Promise((resolve) => {
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
    kill(signal = 'SIGKILL') {
        if (this.process && !this.process.killed) {
            logger.info(`Killing FFmpeg process with ${signal}`);
            this.process.kill(signal);
            this.process = null;
        }
    }
    /**
     * Get process PID
     */
    getPid() {
        return this.process?.pid;
    }
}
//# sourceMappingURL=FFmpegProcess.js.map