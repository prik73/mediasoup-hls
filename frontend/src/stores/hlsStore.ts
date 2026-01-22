import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface HLSStore {
    hlsKey: number;
    isTransitioning: boolean;
    lastReloadTime: number | null;

    // Actions
    reloadPlayer: () => void;
    setTransitioning: (value: boolean) => void;
    resetKey: () => void;
}

export const useHLSStore = create<HLSStore>()(
    devtools(
        (set) => ({
            hlsKey: 0,
            isTransitioning: false,
            lastReloadTime: null,

            reloadPlayer: () => {
                console.log('[HLSStore] 🔄 Reloading HLS player');
                set((state) => ({
                    hlsKey: state.hlsKey + 1,
                    lastReloadTime: Date.now(),
                }));
            },

            setTransitioning: (value: boolean) => {
                set({ isTransitioning: value });
            },

            resetKey: () => {
                set({ hlsKey: 0, lastReloadTime: null });
            },
        }),
        { name: 'HLSStore' }
    )
);
