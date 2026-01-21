import { useState, useEffect } from 'react';
import { logger } from '../utils/logger';

export interface MediaDevice {
    deviceId: string;
    label: string;
    kind: 'audioinput' | 'videoinput';
}

/**
 * Hook to enumerate and manage media devices (cameras and microphones)
 */
export function useMediaDevices() {
    const [videoDevices, setVideoDevices] = useState<MediaDevice[]>([]);
    const [audioDevices, setAudioDevices] = useState<MediaDevice[]>([]);
    const [selectedVideoId, setSelectedVideoId] = useState<string>('');
    const [selectedAudioId, setSelectedAudioId] = useState<string>('');

    useEffect(() => {
        enumerateDevices();
    }, []);

    const enumerateDevices = async () => {
        try {
            // Request permissions first
            await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

            const devices = await navigator.mediaDevices.enumerateDevices();

            const videos = devices
                .filter(d => d.kind === 'videoinput')
                .map(d => ({ deviceId: d.deviceId, label: d.label, kind: 'videoinput' as const }));

            const audios = devices
                .filter(d => d.kind === 'audioinput')
                .map(d => ({ deviceId: d.deviceId, label: d.label, kind: 'audioinput' as const }));

            setVideoDevices(videos);
            setAudioDevices(audios);

            // Set default selections
            if (videos.length > 0 && !selectedVideoId) {
                setSelectedVideoId(videos[0].deviceId);
            }
            if (audios.length > 0 && !selectedAudioId) {
                setSelectedAudioId(audios[0].deviceId);
            }

            logger.info('Devices enumerated:', { videos: videos.length, audios: audios.length });
        } catch (error) {
            logger.error('Failed to enumerate devices:', error);
        }
    };

    return {
        videoDevices,
        audioDevices,
        selectedVideoId,
        selectedAudioId,
        setSelectedVideoId,
        setSelectedAudioId,
    };
}
