import { spawn } from 'child_process';
import { EventEmitter } from 'events';
import { logger } from '../utils/logger.js';
import { FFmpegStartError } from '../utils/errors.js';
/**
 * Wrapper for FFmpeg process
 * Handles spawning, monitoring, and killing FFmpeg
 */
export class FFmpegProcess extends EventEmitter {
    process = null;
    sdpPath;
    outputPath;
    constructor(sdpPath, outputPath) {
        super();
        this.sdpPath = sdpPath;
        this.outputPath = outputPath;
    }
    /**
     * Start FFmpeg process
     */
    async start() {
        return new Promise((resolve, reject) => {
            const args = [
                '-protocol_whitelist', 'file,rtp,udp',
                '-fflags', '+genpts',
                '-i', this.sdpPath,
                '-map', '[vout]',
                '-map', '[aout]',
                '-c:v', 'libx264',
                '-preset', 'veryfast',
                '-tune', 'zerolatency',
                '-b:v', '2000k',
                '-maxrate', '2500k',
                '-bufsize', '5000k',
                '-g', '60',
                '-keyint_min', '60',
                '-sc_threshold', '0',
                '-c:a', 'aac',
                '-b:a', '128k',
                '-ar', '48000',
                '-f', 'hls',
                '-hls_time', '2',
                '-hls_list_size', '6',
                '-hls_flags', 'delete_segments+append_list',
                '-hls_segment_filename', `${this.outputPath}/segment-%03d.ts`,
                `${this.outputPath}/playlist.m3u8`,
            ];
            logger.info('Starting FFmpeg with args:', args.join(' '));
            this.process = spawn('ffmpeg', args, {
                stdio: ['ignore', 'pipe', 'pipe'],
            });
            let started = false;
            // Monitor stdout
            this.process.stdout?.on('data', (data) => {
                logger.debug(`FFmpeg stdout: ${data}`);
            });
            // Monitor stderr (FFmpeg outputs logs to stderr)
            this.process.stderr?.on('data', (data) => {
                const message = data.toString();
                logger.debug(`FFmpeg stderr: ${message}`);
                // Detect successful start
                if (!started && message.includes('Opening')) {
                    started = true;
                    logger.info('FFmpeg started successfully');
                    this.emit('started');
                    resolve();
                }
            });
            // Handle process exit
            this.process.on('exit', (code, signal) => {
                logger.info(`FFmpeg exited with code ${code}, signal ${signal}`);
                this.emit('exited', code, signal);
                this.process = null;
            });
            // Handle errors
            this.process.on('error', (error) => {
                logger.error('FFmpeg error:', error);
                this.emit('error', error);
                if (!started) {
                    reject(new FFmpegStartError(`Failed to start FFmpeg: ${error.message}`));
                }
            });
            // Timeout if FFmpeg doesn't start in 5 seconds
            setTimeout(() => {
                if (!started) {
                    this.kill();
                    reject(new FFmpegStartError('FFmpeg start timeout'));
                }
            }, 5000);
        });
    }
    /**
     * Kill FFmpeg process
     */
    kill() {
        if (this.process) {
            logger.info('Killing FFmpeg process');
            this.process.kill('SIGKILL');
            this.process = null;
        }
    }
    /**
     * Check if FFmpeg is running
     */
    isRunning() {
        return this.process !== null;
    }
    /**
     * Get process PID
     */
    getPid() {
        return this.process?.pid;
    }
}
//# sourceMappingURL=FFmpegProcess.js.map