import { describe, it, expect } from "vitest";
import { rentangHonorBawaan } from "./honorPeriode";

/**
 * Rentang honor listing, pencacahan, dan pengolahan berawal dari jadwal
 * PENDATAAN — ketiganya memang bekerja pada masa itu, termasuk mitra
 * "pengolahan" yang mengerjakan entri dan cleaning.
 *
 * Sifat yang dikunci di sini: bawaan HANYA mengisi yang masih kosong.
 * Menggeser jadwal pendataan tidak boleh diam-diam memindahkan bulan
 * pembebanan honor yang sudah diputuskan — apalagi bila honornya sudah dibagi
 * ke beberapa bulan lewat metode prorata atau luber.
 */

describe("rentangHonorBawaan", () => {
  it("mengisi ketiga tahap saat semuanya masih kosong", () => {
    const hasil = rentangHonorBawaan("2026-02-01", "2026-02-28", {});
    expect(hasil).toEqual({
      tanggalMulaiHonorListing: "2026-02-01",
      tanggalSelesaiHonorListing: "2026-02-28",
      bulanHonorListing: "02-2026",
      tanggalMulaiHonorPencacahan: "2026-02-01",
      tanggalSelesaiHonorPencacahan: "2026-02-28",
      bulanHonorPencacahan: "02-2026",
      tanggalMulaiHonorPengolahan: "2026-02-01",
      tanggalSelesaiHonorPengolahan: "2026-02-28",
      bulanHonorPengolahan: "02-2026",
    });
  });

  it("TIDAK menimpa tahap yang rentangnya sudah disetel", () => {
    const hasil = rentangHonorBawaan("2026-02-01", "2026-02-28", {
      tanggalMulaiHonorListing: "2026-01-10",
      tanggalSelesaiHonorListing: "2026-01-20",
    });
    expect(hasil.tanggalMulaiHonorListing).toBeUndefined();
    expect(hasil.tanggalSelesaiHonorListing).toBeUndefined();
    expect(hasil.bulanHonorListing).toBeUndefined();
    // Dua tahap lain yang masih kosong tetap terisi.
    expect(hasil.tanggalMulaiHonorPencacahan).toBe("2026-02-01");
    expect(hasil.tanggalMulaiHonorPengolahan).toBe("2026-02-01");
  });

  it("satu ujung yang sudah terisi sudah cukup untuk dianggap disetel", () => {
    // Kalau hanya memeriksa tanggal mulai, rentang yang baru diisi ujung
    // selesainya akan ditimpa di tengah pengisian pengguna.
    const hasil = rentangHonorBawaan("2026-02-01", "2026-02-28", {
      tanggalSelesaiHonorPencacahan: "2026-03-05",
    });
    expect(hasil.tanggalMulaiHonorPencacahan).toBeUndefined();
    expect(hasil.tanggalSelesaiHonorPencacahan).toBeUndefined();
  });

  it("jadwal pendataan lintas bulan mengosongkan bulan pembebanan", () => {
    // Lebih dari satu bulan berarti keputusannya ada di pengguna (atau di
    // metode pembebanan per alokasi), jadi tidak boleh ditebak di sini.
    const hasil = rentangHonorBawaan("2026-02-15", "2026-03-15", {});
    expect(hasil.tanggalMulaiHonorListing).toBe("2026-02-15");
    expect(hasil.bulanHonorListing).toBeUndefined();
  });

  it("jadwal pendataan yang belum lengkap tidak mengubah apa pun", () => {
    expect(rentangHonorBawaan("2026-02-01", undefined, {})).toEqual({});
    expect(rentangHonorBawaan(undefined, "2026-02-28", {})).toEqual({});
    expect(rentangHonorBawaan(undefined, undefined, {})).toEqual({});
  });
});
