import { describe, it, expect } from "vitest";
import {
  SKALA_NILAI,
  tingkatMutu,
  nilaiPenilaianSah,
  rataRataPenilaian,
} from "@shared/mutuPenilaian";

describe("SKALA_NILAI", () => {
  it("bilangan bulat 1 sampai 10", () => {
    expect(SKALA_NILAI).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });
});

describe("tingkatMutu", () => {
  // Ambang 8 dan 6 diambil dari getRatingColor yang selama ini dipakai di
  // modal penilaian; batasnya diuji supaya perilakunya tidak bergeser.
  it("memakai ambang yang sama dengan sebelumnya", () => {
    expect(tingkatMutu(10)).toBe("baik");
    expect(tingkatMutu(8)).toBe("baik");
    expect(tingkatMutu(7.9)).toBe("cukup");
    expect(tingkatMutu(6)).toBe("cukup");
    expect(tingkatMutu(5.9)).toBe("kurang");
    expect(tingkatMutu(1)).toBe("kurang");
  });

  it("menerima angka dalam bentuk string, seperti dari state form", () => {
    expect(tingkatMutu("9")).toBe("baik");
    expect(tingkatMutu("3")).toBe("kurang");
  });

  // "Belum dinilai" berbeda dari "nilainya rendah" — keduanya tidak boleh
  // tampil dengan warna yang sama.
  it("membedakan belum dinilai dari nilai rendah", () => {
    expect(tingkatMutu(null)).toBeNull();
    expect(tingkatMutu(undefined)).toBeNull();
    expect(tingkatMutu("")).toBeNull();
    expect(tingkatMutu("bukan angka")).toBeNull();
  });
});

describe("nilaiPenilaianSah", () => {
  it("menerima seluruh nilai pada skala", () => {
    for (const n of SKALA_NILAI) expect(nilaiPenilaianSah(n), String(n)).toBe(true);
  });

  // Kolomnya int(2) dan server tidak pernah memeriksa rentang, jadi nilai
  // seperti 99 selama ini tersimpan apa adanya dan merusak rata-rata mitra.
  it("menolak yang di luar rentang", () => {
    expect(nilaiPenilaianSah(0)).toBe(false);
    expect(nilaiPenilaianSah(11)).toBe(false);
    expect(nilaiPenilaianSah(99)).toBe(false);
    expect(nilaiPenilaianSah(-5)).toBe(false);
  });

  it("menolak pecahan dan yang bukan angka", () => {
    expect(nilaiPenilaianSah(7.5)).toBe(false);
    expect(nilaiPenilaianSah("8")).toBe(false); // harus sudah di-parse pemanggil
    expect(nilaiPenilaianSah(null)).toBe(false);
    expect(nilaiPenilaianSah(undefined)).toBe(false);
    expect(nilaiPenilaianSah(NaN)).toBe(false);
  });
});

describe("rataRataPenilaian", () => {
  it("menghitung rata-rata tiga aspek", () => {
    expect(rataRataPenilaian(8, 9, 10)).toBe(9);
    expect(rataRataPenilaian(1, 1, 1)).toBe(1);
  });

  it("membulatkan dua desimal seperti kolom rata_rata", () => {
    expect(rataRataPenilaian(8, 8, 9)).toBe(8.33);
    expect(rataRataPenilaian(7, 8, 8)).toBe(7.67);
  });
});
