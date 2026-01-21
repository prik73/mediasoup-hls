import type { Router, WebRtcTransport } from 'mediasoup/node/lib/types.js';
/**
 * Create WebRTC transport for producers or consumers
 */
export declare function createWebRtcTransport(router: Router): Promise<WebRtcTransport>;
/**
 * Connect WebRTC transport with DTLS parameters
 */
export declare function connectWebRtcTransport(transport: WebRtcTransport, dtlsParameters: any): Promise<void>;
//# sourceMappingURL=transport.d.ts.map