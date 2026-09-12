import { describe, it, expect } from "vitest";
import { hariTerakhir, kueriPeriode, rentangPeriode } from "./periodePreset";

/**
 * Batas-batas periode. Yang dikunci adalah tempat-tempat yang paling sering
 * salah bila dihitung manual: akhir Februari di tahun kabisat, "bulan depan"
 * yang melompati pergantian tahun, dan batas triwulan.
 */

describe("hariTerakhir", () => {
  it("Februari tahun kabisat 29 hari, tahun biasa 28", () => {
    expect(hariTerakhir(2024, 2)).toBe(29);
    expect(hariTerakhir(2026, 2)).toBe(28);
    expect(hariTerakhir(2100, 2)).toBe(28); // kelipatan 100 bukan kabisat
  });

  it("bulan 30 dan 31 hari", () => {
    expect(hariTerakhir(2026, 4)).toBe(30);
    expect(hariTerakhir(2026, 12)).toBe(31);
  });
});

describe("rentangPeriode", () => {
  const sep = new Date(2026, 8, 12); // 12 September 2026

  it("semua berarti JANGAN menyaring, bukan rentang yang sangat lebar", () => {
    // Rentang lebar tetap membuang kegiatan tanpa tanggal honor; null tidak.
    expect(rentangPeriode("semua", sep)).toBeNull();
  });

  it("bulan ini", () => {
    expect(rentangPeriode("bulan-ini", sep)).toEqual({ mulai: "2026-09-01", selesai: "2026-09-30" });
  });

  it("bulan depan", () => {
    expect(rentangPeriode("bulan-depan", sep)).toEqual({ mulai: "2026-10-01", selesai: "2026-10-31" });
  });

  it("bulan depan dari Desember berpindah tahun", () => {
    expect(rentangPeriode("bulan-depan", new Date(2026, 11, 20)))
      .toEqual({ mulai: "2027-01-01", selesai: "2027-01-31" });
  });

  it("bulan depan dari Januari tahun kabisat berakhir 29 Februari", () => {
    expect(rentangPeriode("bulan-depan", new Date(2024, 0, 15)))
      .toEqual({ mulai: "2024-02-01", selesai: "2024-02-29" });
  });

  it("triwulan mengikuti batas Jan-Mar, Apr-Jun, Jul-Sep, Okt-Des", () => {
    expect(rentangPeriode("triwulan-ini", new Date(2026, 0, 5)))
      .toEqual({ mulai: "2026-01-01", selesai: "2026-03-31" });
    expect(rentangPeriode("triwulan-ini", sep))
      .toEqual({ mulai: "2026-07-01", selesai: "2026-09-30" });
    expect(rentangPeriode("triwulan-ini", new Date(2026, 11, 31)))
      .toEqual({ mulai: "2026-10-01", selesai: "2026-12-31" });
  });

  it("tahun ini", () => {
    expect(rentangPeriode("tahun-ini", sep)).toEqual({ mulai: "2026-01-01", selesai: "2026-12-31" });
  });
});

describe("kueriPeriode", () => {
  it("kosong saat tidak menyaring", () => {
    expect(kueriPeriode(null)).toBe("");
  });

  it("menyusun kedua parameter", () => {
    expect(kueriPeriode({ mulai: "2026-09-01", selesai: "2026-09-30" }))
      .toBe("?tanggalMulai=2026-09-01&tanggalSelesai=2026-09-30");
  });
});
