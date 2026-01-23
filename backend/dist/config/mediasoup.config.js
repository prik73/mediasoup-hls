export const mediasoupConfig = {
    // Worker settings
    worker: {
        rtcMinPort: 10000,
        rtcMaxPort: 10100,
        logLevel: 'warn',
        logTags: [
            'info',
            'ice',
            'dtls',
            'rtp',
            'srtp',
            'rtcp',
        ],
    },
    // Router options
    router: {
        mediaCodecs: [
            {
                kind: 'audio',
                mimeType: 'audio/opus',
                clockRate: 48000,
                channels: 2,
            },
            // H264 FIRST - This forces browsers to use H264 which FFmpeg expects
            {
                kind: 'video',
                mimeType: 'video/H264',
                clockRate: 90000,
                parameters: {
                    'packetization-mode': 1,
                    'profile-level-id': '42e01f',
                    'level-asymmetry-allowed': 1,
                    'x-google-start-bitrate': 1000,
                },
            },
            {
                kind: 'video',
                mimeType: 'video/VP8',
                clockRate: 90000,
                parameters: {
                    'x-google-start-bitrate': 1000,
                },
            },
            {
                kind: 'video',
                mimeType: 'video/VP9',
                clockRate: 90000,
                parameters: {
                    'profile-id': 2,
                    'x-google-start-bitrate': 1000,
                },
            },
        ],
    },
    // WebRTC transport options
    webRtcTransport: {
        listenIps: [
            {
                ip: '0.0.0.0',
                announcedIp: process.env.MEDIASOUP_ANNOUNCED_IP || '127.0.0.1',
            },
        ],
        enableUdp: true,
        enableTcp: true,
        preferUdp: true,
    },
    // PlainTransport options (for FFmpeg)
    plainTransport: {
        listenIp: {
            ip: '0.0.0.0',
            announcedIp: '127.0.0.1',
        },
        rtcpMux: false,
        comedia: false,
    },
};
// HLS configuration
export const hlsConfig = {
    basePort: 20000, // Starting port for RTP/RTCP
    maxPort: 21000, // Maximum port
    sdpDir: './public/hls',
    playlistDir: './public/hls',
    segmentDuration: 2, // seconds
    playlistLength: 6, // number of segments
};
//# sourceMappingURL=mediasoup.config.js.map