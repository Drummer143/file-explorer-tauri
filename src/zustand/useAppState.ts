import { create } from "zustand";

interface AppState {
    notificationLiveTime: number;
    notificationTick: number
}

export const useAppState = create<AppState>(() => ({
    notificationLiveTime: 20000,
    notificationTick: 200
}));
