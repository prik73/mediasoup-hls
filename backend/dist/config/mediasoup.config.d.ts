import type { WorkerSettings, RouterOptions, WebRtcTransportOptions, PlainTransportOptions } from 'mediasoup/node/lib/types.js';
export declare const mediasoupConfig: {
    worker: WorkerSettings;
    router: RouterOptions;
    webRtcTransport: WebRtcTransportOptions;
    plainTransport: PlainTransportOptions;
};
export declare const hlsConfig: {
    basePort: number;
    maxPort: number;
    sdpDir: string;
    playlistDir: string;
    segmentDuration: number;
    playlistLength: number;
};
//# sourceMappingURL=mediasoup.config.d.ts.map