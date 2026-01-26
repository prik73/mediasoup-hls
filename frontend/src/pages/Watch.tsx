import { useState, useEffect, useMemo } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import HLSPlayer from '../components/HLSPlayer';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { ThemeToggle } from '../components/ThemeToggle';
import { useHLSStore } from '../stores/hlsStore';
import { useWatchRoom } from '../hooks/useWatchRoom';

export default function Watch() {
    const { roomId: urlRoomId } = useParams<{ roomId?: string }>();
    const navigate = useNavigate();
    const [roomId, setRoomId] = useState('');
    const [isWatching, setIsWatching] = useState(false);

    // Use Zustand stores for global state
    const { hlsKey, isTransitioning } = useHLSStore();

    // Use custom hook for Socket.IO and HLS auto-reload
    useWatchRoom(isWatching ? roomId : null, isWatching);

    console.log('[Watch] Component rendered', { roomId, isWatching, urlRoomId });

    // Auto-start watching if roomId in URL
    useEffect(() => {
        if (urlRoomId && !isWatching) {
            console.log('[Watch] Auto-starting watch from URL:', urlRoomId);
            setRoomId(urlRoomId);
            setIsWatching(true);
        }
    }, [urlRoomId]);

    // Update URL when starting to watch
    useEffect(() => {
        if (isWatching && roomId) {
            navigate(`/watch/${roomId}`, { replace: true });
        }
    }, [isWatching, roomId, navigate]);


    // Memoize playlist URL to prevent unnecessary recalculations
    const playlistUrl = useMemo(
        () => `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/hls/${roomId}/playlist.m3u8`,
        [roomId]
    );

    const handleStartWatching = () => {
        console.log('[Watch] handleStartWatching called', { roomId });
        if (!roomId.trim()) {
            alert('Please enter a room ID');
            return;
        }

        // Extract Room ID from input (UUID or Short ID)
        const roomRegex = /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})|([a-zA-Z0-9]{6,})/i;
        const match = roomId.match(roomRegex);

        let finalRoomId = roomId.trim();
        if (match) {
            finalRoomId = match[0];
            console.log('[Watch] Extracted UUID from input:', finalRoomId);
        }

        console.log('[Watch] Setting isWatching to true with roomId:', finalRoomId);
        setRoomId(finalRoomId);
        setIsWatching(true);
    };


    return (
        <div className="min-h-screen bg-white dark:bg-black text-zinc-900 dark:text-zinc-50">
            {/* Header */}
            <header className="border-b border-zinc-100 dark:border-zinc-900">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link to="/" className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </Link>
                        <h1 className="text-lg font-semibold tracking-tight">Watch Stream</h1>
                    </div>
                    <ThemeToggle />
                </div>
            </header>

            <div className="container mx-auto px-4 py-8">
                {!isWatching ? (
                    <div className="max-w-md mx-auto pt-16">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold tracking-tight mb-2">Enter Room ID</h2>
                            <p className="text-zinc-500 dark:text-zinc-400">Join a live broadcast to watch</p>
                        </div>

                        <Card className="mb-6 space-y-6">
                            <Input
                                type="text"
                                value={roomId}
                                onChange={(e) => setRoomId(e.target.value)}
                                placeholder="Paste Room ID or URL..."
                                onKeyPress={(e) => e.key === 'Enter' && handleStartWatching()}
                                className="text-center text-lg"
                                autoFocus
                            />
                            <Button onClick={handleStartWatching} variant="primary" size="lg" className="w-full h-12">
                                Start Watching
                            </Button>
                        </Card>

                        <div className="text-center text-xs text-zinc-400 dark:text-zinc-600">
                            <p>Entering a room auto-connects to the best available quality.</p>
                        </div>
                    </div>
                ) : (
                    <div className="max-w-5xl mx-auto space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-semibold tracking-tight">Live Stream</h2>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
                                    <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Live</span>
                                    <span className="text-zinc-300 dark:text-zinc-700">|</span>
                                    <code className="text-xs font-mono text-zinc-500">{roomId}</code>
                                </div>
                            </div>
                            <Button onClick={() => { setIsWatching(false); navigate('/watch'); }} variant="secondary" size="sm">
                                Leave
                            </Button>
                        </div>

                        {/* Transition Indicator */}
                        {isTransitioning && (
                            <div className="mb-4 px-4 py-2 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                                <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
                                    <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    <span>Updating stream...</span>
                                </div>
                            </div>
                        )}

                        {/* Challenge Message */}
                        <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/50 rounded-lg text-yellow-500 text-sm font-medium text-center">
                            Default is 144p. Try changing the quality to upper and see the server crash :))) lol
                        </div>

                        {/* HLS Player - key prop forces remount when hlsKey changes */}
                        <HLSPlayer key={hlsKey} playlistUrl={playlistUrl} />
                    </div>
                )}
            </div>
        </div>
    );
}
