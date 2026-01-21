import type { WebRtcTransport, Producer } from 'mediasoup/node/lib/types.js';
import { logger } from '../utils/logger.js';

/**
 * Create a producer on a transport
 */
export async function createProducer(
    transport: WebRtcTransport,
    kind: 'audio' | 'video',
    rtpParameters: any
): Promise<Producer> {
    try {
        const producer = await transport.produce({
            kind,
            rtpParameters,
        });

        logger.debug(`Producer created [id:${producer.id}, kind:${kind}]`);

        return producer;
    } catch (error) {
        logger.error('Failed to create producer:', error);
        throw error;
    }
}
