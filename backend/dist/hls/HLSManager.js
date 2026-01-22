import * as fs from 'fs/promises';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { PortAllocator } from './PortAllocator.js';
import { SDPGenerator } from './SDPGenerator.js';
import { FilterComplexBuilder } from './FilterComplexBuilder.js';
import { FFmpegProcess } from './FFmpegProcess.js';
import { logger } from '../utils/logger.js';
import { hlsConfig } from '../config/mediasoup.config.js';
const execAsync = promisify(exec);
/**
 * Orchestrates the entire HLS pipeline
 * Manages PlainTransports, consumers, SDP generation, and FFmpeg process
 */
export class HLSManager {
    router;
    portAllocator;
    currentPipeline = null;
    roomId;
    constructor(router, roomId) {
        this.router = router;
        this.roomId = roomId;
        this.portAllocator = new PortAllocator(hlsConfig.basePort, hlsConfig.maxPort);
    }
    /**
     * Clean up all HLS files (static method for server startup)
     */
    static async cleanupAll() {
        try {
            // Use absolute path to be sure
            const playlistDir = path.resolve(process.cwd(), hlsConfig.playlistDir);
            console.log(`[HLS] Cleanup starting for directory: ${playlistDir}`);
            logger.info(`Cleaning up HLS directory: ${playlistDir}`);
            // 1. Kill any zombie FFmpeg processes to free up UDP ports
            try {
                logger.info('Killing zombie FFmpeg processes...');
                await execAsync('pkill -f ffmpeg');
                // Wait a moment for ports to be released
                await new Promise(resolve => setTimeout(resolve, 1000));
                logger.info('FFmpeg processes killed.');
            }
            catch (e) {
                // Ignore error if no processes found
                logger.info('No FFmpeg processes found to kill (clean slate).');
            }
            // recursive: true, force: true prevents errors if dir doesn't exist
            await fs.rm(playlistDir, { recursive: true, force: true });
            await fs.mkdir(playlistDir, { recursive: true });
            console.log('[HLS] Cleanup completed successfully');
            logger.info('HLS directory cleaned successfully');
        }
        catch (error) {
            console.error('[HLS] Cleanup FAILED:', error);
            logger.error('Failed to cleanup HLS directory:', error);
        }
    }
    /**
     * Restart the HLS pipeline with current producers
     * This is called when producers join/leave or start/stop producing
     */
    async restartPipeline(producers) {
        logger.info(`Restarting HLS pipeline for room ${this.roomId} with ${producers.size} producers`);
        // Log each producer
        for (const [peerId, info] of producers.entries()) {
            logger.info(`  Producer: ${peerId}, hasVideo=${!!info.videoProducer}, hasAudio=${!!info.audioProducer}`);
        }
        // Filter producers that have both video and audio
        const fullProducers = Array.from(producers.values()).filter((p) => p.videoProducer && p.audioProducer);
        if (fullProducers.length === 0) {
            logger.info('No producers with both video and audio, stopping HLS pipeline completely');
            // Perform complete cleanup when no producers remain
            await this.cleanup();
            await this.destroy();
            return;
        }
        // Step 1: Cleanup old pipeline before starting new one
        await this.cleanup();
        // Step 2: Allocate ports for all users
        const userPorts = this.portAllocator.allocateForUsers(fullProducers.map((p) => p.peerId));
        // Step 3: Create PlainTransports for each user
        const plainTransports = await this.createPlainTransports(userPorts);
        // Step 4: Start FFmpeg process
        const outputPath = path.join(hlsConfig.playlistDir, this.roomId);
        await fs.mkdir(outputPath, { recursive: true });
        // Create variant directories for multi-quality streaming
        await fs.mkdir(path.join(outputPath, 'v0'), { recursive: true });
        await fs.mkdir(path.join(outputPath, 'v1'), { recursive: true });
        // Generate filter complex for multi-user grid layout
        const filterComplex = FilterComplexBuilder.build(fullProducers.length);
        logger.info(`Generated filter complex for ${fullProducers.length} user(s)`);
        const ffmpeg = new FFmpegProcess('', outputPath, filterComplex); // SDP path will be set later
        // CRITICAL: Save FFmpeg to currentPipeline BEFORE starting it
        // This ensures cleanup() can find and kill it if needed
        this.currentPipeline = {
            ffmpegProcess: null, // Will be set immediately from start()
            plainTransports: new Map(),
            consumers: new Map(),
            sdpFilePath: '',
            playlistPath: `${outputPath}/playlist.m3u8`,
        };
        // Step 5: Connect PlainTransports (before consumers)
        await this.connectPlainTransports(plainTransports);
        // Step 6: Create consumers for each producer (PAUSED initially)
        logger.info(`Creating consumers for ${fullProducers.length} producers`);
        for (const producer of fullProducers) {
            logger.info(`Producer ${producer.peerId}: video=${producer.videoProducer?.id}, audio=${producer.audioProducer?.id}`);
        }
        const consumers = await this.createConsumers(fullProducers, plainTransports);
        logger.info(`Created ${consumers.size} consumer pairs (paused)`);
        // Step 7: Write SINGLE SDP file with all media sections
        const sdpDir = path.join(hlsConfig.sdpDir, this.roomId);
        // DEBUG: Log what we're passing to SDP generator
        const consumerArray = Array.from(consumers.values());
        logger.info(`Passing ${consumerArray.length} consumers to SDP generator`);
        consumerArray.forEach((c, i) => {
            logger.info(`  Consumer ${i}: peerId=${c.peerId}, hasVideo=${!!c.videoConsumer}, hasAudio=${!!c.audioConsumer}`);
        });
        const sdpPath = await SDPGenerator.generateFile(consumerArray, userPorts.map(up => ({ video: up.video, audio: up.audio })), sdpDir);
        this.currentPipeline.sdpFilePath = sdpPath;
        // Update FFmpeg with single SDP path
        ffmpeg.setSdpPath(sdpPath);
        // DEBUG: Log the SDP content to verify H264 params
        const sdpContent = await fs.readFile(sdpPath, 'utf8');
        logger.info('Generated SDP Content:\n' + sdpContent);
        // Step 8: Start FFmpeg FIRST to bind UDP ports
        logger.info('Starting FFmpeg...');
        const process = await ffmpeg.start();
        // CRITICAL: Save the process reference IMMEDIATELY
        this.currentPipeline.ffmpegProcess = process;
        if (!this.currentPipeline.ffmpegProcess) {
            logger.error('FFmpeg process is null after start()!');
        }
        else {
            logger.info(`FFmpeg process saved with PID: ${this.currentPipeline.ffmpegProcess.pid}`);
        }
        // VITAL: Wait 500ms for FFmpeg to initialize and bind UDP ports
        logger.info('Waiting 500ms for FFmpeg to warm up...');
        await new Promise(resolve => setTimeout(resolve, 500));
        // Step 9: RESUME consumers and Request Keyframes NOW that FFmpeg is listening
        logger.info('FFmpeg ready. Resuming consumers and requesting keyframes...');
        await this.resumeAndRequestKeyframes(consumers);
        // Manually write master playlist
        const masterPlaylistContent = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-STREAM-INF:BANDWIDTH=2500000,RESOLUTION=1280x720,NAME="720p"
playlist.m3u8
`;
        await fs.writeFile(path.join(outputPath, 'index.m3u8'), masterPlaylistContent);
        logger.info('Manually wrote index.m3u8 master playlist using flat structure');
        // Step 10: Update pipeline state
        this.currentPipeline.plainTransports = plainTransports;
        this.currentPipeline.consumers = consumers;
        logger.info('HLS pipeline restarted successfully');
    }
    /**
     * Create PlainTransports for all users
     */
    async createPlainTransports(userPorts) {
        const transports = new Map();
        for (const user of userPorts) {
            // Create video transport
            const videoTransport = await this.router.createPlainTransport({
                listenIp: { ip: '127.0.0.1', announcedIp: '127.0.0.1' },
                rtcpMux: false,
                comedia: false,
            });
            // Create audio transport
            const audioTransport = await this.router.createPlainTransport({
                listenIp: { ip: '127.0.0.1', announcedIp: '127.0.0.1' },
                rtcpMux: false,
                comedia: false,
            });
            transports.set(user.peerId, {
                peerId: user.peerId,
                videoTransport,
                audioTransport,
                videoPorts: user.video,
                audioPorts: user.audio,
            });
        }
        logger.debug(`Created ${transports.size} PlainTransport pairs`);
        return transports;
    }
    /**
     * Connect PlainTransports to send RTP to FFmpeg
     */
    async connectPlainTransports(transports) {
        for (const [peerId, pair] of transports) {
            const videoTuple = pair.videoTransport.tuple;
            const audioTuple = pair.audioTransport.tuple;
            logger.info(`Video transport listening on ${videoTuple.localIp}:${videoTuple.localPort}`);
            logger.info(`Audio transport listening on ${audioTuple.localIp}:${audioTuple.localPort}`);
            await pair.videoTransport.connect({
                ip: '127.0.0.1',
                port: pair.videoPorts.rtp,
                rtcpPort: pair.videoPorts.rtcp,
            });
            await pair.audioTransport.connect({
                ip: '127.0.0.1',
                port: pair.audioPorts.rtp,
                rtcpPort: pair.audioPorts.rtcp,
            });
            logger.info(`Connected PlainTransports for peer ${peerId} to send to ports ${pair.videoPorts.rtp}/${pair.audioPorts.rtp}`);
        }
    }
    /**
     * Create consumers for each producer on the PlainTransports
     * CRITICAL: Returns consumers PAUSED. Do not resume here.
     */
    async createConsumers(producers, transports) {
        const consumers = new Map();
        for (const producer of producers) {
            const transportPair = transports.get(producer.peerId);
            if (!transportPair)
                continue;
            if (!producer.videoProducer || !producer.audioProducer)
                continue;
            // Create video consumer (PAUSED)
            const videoConsumer = await transportPair.videoTransport.consume({
                producerId: producer.videoProducer.id,
                rtpCapabilities: this.router.rtpCapabilities,
                paused: true, // CRITICAL: Start paused
            });
            // Create audio consumer (PAUSED)
            const audioConsumer = await transportPair.audioTransport.consume({
                producerId: producer.audioProducer.id,
                rtpCapabilities: this.router.rtpCapabilities,
                paused: true, // CRITICAL: Start paused
            });
            consumers.set(producer.peerId, {
                peerId: producer.peerId,
                videoConsumer,
                audioConsumer,
            });
        }
        return consumers;
    }
    /**
     * Resume consumers and request keyframes
     * Called AFTER FFmpeg is running and listening
     */
    async resumeAndRequestKeyframes(consumers) {
        for (const [peerId, pair] of consumers) {
            logger.info(`Resuming consumers for peer ${peerId}`);
            // Resume consumers (Data starts flowing)
            if (pair.videoConsumer) {
                await pair.videoConsumer.resume();
                // Request keyframe for immediate playback
                this.requestKeyframeWithRetry(pair.videoConsumer).catch(err => logger.warn(`Failed to request keyframe for ${peerId}:`, err));
            }
            if (pair.audioConsumer) {
                await pair.audioConsumer.resume();
            }
        }
    }
    /**
     * Request keyframe with retry mechanism
     */
    async requestKeyframeWithRetry(consumer, retries = 5) {
        for (let i = 0; i < retries; i++) {
            try {
                await consumer.requestKeyFrame();
                logger.info(`Requested keyframe for consumer ${consumer.id} (attempt ${i + 1}/${retries})`);
                await new Promise((resolve) => setTimeout(resolve, 500));
            }
            catch (error) {
                logger.warn(`Failed to request keyframe (attempt ${i + 1}):`, error);
            }
        }
    }
    /**
   * Cleanup current pipeline
   */
    async cleanup() {
        if (!this.currentPipeline) {
            logger.info('No existing pipeline to clean up');
            return;
        }
        logger.info('Cleaning up old HLS pipeline');
        // CRITICAL: Stop FFmpeg FIRST to release UDP ports
        if (this.currentPipeline.ffmpegProcess) {
            try {
                logger.info('Stopping old FFmpeg process gracefully');
                const ffmpegProcess = this.currentPipeline.ffmpegProcess;
                if (ffmpegProcess.stop) {
                    await ffmpegProcess.stop();
                }
                else {
                    ffmpegProcess.kill('SIGTERM');
                }
                logger.info('FFmpeg process stopped, ports should be released');
                // Wait for OS to fully release UDP ports
                await new Promise(resolve => setTimeout(resolve, 1000));
                logger.info('Waited for port release');
            }
            catch (error) {
                logger.warn('Error stopping FFmpeg:', error);
            }
        }
        // Close PlainTransports
        for (const [peerId, pair] of this.currentPipeline.plainTransports) {
            try {
                pair.videoTransport.close();
                pair.audioTransport.close();
            }
            catch (error) {
                logger.warn(`Error closing transports for peer ${peerId}:`, error);
            }
        }
        // Release ports AFTER FFmpeg is dead
        this.portAllocator.releaseAll();
        logger.info('Ports released after FFmpeg cleanup');
        // Wait for ports to be fully released by the OS
        await new Promise(resolve => setTimeout(resolve, 1000));
        this.currentPipeline = null;
    }
    /**
     * Get current playlist path
     */
    getPlaylistPath() {
        return this.currentPipeline?.playlistPath || null;
    }
    /**
     * Check if pipeline is running
     */
    isRunning() {
        return this.currentPipeline !== null;
    }
    /**
     * Destroy HLS manager and cleanup resources
     */
    async destroy() {
        await this.cleanup();
        // Remove HLS directory
        try {
            const outputPath = path.join(hlsConfig.playlistDir, this.roomId);
            await fs.rm(outputPath, { recursive: true, force: true });
            logger.info(`Removed HLS directory for room ${this.roomId}`);
        }
        catch (error) {
            logger.warn(`Failed to remove HLS directory for room ${this.roomId}:`, error);
        }
    }
}
//# sourceMappingURL=HLSManager.js.map