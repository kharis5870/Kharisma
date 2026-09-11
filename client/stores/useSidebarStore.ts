// client/stores/useSidebarStore.ts

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type SidebarState = {
  isExpanded: boolean;
  theme: 'light' | 'dark';
  /** Panel grafik Dashboard ditampilkan atau tidak. Ikut di-persist supaya
   *  pilihan pengguna bertahan antar kunjungan. */
  tampilGrafik: boolean;
  toggleSidebar: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  toggleGrafik: () => void;
};

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      isExpanded: false,
      theme: 'light',
      // Default false: halaman utama tetap seperti sebelumnya sampai
      // pengguna sendiri memunculkan grafiknya.
      tampilGrafik: false,
      toggleSidebar: () => set((state) => ({ isExpanded: !state.isExpanded })),
      setTheme: (theme) => set({ theme }),
      toggleGrafik: () => set((state) => ({ tampilGrafik: !state.tampilGrafik })),
    }),
    {
      // PERHATIAN: nama ini juga dibaca oleh skrip anti-kedip di index.html
      // (bersama jalur .state.theme). Kalau diganti, ganti juga di sana —
      // kalau tidak, mode gelap akan berkedip putih tiap kali memuat halaman.
      name: 'sidebar-storage', // nama untuk penyimpanan di local storage
    }
  )
);