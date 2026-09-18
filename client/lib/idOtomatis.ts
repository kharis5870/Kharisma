/**
 * Pembuat ID berurutan yang mengisi lubang.
 *
 * ID di aplikasi ini (USR001, KT001, PPL001) murni pembeda, bukan penanda
 * urutan waktu. Karena itu ID yang ditinggalkan baris terhapus boleh — bahkan
 * sebaiknya — dipakai lagi, supaya penomorannya tidak berlubang selamanya.
 *
 * Aturannya: ambil nomor terkecil yang belum terpakai, mulai dari 1.
 * Kalau USR002 dihapus, akun berikutnya mendapat USR002; setelah semua lubang
 * terisi, penomoran melanjutkan dari yang tertinggi.
 */

import { alokasiIdMitra } from "@shared/terapkanImporMitra";

/** Mengambil angka dari sebuah ID, mis. "USR012" -> 12. Null bila tidak cocok. */
export const nomorDariId = (id: string, prefiks: string): number | null => {
  const pola = new RegExp(`^${prefiks}(\\d+)$`, 'i');
  const cocok = String(id ?? '').trim().match(pola);
  if (!cocok) return null;
  const n = parseInt(cocok[1], 10);
  return Number.isFinite(n) && n > 0 ? n : null;
};

/**
 * ID berikutnya yang tersedia.
 *
 * @param idTerpakai daftar ID yang sudah ada (boleh bercampur format lain)
 * @param prefiks    mis. "USR"
 * @param lebar      jumlah digit, mis. 3 -> "USR007"
 *
 *   nextId(['USR001','USR003'], 'USR')  -> 'USR002'   (mengisi lubang)
 *   nextId(['USR001','USR002'], 'USR')  -> 'USR003'   (melanjutkan)
 *   nextId([], 'USR')                   -> 'USR001'
 */
export const nextId = (idTerpakai: string[], prefiks: string, lebar = 3): string =>
  // Aturannya satu, dipakai bersama impor mitra yang membutuhkan banyak ID
  // sekaligus: `alokasiIdMitra` dengan jumlah 1 menghasilkan ID yang sama
  // persis. Kalau nomornya melampaui lebar yang diminta, ID-nya memanjang
  // daripada memotong digit dan bertabrakan.
  alokasiIdMitra(idTerpakai, 1, prefiks, lebar)[0];
