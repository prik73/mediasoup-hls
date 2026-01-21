import type { WebRtcTransport, Producer } from 'mediasoup/node/lib/types.js';
/**
 * Create a producer on a transport
 */
export declare function createProducer(transport: WebRtcTransport, kind: 'audio' | 'video', rtpParameters: any): Promise<Producer>;
//# sourceMappingURL=producer.d.ts.map