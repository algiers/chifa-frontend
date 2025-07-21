import { create } from 'zustand';

interface UIState {
  isMobileSidebarOpen: boolean;
  isSidebarCollapsed: boolean;
  toggleMobileSidebar: () => void;
  setMobileSidebarOpen: (isOpen: boolean) => void;
  toggleSidebarCollapsed: () => void;
  setSidebarCollapsed: (isCollapsed: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isMobileSidebarOpen: false,
  isSidebarCollapsed: false,
  toggleMobileSidebar: () => set((state) => ({ isMobileSidebarOpen: !state.isMobileSidebarOpen })),
  setMobileSidebarOpen: (isOpen) => set({ isMobileSidebarOpen: isOpen }),
  toggleSidebarCollapsed: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
  setSidebarCollapsed: (isCollapsed) => set({ isSidebarCollapsed: isCollapsed }),
}));
