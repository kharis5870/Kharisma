import { describe, it, expect } from "vitest";
import {
  KUNCI_HARGA_SATUAN,
  hargaSatuanUntuk,
  hitungBesaranHonor,
  hitungTotalHonorPPL,
} from "./honorPPL";
import type { HonorariumSettingsMap } from "@shared/api";

const pengaturan: HonorariumSettingsMap = {
  "pengumpulan-data-listing": { satuanBebanKerja: "Dokumen", hargaSatuan: "24.000" },
  "pengumpulan-data-pencacahan": { satuanBebanKerja: "Responden", hargaSatuan: "15000" },
  "pengolahan-analisis": { satuanBebanKerja: "Dokumen", hargaSatuan: "" },
};

describe("pemetaan jenis pekerjaan ke kunci pengaturan", () => {
  it("memetakan ketiga jenis yang ada", () => {
    expect(KUNCI_HARGA_SATUAN).toEqual({
      listing: "pengumpulan-data-listing",
      pencacahan: "pengumpulan-data-pencacahan",
      pengolahan: "pengolahan-analisis",
    });
  });

  it("'pengolahan' bukan 'pengolahan-analisis' — itu nama tahap, bukan jenis pekerjaan", () => {
    // Kekeliruan yang gampang terjadi saat menyalin: alokasi PPL memakai
    // tahap 'pengolahan-analisis', tapi baris honorariumnya 'pengolahan'.
    expect(hargaSatuanUntuk("pengolahan-analisis", pengaturan)).toBe(0);
    expect(KUNCI_HARGA_SATUAN.pengolahan).toBe("pengolahan-analisis");
  });
});

describe("hargaSatuanUntuk", () => {
  it("membaca angka yang berpemisah ribuan", () => {
    expect(hargaSatuanUntuk("listing", pengaturan)).toBe(24000);
  });

  it("membaca angka polos", () => {
    expect(hargaSatuanUntuk("pencacahan", pengaturan)).toBe(15000);
  });

  it("mengembalikan 0 — bukan NaN — untuk isian kosong, jenis asing, dan pengaturan yang belum dimuat", () => {
    // NaN di sini akan muncul di layar sebagai "Rp NaN" dan tersimpan NULL.
    expect(hargaSatuanUntuk("pengolahan", pengaturan)).toBe(0);
    expect(hargaSatuanUntuk("entah", pengaturan)).toBe(0);
    expect(hargaSatuanUntuk(undefined, pengaturan)).toBe(0);
    expect(hargaSatuanUntuk("listing", undefined)).toBe(0);
    expect(hargaSatuanUntuk("listing", {})).toBe(0);
  });
});

describe("hitungBesaranHonor", () => {
  it("mengalikan beban kerja dengan harga satuan", () => {
    expect(hitungBesaranHonor("14", "listing", pengaturan)).toBe(336_000);
    expect(hitungBesaranHonor(22, "listing", pengaturan)).toBe(528_000);
  });

  it("beban kerja kosong berarti nol, bukan NaN", () => {
    expect(hitungBesaranHonor("", "listing", pengaturan)).toBe(0);
    expect(hitungBesaranHonor(undefined, "listing", pengaturan)).toBe(0);
  });

  it("mengikuti harga satuan yang BARU, bukan besaranHonor yang tersimpan", () => {
    // Inti perbaikannya: harga satuan naik dari 24.000 ke 30.000, dan honornya
    // ikut naik tanpa beban kerja perlu disentuh sama sekali.
    const naik: HonorariumSettingsMap = {
      ...pengaturan,
      "pengumpulan-data-listing": { satuanBebanKerja: "Dokumen", hargaSatuan: "30.000" },
    };
    expect(hitungBesaranHonor("14", "listing", naik)).toBe(420_000);
  });
});

describe("hitungTotalHonorPPL", () => {
  it("menjumlahkan seluruh baris pekerjaan", () => {
    const honorarium = [
      { jenis_pekerjaan: "listing", bebanKerja: "14", besaranHonor: "336000" },
      { jenis_pekerjaan: "pencacahan", bebanKerja: "10", besaranHonor: "150000" },
    ];
    expect(hitungTotalHonorPPL(honorarium, pengaturan)).toBe(336_000 + 150_000);
  });

  it("MENGABAIKAN besaranHonor tersimpan yang sudah basi", () => {
    // Baris ini menyimpan honor hasil harga satuan lama (20.000 × 14).
    // Yang benar adalah harga satuan sekarang (24.000 × 14).
    const basi = [{ jenis_pekerjaan: "listing", bebanKerja: "14", besaranHonor: "280000" }];
    expect(hitungTotalHonorPPL(basi, pengaturan)).toBe(336_000);
  });

  it("daftar kosong atau tidak ada sama-sama nol", () => {
    expect(hitungTotalHonorPPL([], pengaturan)).toBe(0);
    expect(hitungTotalHonorPPL(undefined, pengaturan)).toBe(0);
  });
});
