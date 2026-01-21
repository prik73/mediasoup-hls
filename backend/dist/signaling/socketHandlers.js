import { roomManager } from '../state/RoomManager.js';
import { createWebRtcTransport, connectWebRtcTransport } from '../mediasoup/transport.js';
import { createProducer } from '../mediasoup/producer.js';
import { logger } from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';
// Store socket metadata
const socketRooms = new Map(); // socketId -> roomId
const socketPeers = new Map(); // socketId -> peerId
const peerTransports = new Map(); // peerId -> { producer: transport, consumer: transport }
const peerProducers = new Map(); // peerId -> producers
/**
 * Setup Socket.IO event handlers
 */
export function setupSocketHandlers(io) {
    io.on('connection', (socket) => {
        logger.info(`Client connected: ${socket.id}`);
        // Generate peer ID for this socket
        const peerId = uuidv4();
        socketPeers.set(socket.id, peerId);
        /**
         * Create a new room
         */
        socket.on('createRoom', async (callback) => {
            try {
                const roomId = uuidv4();
                await roomManager.createRoom(roomId);
                socketRooms.set(socket.id, roomId);
                socket.join(roomId);
                logger.info(`Room created: ${roomId} by ${peerId}`);
                callback({ roomId });
            }
            catch (error) {
                logger.error('Error creating room:', error);
                callback({ error: error.message });
            }
        });
        /**
         * Join an existing room
         */
        socket.on('joinRoom', async ({ roomId }, callback) => {
            try {
                const room = roomManager.getRoom(roomId);
                if (!room) {
                    callback({ error: 'Room not found' });
                    return;
                }
                socketRooms.set(socket.id, roomId);
                socket.join(roomId);
                logger.info(`Peer ${peerId} joined room ${roomId}`);
                callback({ roomId });
            }
            catch (error) {
                logger.error('Error joining room:', error);
                callback({ error: error.message });
            }
        });
        /**
         * Get router RTP capabilities
         */
        socket.on('getRouterRtpCapabilities', (callback) => {
            try {
                const roomId = socketRooms.get(socket.id);
                if (!roomId) {
                    callback({ error: 'Not in a room' });
                    return;
                }
                const room = roomManager.getRoom(roomId);
                if (!room) {
                    callback({ error: 'Room not found' });
                    return;
                }
                callback({ rtpCapabilities: room.router.rtpCapabilities });
            }
            catch (error) {
                logger.error('Error getting RTP capabilities:', error);
                callback({ error: error.message });
            }
        });
        /**
         * Create producer transport
         */
        socket.on('createProducerTransport', async (callback) => {
            try {
                const roomId = socketRooms.get(socket.id);
                if (!roomId) {
                    callback({ error: 'Not in a room' });
                    return;
                }
                const room = roomManager.getRoom(roomId);
                if (!room) {
                    callback({ error: 'Room not found' });
                    return;
                }
                const transport = await createWebRtcTransport(room.router);
                // Store transport
                if (!peerTransports.has(peerId)) {
                    peerTransports.set(peerId, {});
                }
                peerTransports.get(peerId).producer = transport;
                callback({
                    id: transport.id,
                    iceParameters: transport.iceParameters,
                    iceCandidates: transport.iceCandidates,
                    dtlsParameters: transport.dtlsParameters,
                });
            }
            catch (error) {
                logger.error('Error creating producer transport:', error);
                callback({ error: error.message });
            }
        });
        /**
         * Connect producer transport
         */
        socket.on('connectProducerTransport', async ({ dtlsParameters }, callback) => {
            try {
                const transport = peerTransports.get(peerId)?.producer;
                if (!transport) {
                    callback({ error: 'Transport not found' });
                    return;
                }
                await connectWebRtcTransport(transport, dtlsParameters);
                callback({ connected: true });
            }
            catch (error) {
                logger.error('Error connecting producer transport:', error);
                callback({ error: error.message });
            }
        });
        /**
         * Produce media (audio or video)
         */
        socket.on('produce', async ({ kind, rtpParameters }, callback) => {
            try {
                const roomId = socketRooms.get(socket.id);
                if (!roomId) {
                    callback({ error: 'Not in a room' });
                    return;
                }
                const transport = peerTransports.get(peerId)?.producer;
                if (!transport) {
                    callback({ error: 'Transport not found' });
                    return;
                }
                const producer = await createProducer(transport, kind, rtpParameters);
                // Store producer
                if (!peerProducers.has(peerId)) {
                    peerProducers.set(peerId, { video: null, audio: null });
                }
                if (kind === 'video') {
                    peerProducers.get(peerId).video = producer;
                }
                else {
                    peerProducers.get(peerId).audio = producer;
                }
                // Update room manager
                const producers = peerProducers.get(peerId);
                const producerInfo = {
                    peerId,
                    videoProducer: producers.video,
                    audioProducer: producers.audio,
                    transport,
                };
                roomManager.addProducer(roomId, peerId, producerInfo);
                // Trigger HLS restart if both video and audio are present
                if (producers.video && producers.audio) {
                    await roomManager.restartHLS(roomId);
                    // Notify all clients in room
                    io.to(roomId).emit('roomProducersChanged', {
                        producers: Array.from(roomManager.getProducers(roomId).keys()),
                    });
                }
                callback({ id: producer.id });
            }
            catch (error) {
                logger.error('Error producing:', error);
                callback({ error: error.message });
            }
        });
        /**
         * Stop producing
         */
        socket.on('stopProducing', async (callback) => {
            try {
                const roomId = socketRooms.get(socket.id);
                if (!roomId) {
                    callback({ error: 'Not in a room' });
                    return;
                }
                const producers = peerProducers.get(peerId);
                if (producers) {
                    producers.video?.close();
                    producers.audio?.close();
                    peerProducers.delete(peerId);
                }
                roomManager.removeProducer(roomId, peerId);
                // Restart HLS without this producer
                await roomManager.restartHLS(roomId);
                // Notify all clients
                io.to(roomId).emit('roomProducersChanged', {
                    producers: Array.from(roomManager.getProducers(roomId).keys()),
                });
                callback({ stopped: true });
            }
            catch (error) {
                logger.error('Error stopping production:', error);
                callback({ error: error.message });
            }
        });
        /**
         * List producers in room
         */
        socket.on('listProducers', (callback) => {
            try {
                const roomId = socketRooms.get(socket.id);
                if (!roomId) {
                    callback({ error: 'Not in a room' });
                    return;
                }
                const producers = roomManager.getProducers(roomId);
                const producerList = Array.from(producers.entries()).map(([peerId, info]) => ({
                    peerId,
                    hasVideo: !!info.videoProducer,
                    hasAudio: !!info.audioProducer,
                }));
                callback({ producers: producerList });
            }
            catch (error) {
                logger.error('Error listing producers:', error);
                callback({ error: error.message });
            }
        });
        /**
         * Create consumer transport
         */
        socket.on('createConsumerTransport', async (callback) => {
            try {
                const roomId = socketRooms.get(socket.id);
                if (!roomId) {
                    callback({ error: 'Not in a room' });
                    return;
                }
                const room = roomManager.getRoom(roomId);
                if (!room) {
                    callback({ error: 'Room not found' });
                    return;
                }
                const transport = await createWebRtcTransport(room.router);
                // Store transport
                if (!peerTransports.has(peerId)) {
                    peerTransports.set(peerId, {});
                }
                peerTransports.get(peerId).consumer = transport;
                callback({
                    id: transport.id,
                    iceParameters: transport.iceParameters,
                    iceCandidates: transport.iceCandidates,
                    dtlsParameters: transport.dtlsParameters,
                });
            }
            catch (error) {
                logger.error('Error creating consumer transport:', error);
                callback({ error: error.message });
            }
        });
        /**
         * Connect consumer transport
         */
        socket.on('connectConsumerTransport', async ({ dtlsParameters }, callback) => {
            try {
                const transport = peerTransports.get(peerId)?.consumer;
                if (!transport) {
                    callback({ error: 'Transport not found' });
                    return;
                }
                await connectWebRtcTransport(transport, dtlsParameters);
                callback({ connected: true });
            }
            catch (error) {
                logger.error('Error connecting consumer transport:', error);
                callback({ error: error.message });
            }
        });
        /**
         * Consume media from a producer
         */
        socket.on('consume', async ({ producerId, rtpCapabilities }, callback) => {
            try {
                const roomId = socketRooms.get(socket.id);
                if (!roomId) {
                    callback({ error: 'Not in a room' });
                    return;
                }
                const room = roomManager.getRoom(roomId);
                if (!room) {
                    callback({ error: 'Room not found' });
                    return;
                }
                const transport = peerTransports.get(peerId)?.consumer;
                if (!transport) {
                    callback({ error: 'Transport not found' });
                    return;
                }
                // Check if can consume
                if (!room.router.canConsume({ producerId, rtpCapabilities })) {
                    callback({ error: 'Cannot consume' });
                    return;
                }
                const consumer = await transport.consume({
                    producerId,
                    rtpCapabilities,
                    paused: false,
                });
                callback({
                    id: consumer.id,
                    producerId,
                    kind: consumer.kind,
                    rtpParameters: consumer.rtpParameters,
                });
            }
            catch (error) {
                logger.error('Error consuming:', error);
                callback({ error: error.message });
            }
        });
        /**
         * Handle disconnect
         */
        socket.on('disconnect', async () => {
            logger.info(`Client disconnected: ${socket.id}`);
            const roomId = socketRooms.get(socket.id);
            if (roomId) {
                // Clean up producers
                const producers = peerProducers.get(peerId);
                if (producers) {
                    producers.video?.close();
                    producers.audio?.close();
                    peerProducers.delete(peerId);
                }
                // Remove from room manager
                roomManager.removeProducer(roomId, peerId);
                // Restart HLS
                try {
                    await roomManager.restartHLS(roomId);
                    // Notify remaining clients
                    io.to(roomId).emit('roomProducersChanged', {
                        producers: Array.from(roomManager.getProducers(roomId).keys()),
                    });
                }
                catch (error) {
                    logger.error('Error restarting HLS on disconnect:', error);
                }
            }
            // Cleanup
            socketRooms.delete(socket.id);
            socketPeers.delete(socket.id);
            peerTransports.delete(peerId);
        });
    });
}
//# sourceMappingURL=socketHandlers.js.map