import { PortAllocationError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import type { PortPair, UserPorts } from '../state/types.js';

/**
 * Manages a pool of RTP/RTCP ports for PlainTransports
 * Prevents port conflicts by tracking allocated ports
 */
export class PortAllocator {
    private basePort: number;
    private maxPort: number;
    private allocatedPorts: Set<number>;

    constructor(basePort: number = 20000, maxPort: number = 21000) {
        // Add a random offset to the start port to avoid collision with zombie processes
        // ensuring we stay even (RTP needs even ports)
        const randomOffset = Math.floor(Math.random() * 50) * 2; // 0 to 98
        this.basePort = basePort + randomOffset;
        this.maxPort = maxPort;
        this.allocatedPorts = new Set();
        logger.info(`PortAllocator initialized. Base port: ${this.basePort} (offset: ${randomOffset})`);
    }

    /**
     * Allocate ports for multiple users (video + audio per user)
     * Each user needs 4 ports: video RTP, video RTCP, audio RTP, audio RTCP
     */
    allocateForUsers(peerIds: string[]): UserPorts[] {
        const userPorts: UserPorts[] = [];

        for (const peerId of peerIds) {
            const videoPorts = this.allocatePair();
            const audioPorts = this.allocatePair();

            userPorts.push({
                peerId,
                video: videoPorts,
                audio: audioPorts,
            });
        }

        logger.debug(`Allocated ports for ${peerIds.length} users`);
        return userPorts;
    }

    /**
     * Allocate a pair of ports (RTP and RTCP)
     */
    private allocatePair(): PortPair {
        const rtp = this.allocateSingle();
        const rtcp = this.allocateSingle();
        return { rtp, rtcp };
    }

    /**
     * Allocate a single port
     */
    private allocateSingle(): number {
        for (let port = this.basePort; port < this.maxPort; port++) {
            if (!this.allocatedPorts.has(port)) {
                this.allocatedPorts.add(port);
                return port;
            }
        }
        throw new PortAllocationError('No available ports in range');
    }

    /**
     * Release ports for a user
     */
    releaseForUser(userPorts: UserPorts): void {
        this.allocatedPorts.delete(userPorts.video.rtp);
        this.allocatedPorts.delete(userPorts.video.rtcp);
        this.allocatedPorts.delete(userPorts.audio.rtp);
        this.allocatedPorts.delete(userPorts.audio.rtcp);
        logger.debug(`Released ports for user ${userPorts.peerId}`);
    }

    /**
     * Release all allocated ports
     */
    releaseAll(): void {
        this.allocatedPorts.clear();
        logger.debug('Released all ports');
    }

    /**
     * Get number of allocated ports
     */
    getAllocatedCount(): number {
        return this.allocatedPorts.size;
    }
}
