import { useEffect, useRef } from 'react';

interface VideoGridProps {
    localStream: MediaStream | null;
    remoteStreams: Map<string, MediaStream>;
}

/**
 * Component to display local and remote video streams in a grid
 */
export default function VideoGrid({ localStream, remoteStreams }: VideoGridProps) {
    const localVideoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {/* Local stream */}
            {localStream && (
                <div className="relative aspect-video bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800">
                    <video
                        ref={localVideoRef}
                        autoPlay
                        muted
                        playsInline
                        className="w-full h-full object-cover transform -scale-x-100" // Mirror local video
                    />
                    <div className="absolute bottom-3 left-3 bg-zinc-900/80 backdrop-blur-sm px-2 py-1 rounded text-xs font-medium text-white border border-white/10">
                        You (Preview)
                    </div>
                </div>
            )}

            {/* Remote streams */}
            {Array.from(remoteStreams.entries()).map(([peerId, stream]) => (
                <RemoteVideo key={peerId} peerId={peerId} stream={stream} />
            ))}
        </div>
    );
}

function RemoteVideo({ peerId, stream }: { peerId: string; stream: MediaStream }) {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    return (
        <div className="relative aspect-video bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800">
            <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
            />
            <div className="absolute bottom-3 left-3 bg-zinc-900/80 backdrop-blur-sm px-2 py-1 rounded text-xs font-medium text-white border border-white/10">
                Peer: {peerId.slice(0, 8)}
            </div>
        </div>
    );
}
