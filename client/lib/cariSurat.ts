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

/** Nama bulan untuk pilihan filter, indeks 0 = Januari. */
export const NAMA_BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
] as const;

/**
 * Menyaring riwayat surat menurut BULAN tanggal suratnya.
 *
 * Bulan diambil dari teks 'yyyy-MM-dd' yang dikirim server (kuerinya memakai
 * DATE_FORMAT), bukan lewat `new Date` — mengubahnya menjadi Date lalu membaca
 * `getMonth()` mengikuti zona waktu mesin, dan surat tanggal 1 bisa jatuh ke
 * bulan sebelumnya.
 *
 * `bulan` berupa dua digit '01'–'12'; nilai lain berarti semua bulan.
 */
export const saringBulanSurat = (
  data: RiwayatSuratItem[],
  bulan: string,
): RiwayatSuratItem[] =>
  /^(0[1-9]|1[0-2])$/.test(bulan)
    ? data.filter(s => String(s.tanggalSurat ?? '').slice(5, 7) === bulan)
    : data;
