import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import {
  komentarPenilaianSah, rapikanKomentar, PANJANG_MIN_KOMENTAR,
} from "@shared/mutuPenilaian";

/**
 * Komentar wajib pada penilaian mitra.
 *
 * Diminta SOBAT, dan gunanya bukan sekadar memenuhi syarat: angka 1–10 tidak
 * menjelaskan apa pun ketika mitra mempertanyakan nilainya, atau ketika mitra
 * yang sama diusulkan lagi tahun depan oleh PML yang berbeda.
 */

describe("komentarPenilaianSah", () => {
  const cukup = "Teliti mengisi kuesioner dan tepat waktu.";

  it("komentar yang memadai diterima", () => {
    expect(komentarPenilaianSah(cukup)).toBe(true);
  });

  it("terlalu pendek ditolak", () => {
    expect(komentarPenilaianSah("Bagus")).toBe(false);
    expect(komentarPenilaianSah("a".repeat(PANJANG_MIN_KOMENTAR - 1))).toBe(false);
    expect(komentarPenilaianSah("a".repeat(PANJANG_MIN_KOMENTAR))).toBe(true);
  });

  it("spasi saja tidak dihitung sebagai komentar", () => {
    // Tanpa perapian, dua puluh spasi lolos sebagai komentar yang sah.
    expect(komentarPenilaianSah(" ".repeat(40))).toBe(false);
  });

  it("kosong dan tidak diisi sama-sama ditolak", () => {
    expect(komentarPenilaianSah("")).toBe(false);
    expect(komentarPenilaianSah(null)).toBe(false);
    expect(komentarPenilaianSah(undefined)).toBe(false);
  });
});

describe("rapikanKomentar", () => {
  it("spasi ganda dan spasi tepi dibuang", () => {
    expect(rapikanKomentar("  Teliti   mengisi  kuesioner.  "))
      .toBe("Teliti mengisi kuesioner.");
  });

  it("baris baru ikut dirapikan", () => {
    expect(rapikanKomentar("Baris satu\n\nbaris dua")).toBe("Baris satu baris dua");
  });
});

const baca = (jalur: string): string =>
  readFileSync(new URL(jalur, import.meta.url), "utf-8");

describe("penegakan di layar dan server", () => {
  it("tombol simpan mati selama komentar belum memadai", () => {
    const layar = baca("../pages/PenilaianMitra.tsx");
    expect(layar).toContain("disabled={isSaving || !komentarPenilaianSah(komentar)}");
  });

  it("server memeriksanya juga, bukan hanya layar", () => {
    // Permintaan langsung ke API tidak melewati layar.
    const rute = baca("../../server/routes/penilaian.ts");
    expect(rute).toContain("if (!komentarPenilaianSah(komentar))");
    expect(rute).toContain("PESAN_KOMENTAR_PENDEK");
  });

  it("server mengimpornya lewat jalur relatif, bukan alias @shared", () => {
    // vite.config.ts memuat kode server lewat Node, dan alias itu tidak
    // tersedia di sana — seluruh dev server gagal menyala bila dipakai.
    const rute = baca("../../server/routes/penilaian.ts");
    expect(rute).toContain("from '../../shared/mutuPenilaian'");
    expect(rute).not.toContain("from '@shared/mutuPenilaian'");
  });

  it("komentar ikut disimpan dan diperbarui saat penilaian diubah", () => {
    const layanan = baca("../../server/services/penilaianService.ts");
    expect(layanan).toContain("komentar = VALUES(komentar)");
    expect(layanan).toContain("rapikanKomentar(data.komentar)");
  });

  it("komentar ikut terbaca kembali dan ikut diekspor", () => {
    expect(baca("../../server/services/penilaianService.ts")).toContain("pn.komentar AS komentar");
    expect(baca("../pages/PenilaianMitra.tsx")).toContain("header: 'Komentar'");
  });
});
