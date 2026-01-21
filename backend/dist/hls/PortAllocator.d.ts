import type { UserPorts } from '../state/types.js';
/**
 * Manages a pool of RTP/RTCP ports for PlainTransports
 * Prevents port conflicts by tracking allocated ports
 */
export declare class PortAllocator {
    private basePort;
    private maxPort;
    private allocatedPorts;
    constructor(basePort?: number, maxPort?: number);
    /**
     * Allocate ports for multiple users (video + audio per user)
     * Each user needs 4 ports: video RTP, video RTCP, audio RTP, audio RTCP
     */
    allocateForUsers(peerIds: string[]): UserPorts[];
    /**
     * Allocate a pair of ports (RTP and RTCP)
     */
    private allocatePair;
    /**
     * Allocate a single port
     */
    private allocateSingle;
    /**
     * Release ports for a user
     */
    releaseForUser(userPorts: UserPorts): void;
    /**
     * Release all allocated ports
     */
    releaseAll(): void;
    /**
     * Get number of allocated ports
     */
    getAllocatedCount(): number;
}
//# sourceMappingURL=PortAllocator.d.ts.map