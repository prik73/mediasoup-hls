import type { ConsumerPair } from '../state/types.js';
/**
 * Generates SDP files for FFmpeg to consume RTP streams
 * Uses SINGLE SDP file with multiple media sections (like reference implementation)
 * This avoids the protocol whitelist bug with multiple -i inputs
 */
export declare class SDPGenerator {
    /**
     * Generate a SINGLE SDP file with multiple media sections
     * Returns the SDP file path
     *
     * Based on reference implementation: one SDP, multiple m= sections
     */
    static generateFile(consumers: ConsumerPair[], ports: {
        video: {
            rtp: number;
            rtcp: number;
        };
        audio: {
            rtp: number;
            rtcp: number;
        };
    }[], outputDir: string): Promise<string>;
    /**
     * Generate SDP content with multiple media sections in ONE file
     * Format:
     * v=0
     * o=...
     * s=...
     * t=...
     * m=video ... (User 1 video)
     * m=audio ... (User 1 audio)
     * m=video ... (User 2 video)
     * m=audio ... (User 2 audio)
     */
    private static generateMultiStreamSDP;
}
//# sourceMappingURL=SDPGenerator.d.ts.map