import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom';
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
    const location = useLocation();
    const passwordFromHome = location.state?.password;

    // ... (rest of hooks) ...

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
    const [password, setPassword] = useState(passwordFromHome || '');

    // Redirect to home if no password provided and not joining existing room
    useEffect(() => {
        if (!urlRoomId && !passwordFromHome) {
            // Optional: Force redirect to home if strictly enforcing "Must start from Home"
            // navigate('/'); 
            // But for better UX, maybe just leave the input field if they came directly.
            // User Request: "without entering password no one can enter" 
            // Implementing strict check:
            logger.warn("Direct access attempt without password. Redirecting to home.");
            navigate('/');
        }
    }, [urlRoomId, passwordFromHome, navigate]);

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
            const newRoomId = await createRoom(password);
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
        <div className="min-h-screen bg-background text-foreground transition-colors duration-300 animate-page-enter">
            {/* Minimal Header */}
            <header className="border-b border-border">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </Link>
                        <h1 className="text-lg font-semibold tracking-tight text-foreground">Stream Dashboard</h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <ThemeToggle />
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${isConnected
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-muted text-muted-foreground border-border'
                            }`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-primary-foreground' : 'bg-foreground/50'} animate-pulse`} />
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
                            <p className="text-muted-foreground">Choose how you want to begin</p>
                        </div>

                        <Card
                            className="space-y-8 p-8"
                            footer={
                                <div className="text-center text-xs text-muted-foreground">
                                    To run the setup locally in high quality, explore <a href="https://github.com/prik73/mediasoup-docker-setup" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline underline-offset-4">this</a>.
                                    <br />
                                    Check <a href="https://github.com/prik73/mediasoup-hls" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline underline-offset-4">this</a> to see the whole architecture.
                                </div>
                            }
                        >
                            {/* Create Room */}
                            <div className="space-y-4">
                                {/* Only show password input if not provided from Home (fallback) */}
                                {!passwordFromHome && (
                                    <Input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Enter Admin Password"
                                        className="text-center"
                                    />
                                )}
                                <Button
                                    onClick={handleCreateRoom}
                                    variant="primary"
                                    size="lg"
                                    className="w-full h-12 border border-input shadow-sm"
                                >
                                    Create New Room
                                </Button>
                                <p className="text-xs text-center text-muted-foreground">
                                    Generates a unique room ID instantly
                                </p>
                            </div>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border"></div></div>
                                <div className="relative flex justify-center text-xs uppercase text-muted-foreground bg-card px-2">Or join existing</div>
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
                                        <label className="text-xs font-semibold uppercase text-muted-foreground mb-1.5 block">Room ID</label>
                                        <div className="flex gap-2">
                                            <code className="flex-1 px-3 py-2 bg-muted/50 rounded text-sm font-mono border border-input overflow-hidden text-ellipsis">
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

                                    {/* User Count Warning */}
                                    {Object.keys(remoteStreams).length >= 3 && (
                                        <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
                                            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-lg p-3">
                                                <div className="flex gap-2">
                                                    <svg className="w-5 h-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                    </svg>
                                                    <div className="flex-1">
                                                        <p className="text-sm font-medium text-amber-900 dark:text-amber-200 mb-1">
                                                            Quality Notice
                                                        </p>
                                                        <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                                                            For best quality, we recommend <strong>3 users per room</strong>, as I am currently broke and cannot afford to keep AWS large instances running 😅
                                                        </p>
                                                        <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                                                            Thank you for understanding! 🙏
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

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
