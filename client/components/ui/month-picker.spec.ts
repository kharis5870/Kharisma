import { describe, it, expect } from "vitest";
import { daftarTahun, labelBulan, uraiBulan, bulanSekarang, NAMA_BULAN } from "./month-picker";

/**
 * Aturan pemilih bulan. Yang dikunci:
 * - nilai yang tidak sah tidak boleh bocor sebagai "NaN" ke layar;
 * - daftar tahun berpusat pada tahun TERPILIH, supaya membuka data lama tidak
 *   membuat tahun itu sendiri hilang dari pilihan.
 */

describe("uraiBulan", () => {
  it("membaca format MM-yyyy", () => {
    expect(uraiBulan("09-2026")).toEqual({ bulan: 9, tahun: 2026 });
    expect(uraiBulan("01-2024")).toEqual({ bulan: 1, tahun: 2024 });
  });

  it("menolak bentuk lain dan bulan di luar 1-12", () => {
    expect(uraiBulan("2026-09")).toBeNull();
    expect(uraiBulan("9-2026")).toBeNull();
    expect(uraiBulan("13-2026")).toBeNull();
    expect(uraiBulan("00-2026")).toBeNull();
    expect(uraiBulan("")).toBeNull();
    expect(uraiBulan(undefined)).toBeNull();
  });
});

describe("labelBulan", () => {
  it("menyusun label berbahasa Indonesia", () => {
    expect(labelBulan("09-2026")).toBe("September 2026");
    expect(labelBulan("12-2025")).toBe("Desember 2025");
  });

  it("nilai tidak sah menghasilkan teks kosong, bukan NaN", () => {
    expect(labelBulan("salah")).toBe("");
    expect(labelBulan(undefined)).toBe("");
  });
});

describe("daftarTahun", () => {
  it("berpusat pada tahun terpilih", () => {
    expect(daftarTahun(2026, 2)).toEqual([2024, 2025, 2026, 2027, 2028]);
  });

  it("selalu memuat tahun terpilih, termasuk tahun lama", () => {
    expect(daftarTahun(2019)).toContain(2019);
  });
});

describe("bulanSekarang", () => {
  it("berformat MM-yyyy dengan nol di depan", () => {
    expect(bulanSekarang()).toMatch(/^\d{2}-\d{4}$/);
    expect(uraiBulan(bulanSekarang())).not.toBeNull();
  });
});

describe("NAMA_BULAN", () => {
  it("dua belas bulan, urut Januari sampai Desember", () => {
    expect(NAMA_BULAN).toHaveLength(12);
    expect(NAMA_BULAN[0]).toBe("Januari");
    expect(NAMA_BULAN[11]).toBe("Desember");
  });
});
