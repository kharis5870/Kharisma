// client/stores/useSidebarStore.ts

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type SidebarState = {
  isExpanded: boolean;
  theme: 'light' | 'dark';
  toggleSidebar: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
};

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      isExpanded: false,
      theme: 'light',
      toggleSidebar: () => set((state) => ({ isExpanded: !state.isExpanded })),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'sidebar-storage', // nama untuk penyimpanan di local storage
    }
  )
);