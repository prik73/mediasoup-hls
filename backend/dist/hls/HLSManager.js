import * as fs from 'fs/promises';
import * as path from 'path';
import { PortAllocator } from './PortAllocator.js';
import { SDPGenerator } from './SDPGenerator.js';
import { FFmpegProcess } from './FFmpegProcess.js';
import { logger } from '../utils/logger.js';
import { hlsConfig } from '../config/mediasoup.config.js';
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
     * Restart the HLS pipeline with current producers
     * This is called when producers join/leave or start/stop producing
     */
    async restartPipeline(producers) {
        logger.info(`Restarting HLS pipeline for room ${this.roomId} with ${producers.size} producers`);
        // Step 1: Cleanup old pipeline
        await this.cleanup();
        // Filter producers that have both video and audio
        const fullProducers = Array.from(producers.values()).filter((p) => p.videoProducer && p.audioProducer);
        if (fullProducers.length === 0) {
            logger.info('No producers with both video and audio, skipping HLS pipeline');
            return;
        }
        // Step 2: Allocate ports for all users
        const peerIds = fullProducers.map((p) => p.peerId);
        const userPorts = this.portAllocator.allocateForUsers(peerIds);
        // Step 3: Create PlainTransports (don't connect yet)
        const plainTransports = await this.createPlainTransports(userPorts);
        // Step 4: Write SDP file
        const sdpPath = await this.writeSDP(userPorts);
        // Step 5: Create output directory and start FFmpeg
        const outputPath = path.join(hlsConfig.playlistDir, this.roomId);
        await fs.mkdir(outputPath, { recursive: true });
        const ffmpeg = new FFmpegProcess(sdpPath, outputPath);
        await ffmpeg.start();
        // Step 6: Connect PlainTransports (after FFmpeg is listening)
        await this.connectPlainTransports(plainTransports);
        // Step 7: Create consumers for each producer
        const consumers = await this.createConsumers(fullProducers, plainTransports);
        // Step 8: Save pipeline state
        this.currentPipeline = {
            ffmpegProcess: ffmpeg.isRunning() ? ffmpeg.process : null,
            plainTransports,
            consumers,
            sdpFilePath: sdpPath,
            playlistPath: `${outputPath}/playlist.m3u8`,
        };
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
     * Write SDP file to disk
     */
    async writeSDP(userPorts) {
        const sdpContent = SDPGenerator.generate(userPorts);
        const sdpDir = path.join(hlsConfig.sdpDir, this.roomId);
        await fs.mkdir(sdpDir, { recursive: true });
        const sdpPath = path.join(sdpDir, 'stream.sdp');
        await fs.writeFile(sdpPath, sdpContent);
        logger.debug(`Wrote SDP file to ${sdpPath}`);
        return sdpPath;
    }
    /**
     * Connect PlainTransports to their assigned ports
     */
    async connectPlainTransports(transports) {
        for (const [peerId, pair] of transports) {
            // Connect video transport
            await pair.videoTransport.connect({
                ip: '127.0.0.1',
                port: pair.videoPorts.rtp,
                rtcpPort: pair.videoPorts.rtcp,
            });
            // Connect audio transport
            await pair.audioTransport.connect({
                ip: '127.0.0.1',
                port: pair.audioPorts.rtp,
                rtcpPort: pair.audioPorts.rtcp,
            });
            logger.debug(`Connected PlainTransports for peer ${peerId}`);
        }
    }
    /**
     * Create consumers for all producers with keyframe retry
     */
    async createConsumers(producers, transports) {
        const consumers = new Map();
        for (const producer of producers) {
            const transportPair = transports.get(producer.peerId);
            if (!transportPair)
                continue;
            // Create video consumer
            const videoConsumer = producer.videoProducer
                ? await transportPair.videoTransport.consume({
                    producerId: producer.videoProducer.id,
                    rtpCapabilities: this.router.rtpCapabilities,
                    paused: false,
                })
                : null;
            // Request keyframe for video (with retry)
            if (videoConsumer) {
                await this.requestKeyframeWithRetry(videoConsumer);
            }
            // Create audio consumer
            const audioConsumer = producer.audioProducer
                ? await transportPair.audioTransport.consume({
                    producerId: producer.audioProducer.id,
                    rtpCapabilities: this.router.rtpCapabilities,
                    paused: false,
                })
                : null;
            consumers.set(producer.peerId, {
                peerId: producer.peerId,
                videoConsumer,
                audioConsumer,
            });
            logger.debug(`Created consumers for peer ${producer.peerId}`);
        }
        return consumers;
    }
    /**
     * Request keyframe with retry mechanism
     * Ensures fast HLS startup by requesting intra-frames
     */
    async requestKeyframeWithRetry(consumer, retries = 3) {
        for (let i = 0; i < retries; i++) {
            try {
                await consumer.requestKeyFrame();
                logger.debug(`Requested keyframe for consumer ${consumer.id} (attempt ${i + 1})`);
                await new Promise((resolve) => setTimeout(resolve, 100));
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
        if (!this.currentPipeline)
            return;
        logger.info('Cleaning up old HLS pipeline');
        // Kill FFmpeg
        if (this.currentPipeline.ffmpegProcess) {
            try {
                this.currentPipeline.ffmpegProcess.kill('SIGKILL');
            }
            catch (error) {
                logger.warn('Error killing FFmpeg:', error);
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
        // Release ports
        this.portAllocator.releaseAll();
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
    }
}
//# sourceMappingURL=HLSManager.js.map