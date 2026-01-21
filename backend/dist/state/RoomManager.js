import { createRouter, closeRouter } from '../mediasoup/router.js';
import { HLSManager } from '../hls/HLSManager.js';
import { logger } from '../utils/logger.js';
import { RoomError } from '../utils/errors.js';
/**
 * Manages all rooms and their state
 * Tracks producers, consumers, and HLS pipelines
 */
export class RoomManager {
    rooms = new Map();
    /**
     * Create a new room
     */
    async createRoom(roomId) {
        if (this.rooms.has(roomId)) {
            throw new RoomError(`Room ${roomId} already exists`);
        }
        const router = await createRouter(roomId);
        const room = {
            id: roomId,
            router,
            producers: new Map(),
            hlsPipeline: null,
        };
        this.rooms.set(roomId, room);
        logger.info(`Room created: ${roomId}`);
        return room;
    }
    /**
     * Get a room by ID
     */
    getRoom(roomId) {
        return this.rooms.get(roomId);
    }
    /**
     * Add producer to room
     */
    addProducer(roomId, peerId, producerInfo) {
        const room = this.getRoom(roomId);
        if (!room) {
            throw new RoomError(`Room ${roomId} not found`);
        }
        room.producers.set(peerId, producerInfo);
        logger.debug(`Producer added to room ${roomId}: ${peerId}`);
    }
    /**
     * Remove producer from room
     */
    removeProducer(roomId, peerId) {
        const room = this.getRoom(roomId);
        if (!room)
            return;
        const producerInfo = room.producers.get(peerId);
        if (producerInfo) {
            // Close producers
            producerInfo.videoProducer?.close();
            producerInfo.audioProducer?.close();
            producerInfo.transport.close();
            room.producers.delete(peerId);
            logger.debug(`Producer removed from room ${roomId}: ${peerId}`);
        }
    }
    /**
     * Get all producers in a room
     */
    getProducers(roomId) {
        const room = this.getRoom(roomId);
        return room?.producers || new Map();
    }
    /**
     * Trigger HLS pipeline restart for a room
     */
    async restartHLS(roomId) {
        const room = this.getRoom(roomId);
        if (!room) {
            throw new RoomError(`Room ${roomId} not found`);
        }
        // Create HLS manager if it doesn't exist
        if (!room.hlsPipeline) {
            const hlsManager = new HLSManager(room.router, roomId);
            await hlsManager.restartPipeline(room.producers);
        }
        else {
            // Restart existing pipeline
            const hlsManager = new HLSManager(room.router, roomId);
            await hlsManager.restartPipeline(room.producers);
        }
    }
    /**
     * Close a room and cleanup resources
     */
    async closeRoom(roomId) {
        const room = this.getRoom(roomId);
        if (!room)
            return;
        // Close all producers
        for (const [peerId, producerInfo] of room.producers) {
            producerInfo.videoProducer?.close();
            producerInfo.audioProducer?.close();
            producerInfo.transport.close();
        }
        // Close HLS pipeline
        if (room.hlsPipeline) {
            const hlsManager = new HLSManager(room.router, roomId);
            await hlsManager.destroy();
        }
        // Close router
        closeRouter(roomId);
        this.rooms.delete(roomId);
        logger.info(`Room closed: ${roomId}`);
    }
    /**
     * Get all room IDs
     */
    getRoomIds() {
        return Array.from(this.rooms.keys());
    }
}
// Singleton instance
export const roomManager = new RoomManager();
//# sourceMappingURL=RoomManager.js.map