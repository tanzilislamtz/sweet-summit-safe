import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ActiveCall {
  groupId: string;
  roomId: string;
  roomTitle: string;
  groupName: string;
  startTime: number;
}

interface CallStore {
  activeCall: ActiveCall | null;
  setActiveCall: (call: ActiveCall | null) => void;
}

export const useCallStore = create<CallStore>()(
  persist(
    (set) => ({
      activeCall: null,
      setActiveCall: (activeCall) => set({ activeCall }),
    }),
    {
      name: "la:call-storage",
    }
  )
);
