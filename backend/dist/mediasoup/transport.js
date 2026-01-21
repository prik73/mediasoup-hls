import { mediasoupConfig } from '../config/mediasoup.config.js';
import { logger } from '../utils/logger.js';
import { TransportError } from '../utils/errors.js';
/**
 * Create WebRTC transport for producers or consumers
 */
export async function createWebRtcTransport(router) {
    try {
        const transport = await router.createWebRtcTransport(mediasoupConfig.webRtcTransport);
        logger.debug(`WebRTC transport created [id:${transport.id}]`);
        return transport;
    }
    catch (error) {
        logger.error('Failed to create WebRTC transport:', error);
        throw new TransportError('Failed to create WebRTC transport');
    }
}
/**
 * Connect WebRTC transport with DTLS parameters
 */
export async function connectWebRtcTransport(transport, dtlsParameters) {
    try {
        await transport.connect({ dtlsParameters });
        logger.debug(`WebRTC transport connected [id:${transport.id}]`);
    }
    catch (error) {
        logger.error('Failed to connect WebRTC transport:', error);
        throw new TransportError('Failed to connect WebRTC transport');
    }
}
//# sourceMappingURL=transport.js.map