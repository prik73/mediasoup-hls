import type { Room, ProducerInfo, ConsumerInfo } from './types.js';
import { createRouter, closeRouter } from '../mediasoup/router.js';
import { HLSManager } from '../hls/HLSManager.js';
import { logger } from '../utils/logger.js';
import { RoomError } from '../utils/errors.js';

/**
 * Manages all rooms and their state
 * Tracks producers, consumers, and HLS pipelines
 */
export class RoomManager {
    private rooms: Map<string, Room> = new Map();

    /**
     * Create a new room
     */
    async createRoom(roomId: string): Promise<Room> {
        if (this.rooms.has(roomId)) {
            throw new RoomError(`Room ${roomId} already exists`);
        }

        const router = await createRouter(roomId);
        const room: Room = {
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
    getRoom(roomId: string): Room | undefined {
        return this.rooms.get(roomId);
    }

    /**
     * Add producer to room
     */
    addProducer(roomId: string, peerId: string, producerInfo: ProducerInfo): void {
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
    removeProducer(roomId: string, peerId: string): void {
        const room = this.getRoom(roomId);
        if (!room) return;

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
    getProducers(roomId: string): Map<string, ProducerInfo> {
        const room = this.getRoom(roomId);
        return room?.producers || new Map();
    }

    /**
     * Trigger HLS pipeline restart for a room
     */
    async restartHLS(roomId: string): Promise<void> {
        const room = this.getRoom(roomId);
        if (!room) {
            throw new RoomError(`Room ${roomId} not found`);
        }

        // CRITICAL: Reuse the same HLSManager instance so currentPipeline persists
        if (!room.hlsPipeline) {
            room.hlsPipeline = new HLSManager(room.router, roomId);
        }

        // Restart pipeline on the SAME instance
        await room.hlsPipeline.restartPipeline(room.producers);
    }

    /**
     * Close a room and cleanup resources
     */
    async closeRoom(roomId: string): Promise<void> {
        const room = this.getRoom(roomId);
        if (!room) return;

        // Close all producers
        for (const [peerId, producerInfo] of room.producers) {
            producerInfo.videoProducer?.close();
            producerInfo.audioProducer?.close();
            producerInfo.transport.close();
        }

        // Close HLS pipeline
        if (room.hlsPipeline) {
            await room.hlsPipeline.destroy();
        }

        // Close router
        closeRouter(roomId);

        this.rooms.delete(roomId);
        logger.info(`Room closed: ${roomId}`);
    }

    /**
     * Get number of active rooms
     */
    getRoomCount(): number {
        return this.rooms.size;
    }

    /**
     * Get all room IDs
     */
    getRoomIds(): string[] {
        return Array.from(this.rooms.keys());
    }

    /**
     * Ensure only the latest N rooms are active
     * Removes oldest rooms if limit is exceeded
     */
    async ensureRoomLimit(limit: number): Promise<void> {
        while (this.rooms.size >= limit) {
            // Map iterates in insertion order, so the first key is the oldest
            const oldestRoomId = this.rooms.keys().next().value;
            if (oldestRoomId) {
                logger.info(`Room limit reached (${limit}). Closing oldest room: ${oldestRoomId}`);
                await this.closeRoom(oldestRoomId);
            } else {
                break;
            }
        }
    }
}

// Singleton instance
export const roomManager = new RoomManager();
