import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { bintangPenilaian, teksBintang, BINTANG_MAKSIMUM } from "@shared/mutuPenilaian";

/**
 * Bintang 1–5 pada penilaian mitra.
 *
 * Mengikuti Form Penilaian Petugas SE2026 milik BPS Bengkulu Selatan. Pasangan
 * nilai-bintang di bawah ini disalin dari form yang SUDAH TERISI — bukan dari
 * rumusnya — supaya kalau rumusnya kelak diutak-atik, yang menentukan tetap
 * hasil yang selama ini dipakai orang.
 */

/** 27 pasangan (rata-rata, bintang) dari form yang sudah terisi. */
const DARI_FORM: [number, number][] = [
  [5.667, 2], [2.333, 1], [7.333, 3], [7, 3], [6.667, 3], [8.667, 4], [1.333, 1],
  [6, 3], [2.667, 1], [9, 4], [3, 1], [7.667, 3], [5, 2], [6.333, 3], [8.333, 4],
  [10, 5], [4.667, 2], [4.333, 2], [3.667, 1], [1.667, 1], [1, 1], [2, 1],
  [5.333, 2], [4, 2], [9.333, 4], [9.667, 4], [8, 4],
];

describe("bintangPenilaian", () => {
  it("cocok dengan seluruh form yang sudah terisi", () => {
    for (const [rata, bintang] of DARI_FORM) {
      expect(bintangPenilaian(rata), `rata-rata ${rata}`).toBe(bintang);
    }
  });

  it("pecahan dipotong, tidak dibulatkan — tidak ada setengah bintang", () => {
    // 8,67 / 2 = 4,33 → empat bintang, bukan lima.
    expect(bintangPenilaian(8.667)).toBe(4);
    expect(bintangPenilaian(9.667)).toBe(4);
  });

  it("nilai terendah tetap satu bintang, bukan nol", () => {
    // Rumus Excel aslinya menghasilkan nol; form yang terisi selalu satu.
    expect(bintangPenilaian(1)).toBe(1);
    expect(bintangPenilaian(0.5)).toBe(1);
  });

  it("tidak pernah melebihi lima", () => {
    expect(bintangPenilaian(10)).toBe(BINTANG_MAKSIMUM);
    expect(bintangPenilaian(99)).toBe(BINTANG_MAKSIMUM);
  });

  it("belum dinilai bukan nol bintang, melainkan kosong", () => {
    expect(bintangPenilaian(null)).toBeNull();
    expect(bintangPenilaian(undefined)).toBeNull();
    expect(bintangPenilaian(Number.NaN)).toBeNull();
  });
});

describe("teksBintang", () => {
  it("menghasilkan bintang sebanyak nilainya", () => {
    expect(teksBintang(10)).toBe("★★★★★");
    expect(teksBintang(7)).toBe("★★★");
    expect(teksBintang(1.333)).toBe("★");
  });

  it("belum dinilai menghasilkan teks kosong", () => {
    expect(teksBintang(null)).toBe("");
  });
});

const baca = (jalur: string): string =>
  readFileSync(new URL(jalur, import.meta.url), "utf-8");

describe("kolom bintang di ekspor", () => {
  it("ikut di ekspor Daftar Penilaian Mitra dan Rekap", () => {
    for (const berkas of ["../pages/PenilaianMitra.tsx", "../pages/RekapPenilaian.tsx"]) {
      expect(baca(berkas), berkas).toContain("teksBintang(");
    }
  });
});

describe("bintang rekam jejak di Daftar PPL", () => {
  const layanan = baca("../../server/services/pplService.ts");
  const layar = baca("../pages/DaftarPPL.tsx");

  it("rata-ratanya seluruh waktu, di luar penyaring periode", () => {
    // Penyaring periode di Daftar PPL menyaring HONOR; bintang bicara mutu
    // orangnya. Subkueri berdiri sendiri, tidak menyentuh KONDISI_PERIODE.
    expect(layanan).toContain("FROM penilaian_mitra pn");
    expect(layanan).toContain("WHERE p2.ppl_master_id = pm.id) AS rataRataPenilaian");
    const subkueri = layanan.slice(
      layanan.indexOf("AS rataRataPenilaian") - 400, layanan.indexOf("AS jumlahPenilaian"));
    expect(subkueri).not.toContain("KONDISI_PERIODE");
    expect(subkueri).not.toContain("saringPeriode");
  });

  it("subkueri, bukan JOIN — supaya hitungan kegiatan tidak berlipat", () => {
    // JOIN ke penilaian akan menggandakan baris ppl pada GROUP BY,
    // sehingga COUNT(x.id) sebagai jumlah kegiatan ikut membesar.
    expect(layanan).toContain("(SELECT AVG(pn.rata_rata)");
    expect(layanan).toContain("(SELECT COUNT(*)");
  });

  it("jumlah penilaian ikut ditampilkan bersama bintangnya", () => {
    expect(layar).toContain("ppl.jumlahPenilaian");
    expect(layar).toContain("header: \"Jumlah Penilaian\"");
  });

  it("belum pernah dinilai tampil sebagai tanda pisah, bukan nol bintang", () => {
    expect(layar).toContain("—");
    expect(layar).toContain("rataRataPenilaian === null");
  });

  it("belum pernah dinilai selalu di bawah saat diurutkan", () => {
    expect(layar).toContain("return adaA === adaB ? 0 : (adaA ? -1 : 1);");
  });
});
