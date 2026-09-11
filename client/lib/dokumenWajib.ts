/**
 * Daftar dokumen wajib bawaan setiap tahap kegiatan.
 *
 * Sebelumnya daftar ini hanya ada di dalam `useInputKegiatanStore` dan tidak
 * diekspor, sehingga hanya kegiatan BARU yang bisa mendapatkannya. Sejak tahap
 * Pengolahan & Diseminasi bisa dimatikan lalu dinyalakan lagi dari halaman Edit
 * Kegiatan, halaman itu perlu daftar yang sama — mematikan tahap menghapus
 * dokumennya permanen, jadi menyalakannya kembali harus memunculkan lagi slot
 * wajibnya, kalau tidak tahap itu hidup tanpa satu pun dokumen yang dituntut.
 *
 * Yang TIDAK kembali adalah link yang dulu terisi. Itu memang konsekuensi yang
 * dipilih saat memutuskan penghapusannya permanen.
 */

import type { Dokumen } from "@shared/api";

export interface DokumenWajib {
  nama: string;
  jenis: 'link';
  tipe: Dokumen['tipe'];
  isWajib: true;
}

export const DOKUMEN_WAJIB: DokumenWajib[] = [
  { nama: 'SK ', jenis: 'link', tipe: 'persiapan', isWajib: true },
  { nama: 'Surat Tugas', jenis: 'link', tipe: 'persiapan', isWajib: true },
  { nama: 'Undangan', jenis: 'link', tipe: 'persiapan', isWajib: true },
  { nama: 'Daftar Hadir', jenis: 'link', tipe: 'persiapan', isWajib: true },
  { nama: 'Notulensi', jenis: 'link', tipe: 'persiapan', isWajib: true },
  { nama: 'Laporan Pelatihan', jenis: 'link', tipe: 'persiapan', isWajib: true },
  { nama: 'KAK', jenis: 'link', tipe: 'pengumpulan-data', isWajib: true },
  { nama: 'SK', jenis: 'link', tipe: 'pengumpulan-data', isWajib: true },
  { nama: 'ST', jenis: 'link', tipe: 'pengumpulan-data', isWajib: true },
  { nama: 'Visum', jenis: 'link', tipe: 'pengumpulan-data', isWajib: true },
  { nama: 'BAST', jenis: 'link', tipe: 'pengumpulan-data', isWajib: true },
  { nama: 'Laporan Pengumpulan Data', jenis: 'link', tipe: 'pengumpulan-data', isWajib: true },
  { nama: 'Laporan Pengolahan & Analisis', jenis: 'link', tipe: 'pengolahan-analisis', isWajib: true },
  { nama: 'Dokumentasi', jenis: 'link', tipe: 'pengolahan-analisis', isWajib: true },
  { nama: 'Laporan Diseminasi & Evaluasi', jenis: 'link', tipe: 'diseminasi-evaluasi', isWajib: true },
];

/** Dokumen wajib satu tahap saja. */
export const dokumenWajibTahap = (tipe: Dokumen['tipe']): DokumenWajib[] =>
  DOKUMEN_WAJIB.filter(d => d.tipe === tipe);
