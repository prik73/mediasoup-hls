import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import * as mediasoupClient from 'mediasoup-client';
import { logger } from '../utils/logger';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

interface UseMediasoupProps {
    videoDeviceId?: string;
    audioDeviceId?: string;
}

/**
 * Hook to manage Mediasoup WebRTC connection
 * Handles signaling, transport creation, and media production
 */
export function useMediasoup({ videoDeviceId, audioDeviceId }: UseMediasoupProps) {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [roomId, setRoomId] = useState<string | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
    const [peerId, setPeerId] = useState<string | null>(null);
    const [isProducing, setIsProducing] = useState(false);

    const deviceRef = useRef<mediasoupClient.types.Device | null>(null);
    const producerTransportRef = useRef<mediasoupClient.types.Transport | null>(null);
    const consumerTransportRef = useRef<mediasoupClient.types.Transport | null>(null);
    const producersRef = useRef<{ video: any; audio: any }>({ video: null, audio: null });

    // Initialize socket connection
    useEffect(() => {
        const newSocket = io(SOCKET_URL);
        setSocket(newSocket);

        newSocket.on('connect', () => {
            logger.info('Socket connected');
            setIsConnected(true);
        });

        newSocket.on('disconnect', () => {
            logger.info('Socket disconnected');
            setIsConnected(false);
        });

        newSocket.on('roomProducersChanged', async ({ producers }: { producers: any[] }) => {
            logger.info('Room producers changed:', producers);
            // Iterate over producers and consume if we haven't already
            // Note: In a real app we'd track consumer IDs and only consume new ones.
            // For now, relies on logic being idempotent or just consuming everything (simplified)
            // Ideally we should have a `consumers` map to check against

            for (const producer of producers) {
                // Don't consume own producers
                if (producer.peerId === peerId) {
                    continue;
                }

                // consume function handles creation.
                if (producer.videoProducerId) {
                    // We need to pass this to a handler that access `consume`
                    // But `consume` is defined inside the component and depends on state.
                    // This useEffect runs once on mount. `consume` changes.
                    // We need a ref or a way to trigger this.
                }
            }
        });

        return () => {
            newSocket.close();
        };
    }, []);

    // Re-join room on reconnect
    useEffect(() => {
        if (isConnected && roomId && socket) {
            logger.info('Socket reconnected, re-joining room:', roomId);
            socket.emit('joinRoom', { roomId }, (response: any) => {
                if (response.error) {
                    logger.error('Failed to re-join room after reconnect:', response.error);
                } else {
                    logger.info('Re-joined room successfully');
                    if (response.peerId) {
                        setPeerId(response.peerId);
                    }
                }
            });
        }
    }, [isConnected, roomId, socket]);


    // Create or join room
    const createRoom = useCallback(async (password?: string) => {
        if (!socket) return;

        return new Promise<string>((resolve, reject) => {
            socket.emit('createRoom', { password }, (response: any) => {
                if (response.error) {
                    logger.error('Failed to create room:', response.error);
                    reject(new Error(response.error));
                } else {
                    logger.info('Room created:', response.roomId);
                    setRoomId(response.roomId);
                    setPeerId(response.peerId);
                    resolve(response.roomId);
                }
            });
        });
    }, [socket]);

    const joinRoom = useCallback(async (roomIdToJoin: string) => {
        if (!socket) return;

        return new Promise<void>((resolve, reject) => {
            socket.emit('joinRoom', { roomId: roomIdToJoin }, (response: any) => {
                if (response.error) {
                    logger.error('Failed to join room:', response.error);
                    reject(response.error);
                } else {
                    logger.info('Joined room:', response.roomId);
                    setRoomId(response.roomId);
                    setPeerId(response.peerId);
                    resolve();
                }
            });
        });
    }, [socket]);

    // Get local media stream
    const getLocalStream = useCallback(async () => {
        try {
            const constraints: MediaStreamConstraints = {
                video: videoDeviceId ? { deviceId: { exact: videoDeviceId } } : true,
                audio: audioDeviceId ? { deviceId: { exact: audioDeviceId } } : true,
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            setLocalStream(stream);
            logger.info('Got local stream');
            return stream;
        } catch (error) {
            logger.error('Failed to get local stream:', error);
            throw error;
        }
    }, [videoDeviceId, audioDeviceId]);

    // Start producing media
    const startProducing = useCallback(async () => {
        logger.info('Attempting to start producing...', { socketId: socket?.id, roomId });

        if (!socket || !roomId) {
            logger.error('Cannot start producing: missing socket or roomId', { hasSocket: !!socket, roomId });
            throw new Error('Not connected to room');
        }

        try {
            // Get local stream
            const stream = await getLocalStream();

            // Get router RTP capabilities
            const rtpCapabilities = await new Promise<any>((resolve, reject) => {
                socket.emit('getRouterRtpCapabilities', (response: any) => {
                    if (response.error) reject(response.error);
                    else resolve(response.rtpCapabilities);
                });
            });

            // Create device
            const device = new mediasoupClient.Device();

            // CRITICAL: Force H264 Constrained Baseline (42e01f) for FFmpeg compatibility
            // This prevents Chrome from sending High Profile which fails to decode
            rtpCapabilities.codecs = rtpCapabilities.codecs.map((c: any) => {
                if (c.mimeType.toLowerCase() === 'video/h264') {
                    return {
                        ...c,
                        parameters: {
                            ...c.parameters,
                            'profile-level-id': '42e01f',
                            'level-asymmetry-allowed': 1,
                            'packetization-mode': 1
                        }
                    };
                }
                return c;
            });

            await device.load({ routerRtpCapabilities: rtpCapabilities });
            deviceRef.current = device;

            logger.info('Device loaded');

            // Create producer transport
            const transportParams = await new Promise<any>((resolve, reject) => {
                socket.emit('createProducerTransport', (response: any) => {
                    if (response.error) reject(response.error);
                    else resolve(response);
                });
            });

            const producerTransport = device.createSendTransport(transportParams);
            producerTransportRef.current = producerTransport;

            // Handle transport connect
            producerTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
                try {
                    await new Promise<void>((resolve, reject) => {
                        socket.emit('connectProducerTransport', { dtlsParameters }, (response: any) => {
                            if (response.error) reject(response.error);
                            else resolve();
                        });
                    });
                    callback();
                } catch (error) {
                    errback(error as Error);
                }
            });

            // Handle transport produce
            producerTransport.on('produce', async ({ kind, rtpParameters }, callback, errback) => {
                try {
                    const { id } = await new Promise<any>((resolve, reject) => {
                        socket.emit('produce', { kind, rtpParameters }, (response: any) => {
                            if (response.error) reject(response.error);
                            else resolve(response);
                        });
                    });
                    callback({ id });
                } catch (error) {
                    errback(error as Error);
                }
            });

            // Produce video
            const videoTrack = stream.getVideoTracks()[0];
            if (videoTrack) {
                const videoProducer = await producerTransport.produce({ track: videoTrack });
                producersRef.current.video = videoProducer;
                logger.info('Video producer created');
            }

            // Produce audio
            const audioTrack = stream.getAudioTracks()[0];
            if (audioTrack) {
                const audioProducer = await producerTransport.produce({ track: audioTrack });
                producersRef.current.audio = audioProducer;
                logger.info('Audio producer created');
            }

            setIsProducing(true);
            logger.info('Started producing');
        } catch (error) {
            logger.error('Failed to start producing:', error);
            throw error;
        }
    }, [socket, roomId, getLocalStream]);


    const consumerTransportCreationPromiseRef = useRef<Promise<mediasoupClient.types.Transport | null> | null>(null);

    // Create consumer transport
    const createConsumerTransport = useCallback(async () => {
        if (!deviceRef.current || !socket) return null;

        // Verify if transport already exists
        if (consumerTransportRef.current) {
            return consumerTransportRef.current;
        }

        // Verify if creation is in progress
        if (consumerTransportCreationPromiseRef.current) {
            return consumerTransportCreationPromiseRef.current;
        }

        const promise = (async () => {
            try {
                const transportParams = await new Promise<any>((resolve, reject) => {
                    socket.emit('createConsumerTransport', (response: any) => {
                        if (response.error) reject(response.error);
                        else resolve(response);
                    });
                });

                const consumerTransport = deviceRef.current!.createRecvTransport(transportParams);
                consumerTransportRef.current = consumerTransport;

                consumerTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
                    try {
                        await new Promise<void>((resolve, reject) => {
                            socket.emit('connectConsumerTransport', { dtlsParameters }, (response: any) => {
                                if (response.error) reject(response.error);
                                else resolve();
                            });
                        });
                        callback();
                    } catch (error) {
                        errback(error as Error);
                    }
                });

                return consumerTransport;
            } catch (error) {
                logger.error('Failed to create consumer transport:', error);
                return null;
            } finally {
                consumerTransportCreationPromiseRef.current = null;
            }
        })();

        consumerTransportCreationPromiseRef.current = promise;
        return promise;
    }, [socket]);

    const consumedProducerIds = useRef<Set<string>>(new Set());

    // Consume a producer
    const consume = useCallback(async (producerId: string, peerId: string) => {
        if (!deviceRef.current || !socket || !roomId) return;
        if (consumedProducerIds.current.has(producerId)) return;

        try {
            // Ensure consumer transport exists
            let consumerTransport = consumerTransportRef.current;
            if (!consumerTransport) {
                consumerTransport = await createConsumerTransport();
            }
            if (!consumerTransport) return;

            // Mark as consuming to prevent race conditions/duplicates
            consumedProducerIds.current.add(producerId);

            const { rtpCapabilities } = deviceRef.current;

            const { id, kind, rtpParameters } = await new Promise<any>((resolve, reject) => {
                socket.emit('consume', { producerId, rtpCapabilities }, (response: any) => {
                    if (response.error) reject(response.error);
                    else resolve(response);
                });
            });

            const consumer = await consumerTransport.consume({
                id,
                producerId,
                kind,
                rtpParameters,
            });

            const stream = new MediaStream([consumer.track]);
            setRemoteStreams(prev => {
                const newStreams = new Map(prev);

                // If peer already has a stream, add track to it
                if (newStreams.has(peerId)) {
                    const existingStream = newStreams.get(peerId)!;
                    existingStream.addTrack(consumer.track);
                    newStreams.set(peerId, existingStream); // Trigger update
                } else {
                    newStreams.set(peerId, stream);
                }
                return newStreams;
            });

            consumer.on('transportclose', () => {
                consumedProducerIds.current.delete(producerId);
            });

        } catch (error) {
            logger.error('Failed to consume:', error);
            consumedProducerIds.current.delete(producerId); // Revert on failure
        }
    }, [socket, roomId, createConsumerTransport]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            consumedProducerIds.current.clear();
        };
    }, []);

    // Stop producing
    const stopProducing = useCallback(async () => {
        if (!socket) return;

        try {
            // Close producers
            producersRef.current.video?.close();
            producersRef.current.audio?.close();
            producersRef.current = { video: null, audio: null };

            // Close transport
            producerTransportRef.current?.close();
            producerTransportRef.current = null;

            // Notify server
            await new Promise<void>((resolve, reject) => {
                socket.emit('stopProducing', (response: any) => {
                    if (response.error) reject(response.error);
                    else resolve();
                });
            });

            setIsProducing(false);
            logger.info('Stopped producing');
        } catch (error) {
            logger.error('Failed to stop producing:', error);
        }
    }, [socket]);

    // Handle room producers changes
    useEffect(() => {
        if (!socket || !peerId) return;

        const handleProducersChanged = async ({ producers }: { producers: any[] }) => {
            logger.info('Room producers changed:', producers);

            // 1. Clean up stale peers
            const activePeerIds = new Set(producers.map(p => p.peerId));
            // Also keep ourselves in the active set logic if we were in remoteStreams (we shouldn't be, but for safety)

            setRemoteStreams(prev => {
                const newStreams = new Map(prev);
                let changed = false;
                for (const pid of newStreams.keys()) {
                    if (!activePeerIds.has(pid)) {
                        newStreams.delete(pid);
                        changed = true;
                    }
                }
                return changed ? newStreams : prev;
            });

            // 2. Consume new producers
            for (const producer of producers) {
                // Skip our own producers
                if (producer.peerId === peerId) continue;

                if (producer.videoProducerId && !consumedProducerIds.current.has(producer.videoProducerId)) {
                    consume(producer.videoProducerId, producer.peerId);
                }
                if (producer.audioProducerId && !consumedProducerIds.current.has(producer.audioProducerId)) {
                    consume(producer.audioProducerId, producer.peerId);
                }
            }
        };

        socket.on('roomProducersChanged', handleProducersChanged);

        socket.emit('listProducers', (response: any) => {
            if (response.producers) {
                handleProducersChanged({ producers: response.producers });
            }
        });

        return () => {
            socket.off('roomProducersChanged', handleProducersChanged);
        };
    }, [socket, peerId, consume]);

    return {
        socket,
        roomId,
        isConnected,
        localStream,
        remoteStreams,
        isProducing,
        createRoom,
        joinRoom,
        startProducing,
        stopProducing,
        startPreview: getLocalStream,
    };
}
