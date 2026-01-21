import type { UserPorts } from '../state/types.js';
/**
 * Generates SDP files for FFmpeg to consume RTP streams
 * SDP describes the media streams (ports, codecs, etc.)
 */
export declare class SDPGenerator {
    /**
     * Generate SDP content for multiple users
     * Each user has video and audio streams
     */
    static generate(userPorts: UserPorts[]): string;
}
//# sourceMappingURL=SDPGenerator.d.ts.map