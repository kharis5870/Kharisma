import { describe, it, expect } from "vitest";
import { terbilang, terbilangRupiah, formatRupiah, keRomawi } from "./terbilang";

describe("terbilang", () => {
  it("menangani angka dasar", () => {
    expect(terbilang(0)).toBe("Nol");
    expect(terbilang(1)).toBe("Satu");
    expect(terbilang(9)).toBe("Sembilan");
  });

  it("menangani kekhasan belasan", () => {
    expect(terbilang(10)).toBe("Sepuluh");
    expect(terbilang(11)).toBe("Sebelas");
    expect(terbilang(12)).toBe("Dua Belas");
    expect(terbilang(19)).toBe("Sembilan Belas");
  });

  it("menangani puluhan", () => {
    expect(terbilang(20)).toBe("Dua Puluh");
    expect(terbilang(21)).toBe("Dua Puluh Satu");
    expect(terbilang(99)).toBe("Sembilan Puluh Sembilan");
  });

  it("memakai 'Seratus', bukan 'Satu Ratus'", () => {
    expect(terbilang(100)).toBe("Seratus");
    expect(terbilang(101)).toBe("Seratus Satu");
    expect(terbilang(150)).toBe("Seratus Lima Puluh");
    expect(terbilang(200)).toBe("Dua Ratus");
  });

  it("memakai 'Seribu', bukan 'Satu Ribu'", () => {
    expect(terbilang(1000)).toBe("Seribu");
    expect(terbilang(1001)).toBe("Seribu Satu");
    expect(terbilang(2000)).toBe("Dua Ribu");
  });

  it("menangani ribuan, jutaan, dan miliaran", () => {
    expect(terbilang(15000)).toBe("Lima Belas Ribu");
    expect(terbilang(24000)).toBe("Dua Puluh Empat Ribu");
    expect(terbilang(128000)).toBe("Seratus Dua Puluh Delapan Ribu");
    expect(terbilang(1_000_000)).toBe("Satu Juta");
    expect(terbilang(1_000_000_000)).toBe("Satu Miliar");
  });

  // Nilai ini diambil langsung dari contoh Surat PK nomor 097/SPK/FEBRUARI/II/2026.
  it("cocok dengan nilai pada contoh Surat PK", () => {
    expect(terbilang(2_726_000)).toBe("Dua Juta Tujuh Ratus Dua Puluh Enam Ribu");
    expect(terbilangRupiah(2_726_000)).toBe("Dua Juta Tujuh Ratus Dua Puluh Enam Ribu Rupiah");
  });

  it("cocok dengan nilai baris lampiran Surat PK", () => {
    expect(terbilang(1_280_000)).toBe("Satu Juta Dua Ratus Delapan Puluh Ribu");
    expect(terbilang(860_000)).toBe("Delapan Ratus Enam Puluh Ribu");
    expect(terbilang(288_000)).toBe("Dua Ratus Delapan Puluh Delapan Ribu");
    expect(terbilang(192_000)).toBe("Seratus Sembilan Puluh Dua Ribu");
    expect(terbilang(106_000)).toBe("Seratus Enam Ribu");
  });

  it("menangani honor rusak yang sudah diperbaiki migrasi", () => {
    expect(terbilang(12_002)).toBe("Dua Belas Ribu Dua");
    expect(terbilang(144_024)).toBe("Seratus Empat Puluh Empat Ribu Dua Puluh Empat");
  });
});

describe("formatRupiah", () => {
  it("memakai titik sebagai pemisah ribuan", () => {
    expect(formatRupiah(1_280_000)).toBe("Rp1.280.000");
    expect(formatRupiah(0)).toBe("Rp0");
    expect(formatRupiah(24_000)).toBe("Rp24.000");
  });
});

describe("keRomawi", () => {
  it("mengubah bulan menjadi angka Romawi untuk nomor surat", () => {
    expect(keRomawi(1)).toBe("I");
    expect(keRomawi(2)).toBe("II");
    expect(keRomawi(4)).toBe("IV");
    expect(keRomawi(9)).toBe("IX");
    expect(keRomawi(10)).toBe("X");
    expect(keRomawi(12)).toBe("XII");
  });
});
