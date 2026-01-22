import { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import { logger } from '../utils/logger';

interface UseHLSProps {
    playlistUrl: string;
    autoPlay?: boolean;
}

/**
 * Hook to manage HLS playback using hls.js
 */
export function useHLS({ playlistUrl, autoPlay = true }: UseHLSProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const hlsRef = useRef<Hls | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        console.log('[HLS] useEffect triggered', { playlistUrl, hasVideoRef: !!videoRef.current });

        if (!videoRef.current || !playlistUrl) {
            console.log('[HLS] Missing videoRef or playlistUrl, skipping initialization');
            return;
        }

        const video = videoRef.current;

        // Reset state for clean initialization
        setIsLoading(true);
        setError(null);
        setIsPlaying(false);

        logger.info('[HLS] Initializing HLS player for:', playlistUrl);
        console.log('[HLS] Full playlist URL:', playlistUrl);

        // Check if HLS is supported
        if (Hls.isSupported()) {
            console.log('[HLS] HLS.js is supported, creating instance');
            const hls = new Hls();

            hlsRef.current = hls;

            hls.loadSource(playlistUrl);
            hls.attachMedia(video);

            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                logger.info('HLS manifest parsed successfully');
                setIsLoading(false);

                if (autoPlay) {
                    video.play().catch(err => {
                        logger.error('Failed to autoplay:', err);
                        setError('Failed to autoplay video. Click play button.');
                    });
                }
            });

            hls.on(Hls.Events.ERROR, (_event, data) => {
                logger.error('HLS error:', { type: data.type, details: data.details, fatal: data.fatal });
                setIsLoading(false); // Stop loading on error so we show error message

                if (data.fatal) {
                    switch (data.type) {
                        case Hls.ErrorTypes.NETWORK_ERROR:
                            logger.error('Fatal network error, trying to recover...');

                            // Check if it's a 404 (playlist not found = no users streaming)
                            if (data.details === 'manifestLoadError' && data.response?.code === 404) {
                                setError('No users are currently streaming in this room');
                            } else {
                                setError('Network error loading stream. Retrying...');
                                hls.startLoad();
                            }
                            break;
                        case Hls.ErrorTypes.MEDIA_ERROR:
                            logger.error('Fatal media error, trying to recover...');
                            setError('Media error. Trying to recover...');
                            hls.recoverMediaError();
                            break;
                        default:
                            logger.error('Fatal error, cannot recover');
                            setError(`Fatal error: ${data.details}`);
                            hls.destroy();
                            break;
                    }
                } else {
                    // Non-fatal error
                    logger.warn('Non-fatal HLS error:', data.details);
                }
            });

            video.addEventListener('play', () => setIsPlaying(true));
            video.addEventListener('pause', () => setIsPlaying(false));

            return () => {
                hls.destroy();
                hlsRef.current = null;
            };
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            // Native HLS support (Safari)
            logger.info('Using native HLS support');
            video.src = playlistUrl;
            if (autoPlay) {
                video.play().catch(err => {
                    logger.error('Failed to autoplay:', err);
                    setError('Failed to autoplay video. Click play button.');
                });
            }

            video.addEventListener('play', () => setIsPlaying(true));
            video.addEventListener('pause', () => setIsPlaying(false));

            return () => {
                video.src = '';
            };
        } else {
            setError('HLS not supported in this browser');
            logger.error('HLS not supported');
        }
    }, [playlistUrl, autoPlay]);

    const play = useCallback(() => {
        videoRef.current?.play();
    }, []);

    const pause = useCallback(() => {
        videoRef.current?.pause();
    }, []);

    const getQualityLevels = useCallback(() => {
        if (hlsRef.current) {
            return hlsRef.current.levels.map((level, index) => ({
                index,
                height: level.height,
                width: level.width,
                bitrate: level.bitrate,
                name: level.name || `${level.height}p`,
            }));
        }
        return [];
    }, []);

    const getCurrentQuality = useCallback(() => {
        if (hlsRef.current) {
            return hlsRef.current.currentLevel;
        }
        return -1; // -1 means auto
    }, []);

    const setQuality = useCallback((levelIndex: number) => {
        if (hlsRef.current) {
            hlsRef.current.currentLevel = levelIndex; // -1 for auto
            logger.info(`Quality changed to: ${levelIndex === -1 ? 'Auto' : levelIndex}`);
        }
    }, []);

    return {
        videoRef,
        isPlaying,
        error,
        isLoading,
        play,
        pause,
        hlsInstance: hlsRef.current,
        getQualityLevels,
        getCurrentQuality,
        setQuality,
    };
}
