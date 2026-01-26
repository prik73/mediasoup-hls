import type * as mediasoup from 'mediasoup';
import type { Producer, Consumer, WebRtcTransport, PlainTransport } from 'mediasoup/node/lib/types.js';
import type { ChildProcess } from 'child_process';
import type { HLSManager } from '../hls/HLSManager.js';
export interface Room {
    id: string;
    router: mediasoup.types.Router;
    producers: Map<string, ProducerInfo>;
    hlsPipeline: HLSManager | null;
}
export interface ProducerInfo {
    peerId: string;
    videoProducer: Producer | null;
    audioProducer: Producer | null;
    transport: WebRtcTransport;
}
export interface ConsumerInfo {
    peerId: string;
    videoConsumer: Consumer | null;
    audioConsumer: Consumer | null;
    transport: WebRtcTransport;
}
export interface HLSPipeline {
    ffmpegProcess: ChildProcess | null;
    plainTransports: Map<string, PlainTransportPair>;
    consumers: Map<string, ConsumerPair>;
    sdpFilePath: string;
    playlistPath: string;
}
export interface PlainTransportPair {
    peerId: string;
    videoTransport: PlainTransport;
    audioTransport: PlainTransport;
    videoPorts: PortPair;
    audioPorts: PortPair;
}
export interface ConsumerPair {
    peerId: string;
    videoConsumer: Consumer | null;
    audioConsumer: Consumer | null;
}
export interface PortPair {
    rtp: number;
    rtcp: number;
}
export interface UserPorts {
    peerId: string;
    video: PortPair;
    audio: PortPair;
}
export interface ServerToClientEvents {
    roomProducersChanged: (data: {
        producers: {
            peerId: string;
            videoProducerId?: string;
            audioProducerId?: string;
        }[];
    }) => void;
}
export interface ClientToServerEvents {
    createRoom: (data: {
        password?: string;
    }, callback: (data: {
        roomId?: string;
        peerId?: string;
        error?: string;
    }) => void) => void;
    joinRoom: (data: {
        roomId: string;
    }, callback: (data: {
        roomId?: string;
        peerId?: string;
        error?: string;
    }) => void) => void;
    getRouterRtpCapabilities: (callback: (data: {
        rtpCapabilities?: any;
        error?: string;
    }) => void) => void;
    createProducerTransport: (callback: (data: any) => void) => void;
    connectProducerTransport: (data: {
        dtlsParameters: any;
    }, callback: (data: {
        connected?: boolean;
        error?: string;
    }) => void) => void;
    produce: (data: {
        kind: 'audio' | 'video';
        rtpParameters: any;
    }, callback: (data: {
        id?: string;
        error?: string;
    }) => void) => void;
    stopProducing: (callback: (data: {
        stopped?: boolean;
        error?: string;
    }) => void) => void;
    listProducers: (callback: (data: {
        producers?: any[];
        error?: string;
    }) => void) => void;
    createConsumerTransport: (callback: (data: any) => void) => void;
    connectConsumerTransport: (data: {
        dtlsParameters: any;
    }, callback: (data: {
        connected?: boolean;
        error?: string;
    }) => void) => void;
    consume: (data: {
        producerId: string;
        rtpCapabilities: any;
    }, callback: (data: any) => void) => void;
}
//# sourceMappingURL=types.d.ts.map