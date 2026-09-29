import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { keSkalaLima, NILAI_MAKSIMUM } from "@shared/mutuPenilaian";

/**
 * Konversi nilai ke skala 1–5 untuk pelaporan ke SOBAT.
 *
 * Aplikasi ini menilai dengan skala 1–10, SOBAT memakai 1–5. Konversinya hanya
 * terjadi saat MENGEKSPOR; yang tersimpan tetap 1–10 supaya penilaian lama
 * tidak berubah arti dan peringkat antar-mitra tetap sebanding.
 */

describe("keSkalaLima", () => {
  it("nilai tertinggi menjadi 5", () => {
    expect(keSkalaLima(NILAI_MAKSIMUM)).toBe(5);
  });

  it("dibagi dua, bukan dipetakan per rentang", () => {
    // Pemetaan rentang akan membuat 7 dan 8 sama-sama bernilai 4.
    expect(keSkalaLima(7)).toBe(3.5);
    expect(keSkalaLima(8)).toBe(4);
  });

  it("dua desimal, mengikuti ketelitian kolom rata_rata", () => {
    expect(keSkalaLima(8.33)).toBe(4.17);
    expect(keSkalaLima(7.77)).toBe(3.89);
  });

  it("belum dinilai tetap kosong, bukan nol", () => {
    // Nol berarti "dinilai sangat buruk"; itu beda dengan belum dinilai.
    expect(keSkalaLima(null)).toBeNull();
    expect(keSkalaLima(undefined)).toBeNull();
    expect(keSkalaLima(Number.NaN)).toBeNull();
  });
});

const baca = (jalur: string): string =>
  readFileSync(new URL(jalur, import.meta.url), "utf-8");

describe("kolom ekspor", () => {
  it("kedua layar ekspor memuat kolom skala 1-5", () => {
    for (const berkas of ["../pages/RekapPenilaian.tsx", "../pages/PenilaianMitra.tsx"]) {
      const isi = baca(berkas);
      expect(isi, berkas).toContain("keSkalaLima(");
      expect(isi, berkas).toContain("skala 1-5");
    }
  });

  it("nilai asli 1-10 tetap ikut diekspor, tidak digantikan", () => {
    const rekap = baca("../pages/RekapPenilaian.tsx");
    expect(rekap).toContain("header: 'Rata-rata Nilai'");
  });

  it("nilaiAkhir tidak ikut dikonversi", () => {
    // nilaiAkhir = rata-rata + 0,01 per kegiatan (pemecah seri), bukan nilai
    // mutu; membaginya dua tidak menghasilkan skala apa pun.
    const rekap = baca("../pages/RekapPenilaian.tsx");
    expect(rekap).not.toContain("keSkalaLima(r.nilaiAkhir");
  });
});
