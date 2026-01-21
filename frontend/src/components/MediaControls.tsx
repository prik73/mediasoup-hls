import { Button } from './ui/Button';

interface MediaControlsProps {
    isVideoEnabled: boolean;
    isAudioEnabled: boolean;
    onToggleVideo: () => void;
    onToggleAudio: () => void;
    onStartStop: () => void;
    isProducing: boolean;
}

/**
 * Component for controlling media (mic/camera toggles, start/stop)
 */
export default function MediaControls({
    isVideoEnabled,
    isAudioEnabled,
    onToggleVideo,
    onToggleAudio,
    onStartStop,
    isProducing,
    isLoading,
}: MediaControlsProps & { isLoading: boolean }) {
    return (
        <div className="flex flex-wrap gap-3 justify-center p-6 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-lg">
            <Button
                onClick={onToggleVideo}
                variant={isVideoEnabled ? "primary" : "secondary"}
                className="w-40"
            >
                <div className="flex items-center gap-2">
                    {isVideoEnabled ? (
                        <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            <span>Video On</span>
                        </>
                    ) : (
                        <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
                            </svg>
                            <span>Video Off</span>
                        </>
                    )}
                </div>
            </Button>

            <Button
                onClick={onToggleAudio}
                variant={isAudioEnabled ? "primary" : "secondary"}
                className="w-40"
            >
                <div className="flex items-center gap-2">
                    {isAudioEnabled ? (
                        <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                            </svg>
                            <span>Mic On</span>
                        </>
                    ) : (
                        <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
                            </svg>
                            <span>Mic Off</span>
                        </>
                    )}
                </div>
            </Button>

            <Button
                onClick={onStartStop}
                variant={isProducing ? "danger" : "primary"}
                className={`w-40 font-medium transition-all ${isLoading ? 'opacity-75 cursor-wait' : ''}`}
                disabled={isLoading}
            >
                <div className="flex items-center gap-2">
                    {isLoading ? (
                        <>
                            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>{isProducing ? 'Stopping...' : 'Starting...'}</span>
                        </>
                    ) : isProducing ? (
                        <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <rect x="6" y="6" width="12" height="12" rx="1" strokeWidth={2} />
                            </svg>
                            <span>Stop Stream</span>
                        </>
                    ) : (
                        <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <circle cx="12" cy="12" r="10" strokeWidth={2} />
                                <circle cx="12" cy="12" r="3" fill="currentColor" />
                            </svg>
                            <span>Start Streaming</span>
                        </>
                    )}
                </div>
            </Button>
        </div>
    );
}
