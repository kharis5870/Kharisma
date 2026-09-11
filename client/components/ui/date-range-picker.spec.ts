import { describe, it, expect } from "vitest";
import { langkahPilih } from "./date-range-picker";

const tgl = (y: number, m: number, d: number) => new Date(y, m - 1, d);

describe("langkahPilih (pemilihan rentang dua klik)", () => {
  // Inti perbaikan: `addToRange` bawaan react-day-picker mengembalikan
  // { from: X, to: X } pada klik pertama, sehingga rentang terlihat lengkap
  // dan popover menutup sebelum tanggal akhir sempat dipilih.
  it("klik pertama hanya memasang jangkar, belum menyimpan rentang", () => {
    const langkah = langkahPilih(undefined, tgl(2026, 9, 10));
    expect(langkah).toEqual({ jenis: "mulai", jangkar: tgl(2026, 9, 10) });
  });

  it("klik kedua menyimpan rentang lengkap", () => {
    const langkah = langkahPilih(tgl(2026, 9, 10), tgl(2026, 9, 20));
    expect(langkah).toEqual({
      jenis: "selesai",
      rentang: { mulai: "2026-09-10", selesai: "2026-09-20" },
    });
  });

  it("urutan klik terbalik tetap menghasilkan rentang yang benar", () => {
    // Pengguna mengeklik 20 dulu, lalu 10.
    const langkah = langkahPilih(tgl(2026, 9, 20), tgl(2026, 9, 10));
    expect(langkah).toEqual({
      jenis: "selesai",
      rentang: { mulai: "2026-09-10", selesai: "2026-09-20" },
    });
  });

  it("mengizinkan rentang satu hari", () => {
    const langkah = langkahPilih(tgl(2026, 9, 10), tgl(2026, 9, 10));
    expect(langkah).toEqual({
      jenis: "selesai",
      rentang: { mulai: "2026-09-10", selesai: "2026-09-10" },
    });
  });

  it("rentang lintas bulan dan tahun tidak bergeser sehari", () => {
    // Format ditulis dari komponen tanggal lokal, bukan lewat toISOString,
    // jadi tidak terpengaruh zona waktu WIB (UTC+7).
    expect(langkahPilih(tgl(2025, 12, 31), tgl(2026, 1, 1))).toEqual({
      jenis: "selesai",
      rentang: { mulai: "2025-12-31", selesai: "2026-01-01" },
    });
  });

  it("dua klik berurutan mensimulasikan alur lengkap satu popover", () => {
    const klik1 = langkahPilih(undefined, tgl(2026, 1, 21));
    expect(klik1.jenis).toBe("mulai");
    const klik2 = langkahPilih(
      klik1.jenis === "mulai" ? klik1.jangkar : undefined,
      tgl(2026, 3, 5),
    );
    expect(klik2).toEqual({
      jenis: "selesai",
      rentang: { mulai: "2026-01-21", selesai: "2026-03-05" },
    });
  });
});
