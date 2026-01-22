import type { ConsumerPair } from '../state/types.js';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * Generates SDP files for FFmpeg to consume RTP streams
 * Uses SINGLE SDP file with multiple media sections (like reference implementation)
 * This avoids the protocol whitelist bug with multiple -i inputs
 */
export class SDPGenerator {
    /**
     * Generate a SINGLE SDP file with multiple media sections
     * Returns the SDP file path
     * 
     * Based on reference implementation: one SDP, multiple m= sections
     */
    static async generateFile(
        consumers: ConsumerPair[],
        ports: { video: { rtp: number; rtcp: number }; audio: { rtp: number; rtcp: number } }[],
        outputDir: string
    ): Promise<string> {
        await fs.mkdir(outputDir, { recursive: true });

        // Generate single SDP content with all media sections
        const sdpContent = this.generateMultiStreamSDP(consumers, ports);
        const sdpPath = path.join(outputDir, 'stream.sdp');

        await fs.writeFile(sdpPath, sdpContent);

        return sdpPath;
    }

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
    private static generateMultiStreamSDP(
        consumers: ConsumerPair[],
        ports: { video: { rtp: number; rtcp: number }; audio: { rtp: number; rtcp: number } }[]
    ): string {
        const sdpLines: string[] = [
            'v=0',
            'o=- 0 0 IN IP4 127.0.0.1',
            's=Mediasoup HLS Stream',
            'c=IN IP4 127.0.0.1',
            't=0 0',
        ];

        // Add all media sections to the SAME SDP file
        console.log(`[SDPGenerator] Generating SDP for ${consumers.length} consumers`);
        for (let i = 0; i < consumers.length; i++) {
            const consumer = consumers[i];
            const port = ports[i];

            console.log(`[SDPGenerator] Adding media for consumer ${i}: peerId=${consumer.peerId}`);

            // Video media section
            if (consumer.videoConsumer) {
                const videoParams = consumer.videoConsumer.rtpParameters;
                const videoCodec = videoParams.codecs[0];
                const payloadType = videoCodec.payloadType;

                sdpLines.push(
                    `m=video ${port.video.rtp} RTP/AVP ${payloadType}`,
                    `a=rtpmap:${payloadType} ${videoCodec.mimeType.split('/')[1]}/${videoCodec.clockRate}`,
                    `a=fmtp:${payloadType} ${Object.entries(videoCodec.parameters || {}).map(([k, v]) => `${k}=${v}`).join(';')}`,
                    `a=rtcp:${port.video.rtcp} IN IP4 127.0.0.1`
                );
            }

            // Audio media section
            if (consumer.audioConsumer) {
                const audioParams = consumer.audioConsumer.rtpParameters;
                const audioCodec = audioParams.codecs[0];
                const payloadType = audioCodec.payloadType;
                const channels = audioCodec.channels || 2;

                sdpLines.push(
                    `m=audio ${port.audio.rtp} RTP/AVP ${payloadType}`,
                    `a=rtpmap:${payloadType} ${audioCodec.mimeType.split('/')[1]}/${audioCodec.clockRate}/${channels}`,
                    `a=rtcp:${port.audio.rtcp} IN IP4 127.0.0.1`
                );
            }
        }

        return sdpLines.join('\n') + '\n';
    }
}
