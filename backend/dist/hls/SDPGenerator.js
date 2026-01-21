/**
 * Generates SDP files for FFmpeg to consume RTP streams
 * SDP describes the media streams (ports, codecs, etc.)
 */
export class SDPGenerator {
    /**
     * Generate SDP content for multiple users
     * Each user has video and audio streams
     */
    static generate(userPorts) {
        const sdpLines = [
            'v=0',
            'o=- 0 0 IN IP4 127.0.0.1',
            's=Mediasoup HLS Stream',
            't=0 0',
        ];
        // Add media descriptions for each user
        for (const user of userPorts) {
            // Video stream
            sdpLines.push(`m=video ${user.video.rtp} RTP/AVP 96`, 'c=IN IP4 127.0.0.1', 'a=rtpmap:96 H264/90000', 'a=fmtp:96 packetization-mode=1;profile-level-id=42e01f', `a=rtcp:${user.video.rtcp}`, 'a=recvonly');
            // Audio stream
            sdpLines.push(`m=audio ${user.audio.rtp} RTP/AVP 111`, 'c=IN IP4 127.0.0.1', 'a=rtpmap:111 opus/48000/2', `a=rtcp:${user.audio.rtcp}`, 'a=recvonly');
        }
        return sdpLines.join('\n') + '\n';
    }
}
//# sourceMappingURL=SDPGenerator.js.map