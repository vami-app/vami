import { create } from 'zustand';

/**
 * Client-Side UI Store (Zustand)
 * Demonstrates heterogeneous state: React Query owns Server State,
 * Zustand strictly owns ephemeral Client UI State.
 */
export const useUIStore = create((set) => ({
  isSidebarOpen: true,
  themeMode: 'system',
  
  toggleSidebar: () => set((/** @type {any} */ state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (/** @type {boolean} */ isOpen) => set({ isSidebarOpen: isOpen }),
  setThemeMode: (/** @type {string} */ mode) => set({ themeMode: mode }),
}));
