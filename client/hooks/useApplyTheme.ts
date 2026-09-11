import { useEffect } from 'react';
import { useSidebarStore } from '@/stores/useSidebarStore';

/**
 * Menyalin `theme` dari store ke `<html class="dark">`.
 *
 * Ini mata rantai yang selama ini hilang: `tailwind.config.ts` sudah memakai
 * `darkMode: ["class"]` dan `global.css` sudah punya blok `.dark` lengkap,
 * tapi tidak ada satu pun kode yang menempelkan class-nya — sehingga seluruh
 * blok itu jadi kode mati dan hanya Sidebar yang berubah warna (lewat prop).
 *
 * Dipanggil SEKALI di App.tsx, di atas <BrowserRouter>, supaya ikut berlaku
 * di halaman Login dan NotFound yang berada di luar <Layout>.
 */
export function useApplyTheme() {
  const theme = useSidebarStore((s) => s.theme);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    // Membuat scrollbar, kontrol form bawaan, dan latar peramban ikut gelap.
    root.style.colorScheme = theme;
  }, [theme]);
}
