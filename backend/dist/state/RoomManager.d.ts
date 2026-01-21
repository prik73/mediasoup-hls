import type { Room, ProducerInfo } from './types.js';
/**
 * Manages all rooms and their state
 * Tracks producers, consumers, and HLS pipelines
 */
export declare class RoomManager {
    private rooms;
    /**
     * Create a new room
     */
    createRoom(roomId: string): Promise<Room>;
    /**
     * Get a room by ID
     */
    getRoom(roomId: string): Room | undefined;
    /**
     * Add producer to room
     */
    addProducer(roomId: string, peerId: string, producerInfo: ProducerInfo): void;
    /**
     * Remove producer from room
     */
    removeProducer(roomId: string, peerId: string): void;
    /**
     * Get all producers in a room
     */
    getProducers(roomId: string): Map<string, ProducerInfo>;
    /**
     * Trigger HLS pipeline restart for a room
     */
    restartHLS(roomId: string): Promise<void>;
    /**
     * Close a room and cleanup resources
     */
    closeRoom(roomId: string): Promise<void>;
    /**
     * Get all room IDs
     */
    getRoomIds(): string[];
}
export declare const roomManager: RoomManager;
//# sourceMappingURL=RoomManager.d.ts.map