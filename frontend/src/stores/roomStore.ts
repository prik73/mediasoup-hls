import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface RoomInfo {
    roomId: string;
    userCount: number;
    lastUpdate: number;
}

interface RoomStore {
    rooms: Map<string, RoomInfo>;
    currentRoomId: string | null;

    // Actions
    updateRoom: (roomId: string, info: Partial<RoomInfo>) => void;
    setCurrentRoom: (roomId: string | null) => void;
    getRoomInfo: (roomId: string) => RoomInfo | undefined;
    clearRooms: () => void;
}

export const useRoomStore = create<RoomStore>()(
    devtools(
        (set, get) => ({
            rooms: new Map(),
            currentRoomId: null,

            updateRoom: (roomId: string, info: Partial<RoomInfo>) => {
                set((state) => {
                    const newRooms = new Map(state.rooms);
                    const existing = newRooms.get(roomId);
                    newRooms.set(roomId, {
                        roomId,
                        userCount: info.userCount ?? existing?.userCount ?? 0,
                        lastUpdate: Date.now(),
                    });
                    return { rooms: newRooms };
                });
            },

            setCurrentRoom: (roomId: string | null) => {
                set({ currentRoomId: roomId });
            },

            getRoomInfo: (roomId: string) => {
                return get().rooms.get(roomId);
            },

            clearRooms: () => {
                set({ rooms: new Map(), currentRoomId: null });
            },
        }),
        { name: 'RoomStore' }
    )
);
