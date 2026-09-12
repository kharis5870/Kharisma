import type { UserData } from "@shared/api";

/**
 * Daftar halaman aplikasi, satu sumber untuk judul di Header dan untuk hasil
 * pencarian global.
 *
 * Sebelumnya peta path→judul hanya hidup sebagai `switch` di dalam Header,
 * sehingga tidak bisa dipakai ulang dan gampang menyimpang dari daftar rute
 * yang sebenarnya di App.tsx.
 */
export interface HalamanAplikasi {
  path: string;
  judul: string;
  /** Dibatasi peran tertentu. Kosong berarti terbuka untuk semua. */
  peran?: UserData['role'][];
}

export const HALAMAN_APLIKASI: HalamanAplikasi[] = [
  { path: '/dashboard', judul: 'Dashboard' },
  { path: '/input-kegiatan', judul: 'Input Kegiatan Baru' },
  { path: '/daftar-ppl', judul: 'Daftar PPL' },
  { path: '/daftar-pml', judul: 'Daftar PML' },
  { path: '/manajemen-honor', judul: 'Manajemen Honor' },
  { path: '/penilaian-mitra', judul: 'Penilaian Mitra' },
  { path: '/rekap-penilaian', judul: 'Rekapitulasi Penilaian Mitra' },
  { path: '/generate-kontrak', judul: 'Generate Kontrak Mitra', peran: ['admin', 'supervisor'] },
  { path: '/riwayat-surat', judul: 'Riwayat Penyuratan', peran: ['admin', 'supervisor'] },
  { path: '/template-surat', judul: 'Template Surat', peran: ['admin', 'supervisor'] },
  { path: '/manajemen-admin', judul: 'Manajemen Admin', peran: ['admin'] },
  { path: '/profil', judul: 'Pengaturan Profil' },
];

/**
 * Judul halaman dari sebuah path.
 *
 * Rute berparameter (`/edit-activity/:id`, `/view-documents/:id`) tidak ada di
 * daftar di atas karena tidak bisa dituju langsung dari pencarian, jadi
 * ditangani terpisah di sini.
 */
export const judulDariPath = (path: string): string => {
  const cocok = HALAMAN_APLIKASI.find(h => h.path === path);
  if (cocok) return cocok.judul;
  if (path.startsWith('/edit-activity')) return 'Edit Kegiatan';
  if (path.startsWith('/view-documents')) return 'Dokumen Kegiatan';
  return 'Kharisma';
};
