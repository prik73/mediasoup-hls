import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { io, Socket } from 'socket.io-client';

interface SocketStore {
    socket: Socket | null;
    isConnected: boolean;
    currentRoom: string | null;

    // Actions
    connect: () => void;
    disconnect: () => void;
    joinRoom: (roomId: string) => void;
    leaveRoom: () => void;

    // Event handlers
    onHLSRestarted: ((callback: (data: { roomId: string; timestamp: number; userCount: number }) => void) => void) | null;
}

export const useSocketStore = create<SocketStore>()(
    devtools(
        (set, get) => ({
            socket: null,
            isConnected: false,
            currentRoom: null,
            onHLSRestarted: null,

            connect: () => {
                const existingSocket = get().socket;
                if (existingSocket?.connected) {
                    console.log('[SocketStore] Already connected');
                    return;
                }

                console.log('[SocketStore] 🔌 Creating Socket.IO connection');
                const socket = io('http://localhost:3000');

                socket.on('connect', () => {
                    console.log('[SocketStore] ✅ Connected, ID:', socket.id);
                    set({ isConnected: true });
                });

                socket.on('disconnect', () => {
                    console.log('[SocketStore] 🔌 Disconnected');
                    set({ isConnected: false, currentRoom: null });
                });

                socket.on('error', (error) => {
                    console.error('[SocketStore] ❌ Error:', error);
                });

                set({ socket });
            },

            disconnect: () => {
                const socket = get().socket;
                if (socket) {
                    console.log('[SocketStore] 🧹 Disconnecting');
                    socket.disconnect();
                    set({ socket: null, isConnected: false, currentRoom: null });
                }
            },

            joinRoom: (roomId: string) => {
                const { socket, isConnected } = get();

                if (!socket) {
                    console.error('[SocketStore] ❌ Cannot join room: socket not initialized');
                    return;
                }

                if (!isConnected) {
                    console.log('[SocketStore] ⏳ Waiting for connection before joining room');
                    socket.once('connect', () => {
                        get().joinRoom(roomId);
                    });
                    return;
                }

                console.log('[SocketStore] 📥 Joining room:', roomId);
                socket.emit('joinRoom', { roomId }, (response: any) => {
                    if (response?.error) {
                        console.error('[SocketStore] ❌ Failed to join room:', response.error);
                    } else {
                        console.log('[SocketStore] ✅ Joined room:', roomId);
                        set({ currentRoom: roomId });
                    }
                });
            },

            leaveRoom: () => {
                const { socket, currentRoom } = get();

                if (!socket || !currentRoom) {
                    return;
                }

                console.log('[SocketStore] 📤 Leaving room:', currentRoom);
                socket.emit('leaveRoom', { roomId: currentRoom });
                set({ currentRoom: null });
            },
        }),
        { name: 'SocketStore' }
    )
);
