import { create } from "zustand";
import { persist } from "zustand/middleware";

interface NavigationState {
  isSidebarCollapsed: boolean;
}

interface NavigationActions {
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

export const useNavigationStore = create<NavigationState & NavigationActions>()(
  persist(
    (set) => ({
      isSidebarCollapsed: false,
      toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
      setSidebarCollapsed: (collapsed: boolean) => set({ isSidebarCollapsed: collapsed }),
    }),
    {
      name: "navigation-storage",
    }
  )
);

