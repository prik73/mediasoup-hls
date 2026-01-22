import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useMediasoup } from '../hooks/useMediasoup';
import { useMediaDevices } from '../hooks/useMediaDevices';
import MediaControls from '../components/MediaControls';
import VideoGrid from '../components/VideoGrid';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ThemeToggle } from '../components/ThemeToggle';
import { Input } from '../components/ui/Input';
import { logger } from '../utils/logger';

export default function Stream() {
    const { roomId: urlRoomId } = useParams<{ roomId?: string }>();
    const navigate = useNavigate();
    const {
        selectedVideoId,
        selectedAudioId,
        videoDevices,
        audioDevices,
        setSelectedVideoId,
        setSelectedAudioId,
    } = useMediaDevices();
    const {
        roomId,
        isConnected,
        localStream,
        remoteStreams,
        isProducing,
        createRoom,
        joinRoom,
        startProducing,
        stopProducing,
        startPreview,
    } = useMediasoup({
        videoDeviceId: selectedVideoId,
        audioDeviceId: selectedAudioId,
    });

    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const [isAudioEnabled, setIsAudioEnabled] = useState(true);
    const [roomIdInput, setRoomIdInput] = useState('');
    const [hasJoinedRoom, setHasJoinedRoom] = useState(false);
    const [error, setError] = useState('');

    // Auto-join room from URL on mount
    useEffect(() => {
        if (urlRoomId && !hasJoinedRoom && !roomId && isConnected) {
            logger.info('Auto-joining room from URL:', urlRoomId);
            setRoomIdInput(urlRoomId);
            handleJoinRoom(urlRoomId);
        }
    }, [urlRoomId, isConnected]);

    // Update URL when room is created/joined
    useEffect(() => {
        if (roomId && hasJoinedRoom) {
            navigate(`/stream/${roomId}`, { replace: true });
        }
    }, [roomId, hasJoinedRoom, navigate]);

    // Start preview when joined room
    useEffect(() => {
        if (hasJoinedRoom && !localStream) {
            startPreview();
        }
    }, [hasJoinedRoom, localStream, startPreview]);

    const handleCreateRoom = async () => {
        try {
            setError('');
            logger.info('Creating new room...');
            const newRoomId = await createRoom();
            logger.info('Room created:', newRoomId);
            setHasJoinedRoom(true);
        } catch (err: any) {
            logger.error('Failed to create room:', err);
            setError('Failed to create room: ' + err.message);
        }
    };

    const handleJoinRoom = async (roomIdToJoin?: string) => {
        const targetRoomId = roomIdToJoin || roomIdInput.trim();

        if (!targetRoomId) {
            setError('Please enter a room ID');
            return;
        }

        try {
            setError('');
            logger.info('Joining room:', targetRoomId);
            await joinRoom(targetRoomId);
            logger.info('Joined room successfully');
            setHasJoinedRoom(true);
        } catch (err: any) {
            logger.error('Failed to join room:', err);
            setError('Failed to join room. Room may not exist.');
        }
    };

    const handleToggleVideo = () => {
        if (localStream) {
            const videoTrack = localStream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsVideoEnabled(videoTrack.enabled);
            }
        }
    };

    const handleToggleAudio = () => {
        if (localStream) {
            const audioTrack = localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsAudioEnabled(audioTrack.enabled);
            }
        }
    };

    // State for local loading feedback
    const [isStreamingLoading, setIsStreamingLoading] = useState(false);

    const handleStartStop = async () => {
        try {
            setIsStreamingLoading(true);
            if (isProducing) {
                await stopProducing();
            } else {
                await startProducing();
            }
        } catch (error) {
            logger.error('Failed to start/stop producing:', error);
            alert('Failed to start/stop streaming. Check console for details.');
        } finally {
            setIsStreamingLoading(false);
        }
    };



    const [showCopyFeedback, setShowCopyFeedback] = useState(false);

    const copyRoomUrl = () => {
        if (roomId) {
            const url = `${window.location.origin}/watch/${roomId}`;
            navigator.clipboard.writeText(url);
            setShowCopyFeedback(true);
            setTimeout(() => setShowCopyFeedback(false), 2000);
        }
    };

    return (
        <div className="min-h-screen bg-white dark:bg-black text-zinc-900 dark:text-zinc-50">
            {/* Minimal Header */}
            <header className="border-b border-zinc-100 dark:border-zinc-900">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link to="/" className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </Link>
                        <h1 className="text-lg font-semibold tracking-tight">Stream Dashboard</h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <ThemeToggle />
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${isConnected
                            ? 'bg-zinc-900 text-white border-zinc-800 dark:bg-white dark:text-black dark:border-zinc-200'
                            : 'bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-500 dark:border-zinc-800'
                            }`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-white dark:bg-black' : 'bg-zinc-400 dark:bg-zinc-600'} animate-pulse`} />
                            {isConnected ? 'Connected' : 'Disconnected'}
                        </div>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                {!hasJoinedRoom ? (
                    <div className="max-w-md mx-auto pt-16">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold tracking-tight mb-3">Start Streaming</h2>
                            <p className="text-zinc-500 dark:text-zinc-400">Choose how you want to begin</p>
                        </div>

                        <Card className="space-y-8 p-8">
                            {/* Create Room */}
                            <div className="space-y-4">
                                <Button
                                    onClick={handleCreateRoom}
                                    variant="primary"
                                    size="lg"
                                    className="w-full h-12 border border-zinc-800 dark:border-zinc-700 shadow-sm"
                                >
                                    Create New Room
                                </Button>
                                <p className="text-xs text-center text-zinc-500">
                                    Generates a unique room ID instantly
                                </p>
                            </div>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-100 dark:border-zinc-800"></div></div>
                                <div className="relative flex justify-center text-xs uppercase text-zinc-400 bg-white dark:bg-zinc-900 px-2">Or join existing</div>
                            </div>

                            {/* Join Room */}
                            <div className="space-y-3">
                                <Input
                                    type="text"
                                    value={roomIdInput}
                                    onChange={(e) => setRoomIdInput(e.target.value)}
                                    placeholder="Enter Room ID"
                                    onKeyPress={(e) => e.key === 'Enter' && handleJoinRoom()}
                                    error={error}
                                />
                                <Button onClick={() => handleJoinRoom()} variant="secondary" className="w-full">
                                    Join Room
                                </Button>
                            </div>
                        </Card>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-[300px_1fr] gap-6 items-start">
                        {/* Sidebar */}
                        <div className="space-y-6">
                            <Card>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-semibold uppercase text-zinc-500 mb-1.5 block">Room ID</label>
                                        <div className="flex gap-2">
                                            <code className="flex-1 px-3 py-2 bg-zinc-50 dark:bg-zinc-950 rounded text-sm font-mono border border-zinc-200 dark:border-zinc-800 overflow-hidden text-ellipsis">
                                                {roomId}
                                            </code>
                                            <Button onClick={copyRoomUrl} size="sm" variant="secondary" className="px-3 relative" title="Copy Room URL">
                                                {showCopyFeedback && (
                                                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs bg-black text-white px-2 py-1 rounded whitespace-nowrap z-50">
                                                        Copied!
                                                    </span>
                                                )}
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                </svg>
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
                                        <Link to={`/stream/${roomId}`} target="_blank" className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:underline flex items-center gap-1 transition-colors">
                                            Open Stream Page
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                            </svg>
                                        </Link>
                                        <Link to={`/watch/${roomId}`} target="_blank" className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:underline flex items-center gap-1 transition-colors">
                                            Open Watch Page
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                            </svg>
                                        </Link>
                                    </div>
                                </div>
                            </Card>

                            <MediaControls
                                isVideoEnabled={isVideoEnabled}
                                isAudioEnabled={isAudioEnabled}
                                onToggleVideo={handleToggleVideo}
                                onToggleAudio={handleToggleAudio}
                                onStartStop={handleStartStop}
                                isProducing={isProducing}
                                isLoading={isStreamingLoading}
                                videoDevices={videoDevices}
                                audioDevices={audioDevices}
                                selectedVideoId={selectedVideoId}
                                selectedAudioId={selectedAudioId}
                                onSelectVideo={setSelectedVideoId}
                                onSelectAudio={setSelectedAudioId}
                            />
                        </div>

                        {/* Main Content */}
                        <div className="min-w-0">
                            <VideoGrid localStream={localStream} remoteStreams={remoteStreams} />
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
