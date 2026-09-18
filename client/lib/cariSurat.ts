/**
 * Pencarian di tabel Generate SPK, Generate BAST, dan Riwayat Penyuratan.
 *
 * Kata kunci boleh lebih dari satu; SEMUA kata harus ditemukan di salah satu
 * kolom yang dicari. Jadi "budi 012" menemukan surat nomor 012 milik Budi,
 * bukan semua surat Budi ditambah semua surat bernomor 012.
 */

import type { DataKontrakMitra, RiwayatSuratItem } from "@shared/api";

type Bidang = string | number | null | undefined;

const normal = (teks: string): string => teks.toLocaleLowerCase("id").trim();

const cocokSemuaKata = (kataKunci: string, bidang: Bidang[]): boolean => {
  const kata = normal(kataKunci).split(/\s+/).filter(Boolean);
  if (kata.length === 0) return true;
  const teks = normal(bidang.filter(v => v !== null && v !== undefined && v !== "").join(" "));
  return kata.every(k => teks.includes(k));
};

/** Tabel Generate SPK & BAST: nama mitra, nomor SPK, nomor BAST, nomor urut. */
export const cariMitraSurat = (data: DataKontrakMitra[], kataKunci: string): DataKontrakMitra[] =>
  kataKunci.trim()
    ? data.filter(m => cocokSemuaKata(kataKunci, [m.nama, m.nomorSurat, m.nomorBast, m.nomorUrut]))
    : data;

/** Tabel Riwayat Penyuratan: juga catatan dan status (berlaku/batal). */
export const cariRiwayatSurat = (data: RiwayatSuratItem[], kataKunci: string): RiwayatSuratItem[] =>
  kataKunci.trim()
    ? data.filter(s => cocokSemuaKata(kataKunci, [
        s.namaPPL, s.nomorSurat, s.nomorBast, s.nomorUrut, s.catatan,
        s.status === "batal" ? "batal" : "berlaku",
      ]))
    : data;
