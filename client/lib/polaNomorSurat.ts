/**
 * Pola nomor surat pada template (Surat PK dan BAST).
 *
 * Aturan penyusunannya sekarang tinggal di `@shared/nomorSurat` dan dipakai
 * bersama server, jadi contoh yang ditampilkan di layar dijamin sama dengan yang
 * nanti tercetak. Modul ini tinggal menyediakan keterangan untuk UI dan
 * membungkus penyusun bersama itu dengan nilai bawaan yang enak dipakai form.
 */

import { susunNomorSurat } from "@shared/nomorSurat";

export { PENANDA_SAH, penandaTidakDikenal, polaTanpaNomor } from "@shared/nomorSurat";

export interface KeteranganPenanda {
  penanda: string;
  arti: string;
}

export const KETERANGAN_PENANDA: KeteranganPenanda[] = [
  { penanda: '{nomor}', arti: 'nomor urut, 3 digit — 007 (wajib ada)' },
  { penanda: '{BULAN}', arti: 'nama bulan huruf besar — SEPTEMBER' },
  { penanda: '{bulan}', arti: 'angka bulan 2 digit — 09' },
  { penanda: '{ROMAWI}', arti: 'bulan angka Romawi — IX' },
  { penanda: '{tahun}', arti: 'tahun 4 digit — 2026' },
];

/**
 * Contoh hasil pola, supaya pengguna melihat bentuk akhirnya sebelum menyimpan.
 */
export const contohNomorSurat = (
  pola: string,
  nomorUrut = 7,
  tanggal: Date = new Date(),
): string => susunNomorSurat(pola, nomorUrut, tanggal);
