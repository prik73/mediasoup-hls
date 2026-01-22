import { useState, useEffect } from 'react';
import { useHLS } from '../hooks/useHLS';
import { Button } from './ui/Button';

interface HLSPlayerProps {
    playlistUrl: string;
}

interface QualityLevel {
    index: number;
    height: number;
    width: number;
    bitrate: number;
    name: string;
}

/**
 * Component for HLS video playback with quality selector
 */
export default function HLSPlayer({ playlistUrl }: HLSPlayerProps) {
    const {
        videoRef,
        isPlaying,
        error,
        isLoading,
        play,
        pause,
        getQualityLevels,
        getCurrentQuality,
        setQuality,
        hlsInstance
    } = useHLS({
        playlistUrl,
        autoPlay: true,
    });

    const [qualityLevels, setQualityLevels] = useState<QualityLevel[]>([]);
    const [currentQuality, setCurrentQuality] = useState<number>(-1);
    const [showQualityMenu, setShowQualityMenu] = useState(false);

    // Update quality levels when HLS instance is ready
    useEffect(() => {
        if (hlsInstance) {
            const updateLevels = () => {
                const levels = getQualityLevels();
                setQualityLevels(levels);
                setCurrentQuality(getCurrentQuality());
            };

            // Update levels after manifest is parsed
            const timer = setTimeout(updateLevels, 1000);
            return () => clearTimeout(timer);
        }
    }, [hlsInstance, getQualityLevels, getCurrentQuality]);

    // Update current quality when it changes
    useEffect(() => {
        if (hlsInstance) {
            const interval = setInterval(() => {
                setCurrentQuality(getCurrentQuality());
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [hlsInstance, getCurrentQuality]);

    const handleQualityChange = (levelIndex: number) => {
        setQuality(levelIndex);
        setCurrentQuality(levelIndex);
        setShowQualityMenu(false);

        // Save preference to localStorage
        localStorage.setItem('hls-quality-preference', levelIndex.toString());
    };

    // Load saved quality preference
    useEffect(() => {
        const savedQuality = localStorage.getItem('hls-quality-preference');
        if (savedQuality !== null && hlsInstance) {
            const quality = parseInt(savedQuality, 10);
            setQuality(quality);
        }
    }, [hlsInstance, setQuality]);

    const getQualityLabel = (level: QualityLevel) => {
        if (level.height >= 720) return `${level.height}p HD`;
        if (level.height >= 480) return `${level.height}p SD`;
        return `${level.height}p`;
    };

    const getCurrentQualityLabel = () => {
        if (currentQuality === -1) return 'Auto';
        const level = qualityLevels.find(l => l.index === currentQuality);
        return level ? getQualityLabel(level) : 'Auto';
    };

    return (
        <div className="max-w-6xl mx-auto">
            <div className="relative bg-black rounded-lg overflow-hidden border border-zinc-900 border-opacity-50">
                <video
                    ref={videoRef}
                    controls={false}
                    className="w-full h-auto"
                    playsInline
                />

                {/* Quality Selector Overlay */}
                {!isLoading && qualityLevels.length > 0 && (
                    <div className="absolute top-4 right-4 z-10">
                        <div className="relative">
                            <button
                                onClick={() => setShowQualityMenu(!showQualityMenu)}
                                className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900/90 hover:bg-black text-white rounded text-sm font-medium transition-colors border border-white/10"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span>{getCurrentQualityLabel()}</span>
                            </button>

                            {/* Quality Menu Dropdown */}
                            {showQualityMenu && (
                                <div className="absolute top-full right-0 mt-2 w-48 bg-zinc-900 border border-zinc-800 rounded shadow-xl overflow-hidden p-1">
                                    <div className="text-[10px] text-zinc-500 px-3 py-1.5 font-bold uppercase tracking-wider">
                                        Quality
                                    </div>

                                    {/* Auto Quality Option */}
                                    <button
                                        onClick={() => handleQualityChange(-1)}
                                        className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${currentQuality === -1
                                            ? 'bg-white text-black'
                                            : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span>Auto</span>
                                            {currentQuality === -1 && (
                                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            )}
                                        </div>
                                    </button>

                                    {/* Quality Level Options */}
                                    {qualityLevels.map((level) => (
                                        <button
                                            key={level.index}
                                            onClick={() => handleQualityChange(level.index)}
                                            className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${currentQuality === level.index
                                                ? 'bg-white text-black'
                                                : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span>{getQualityLabel(level)}</span>
                                                {currentQuality === level.index && (
                                                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                )}
                                            </div>
                                            <div className={`text-[10px] mt-0.5 ${currentQuality === level.index ? 'text-zinc-500' : 'text-zinc-600'}`}>
                                                {(level.bitrate / 1000).toFixed(0)} kbps
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {error && (
                <div className={`mt-4 px-4 py-3 rounded-lg ${error.includes('No users')
                        ? 'bg-blue-500/10 border border-blue-500 text-blue-500'
                        : 'bg-red-500/10 border border-red-500 text-red-500'
                    }`}>
                    <div className="flex items-center gap-2">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            {error.includes('No users') ? (
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            ) : (
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            )}
                        </svg>
                        <span>{error}</span>
                    </div>
                </div>
            )}

            {/* Loader Overlay */}
            {isLoading && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                        <p className="text-sm font-medium text-white">Loading Stream...</p>
                    </div>
                </div>
            )}

            <div className={`mt-4 flex items-center gap-3 transition-opacity duration-200 ${isLoading ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                <Button onClick={play} disabled={isPlaying} size="md" variant="primary">
                    <div className="flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Play</span>
                    </div>
                </Button>
                <Button onClick={pause} disabled={!isPlaying} size="md" variant="secondary">
                    <div className="flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Pause</span>
                    </div>
                </Button>
                <div className="ml-auto text-sm text-zinc-500">
                    Status: <span className="font-semibold text-zinc-900 dark:text-white">{isPlaying ? 'Playing' : 'Paused'}</span>
                </div>
            </div>
        </div>
    );
}
