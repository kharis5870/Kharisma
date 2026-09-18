/**
 * Urutan tabel Generate SPK dan Generate BAST.
 *
 * Satu aturan untuk kedua tabel, supaya urutan "No. Surat" di tab SPK dan
 * "No. BAST" di tab BAST tidak menyimpang satu sama lain.
 *
 * Dua hal yang disengaja:
 * - Nomor dibandingkan sebagai ANGKA (2 sebelum 10). Dibandingkan sebagai teks,
 *   "10" justru mendahului "2".
 * - Mitra yang belum punya nilai (belum bernomor, jangka waktu kosong) selalu di
 *   BAWAH, baik urutan naik maupun turun. Kalau ikut dibalik, urutan turun
 *   menaruh semua yang belum bernomor di atas dan menutupi surat yang sudah ada.
 */

import type { DataKontrakMitra } from "@shared/api";

export type KolomUrutSurat = "nomor" | "nomorBast" | "nama" | "baris" | "jangkaWaktu" | "totalHonor";

export interface UrutanSurat {
  key: KolomUrutSurat;
  direction: "asc" | "desc";
}

/** Urutan saat halaman dibuka: nomor surat dari kecil ke besar. */
export const URUTAN_SURAT_AWAL: UrutanSurat = { key: "nomor", direction: "asc" };

/** Klik kolom yang sama membalik arah; klik kolom lain mulai dari urutan naik. */
export const ubahUrutan = (kini: UrutanSurat, kolom: KolomUrutSurat): UrutanSurat =>
  kini.key === kolom && kini.direction === "asc"
    ? { key: kolom, direction: "desc" }
    : { key: kolom, direction: "asc" };

/** Nilai pembanding sebuah kolom; `null` berarti belum ada nilai. */
const nilaiUrut = (m: DataKontrakMitra, kolom: KolomUrutSurat): number | string | null => {
  switch (kolom) {
    case "nomor":
      return m.nomorUrut ?? null;
    // Nomor BAST memakai nomor urut SPK yang sama, jadi urutannya pun sama —
    // tetapi hanya untuk mitra yang BAST-nya sudah dibuat.
    case "nomorBast":
      return m.nomorBast ? (m.nomorUrut ?? null) : null;
    case "nama":
      return m.nama ?? "";
    case "baris":
      return m.baris.length;
    // Format yyyy-MM-dd bisa dibandingkan sebagai teks.
    case "jangkaWaktu":
      return m.jangkaWaktuMulai ? `${m.jangkaWaktuMulai}|${m.jangkaWaktuSelesai ?? ""}` : null;
    case "totalHonor":
      return m.totalHonor;
  }
};

const bandingkanNama = (a: DataKontrakMitra, b: DataKontrakMitra): number =>
  (a.nama ?? "").localeCompare(b.nama ?? "", "id", { sensitivity: "base" });

/**
 * Salinan data yang sudah diurutkan. Nilai yang sama diurutkan menurut nama,
 * supaya urutan tidak melompat-lompat setiap data dimuat ulang.
 */
export const urutkanSurat = (data: DataKontrakMitra[], urutan: UrutanSurat): DataKontrakMitra[] => {
  const arah = urutan.direction === "asc" ? 1 : -1;
  return [...data].sort((a, b) => {
    const x = nilaiUrut(a, urutan.key);
    const y = nilaiUrut(b, urutan.key);
    if (x === null && y !== null) return 1;
    if (y === null && x !== null) return -1;
    if (x !== null && y !== null) {
      const beda = typeof x === "number" && typeof y === "number"
        ? x - y
        : String(x).localeCompare(String(y), "id", { sensitivity: "base" });
      if (beda !== 0) return beda * arah;
    }
    return bandingkanNama(a, b);
  });
};
