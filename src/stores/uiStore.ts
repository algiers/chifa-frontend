import { create } from 'zustand';

interface UIState {
  // UI state can be extended as needed
}

export const useUIStore = create<UIState>((set) => ({
  // UI state can be extended as needed
}));
