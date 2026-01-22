import { useEffect } from 'react';
import { useSocketStore } from '../stores/socketStore';
import { useHLSStore } from '../stores/hlsStore';
import { useRoomStore } from '../stores/roomStore';

/**
 * Custom hook for managing Socket.IO room connection and HLS auto-reload
 */
export function useWatchRoom(roomId: string | null, isWatching: boolean) {
    const { socket, joinRoom, leaveRoom, isConnected } = useSocketStore();
    const { reloadPlayer, setTransitioning } = useHLSStore();
    const { updateRoom } = useRoomStore();

    // Set up Socket.IO connection on mount
    useEffect(() => {
        if (!socket) {
            useSocketStore.getState().connect();
        }
    }, [socket]);

    // Join/leave room when watching state changes
    useEffect(() => {
        if (isWatching && roomId && isConnected) {
            console.log('[useWatchRoom] Joining room:', roomId);
            joinRoom(roomId);

            return () => {
                console.log('[useWatchRoom] Leaving room:', roomId);
                leaveRoom();
            };
        }
    }, [isWatching, roomId, isConnected, joinRoom, leaveRoom]);

    // Listen for HLS restart events
    useEffect(() => {
        if (!socket || !roomId) return;

        const handleHLSRestart = (data: { roomId: string; timestamp: number; userCount: number }) => {
            console.log('[useWatchRoom] 🔄 HLS restarted event:', data);

            if (data.roomId === roomId) {
                console.log('[useWatchRoom] ⏳ Waiting 7s for FFmpeg to generate segments...');
                setTransitioning(true);
                updateRoom(roomId, { userCount: data.userCount });

                // Wait 7 seconds for FFmpeg to generate segments
                setTimeout(() => {
                    console.log('[useWatchRoom] 🔄 Reloading HLS player');
                    reloadPlayer();

                    setTimeout(() => {
                        setTransitioning(false);
                        console.log('[useWatchRoom] ✅ HLS player reloaded');
                    }, 500);
                }, 7000);
            }
        };

        socket.on('hlsRestarted', handleHLSRestart);

        return () => {
            socket.off('hlsRestarted', handleHLSRestart);
        };
    }, [socket, roomId, reloadPlayer, setTransitioning, updateRoom]);

    return {
        isConnected,
    };
}
