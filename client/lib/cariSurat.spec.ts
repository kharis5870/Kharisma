import { describe, it, expect } from "vitest";
import type { DataKontrakMitra, RiwayatSuratItem } from "@shared/api";
import { cariMitraSurat, cariRiwayatSurat, saringBulanSurat, NAMA_BULAN } from "./cariSurat";

const mitra = (nama: string, isi: Partial<DataKontrakMitra> = {}): DataKontrakMitra =>
  ({ pplMasterId: nama, nama, baris: [], totalHonor: 0, ...isi });

const surat = (namaPPL: string, isi: Partial<RiwayatSuratItem> = {}): RiwayatSuratItem =>
  ({ id: 1, namaPPL, nomorUrut: 1, nomorSurat: "001/SPK", status: "aktif", baris: [], ...isi } as RiwayatSuratItem);

describe("pencarian tabel Generate SPK & BAST", () => {
  const data = [
    mitra("Budi Santoso", { nomorUrut: 12, nomorSurat: "012/SPK/SEPTEMBER/IX/2026", nomorBast: "012/BAST/OKTOBER/X/2026" }),
    mitra("Siti Aminah", { nomorUrut: 3, nomorSurat: "003/SPK/SEPTEMBER/IX/2026" }),
    mitra("Budi Hartono"),
  ];

  it("kata kunci kosong mengembalikan semua data", () => {
    expect(cariMitraSurat(data, "   ")).toHaveLength(3);
  });

  it("mencari nama tanpa peduli huruf besar-kecil", () => {
    expect(cariMitraSurat(data, "BUDI").map(m => m.nama)).toEqual(["Budi Santoso", "Budi Hartono"]);
  });

  it("mencari nomor SPK dan nomor BAST", () => {
    expect(cariMitraSurat(data, "003/spk").map(m => m.nama)).toEqual(["Siti Aminah"]);
    expect(cariMitraSurat(data, "bast/oktober").map(m => m.nama)).toEqual(["Budi Santoso"]);
  });

  it("beberapa kata harus cocok semuanya", () => {
    expect(cariMitraSurat(data, "budi 012").map(m => m.nama)).toEqual(["Budi Santoso"]);
    expect(cariMitraSurat(data, "siti 012")).toEqual([]);
  });
});

describe("pencarian Riwayat Penyuratan", () => {
  const data = [
    surat("Budi", { status: "batal", catatan: "diganti surat 015" }),
    surat("Siti", { nomorUrut: 15, nomorSurat: "015/SPK" }),
  ];

  it("mencari status dan catatan", () => {
    expect(cariRiwayatSurat(data, "batal").map(s => s.namaPPL)).toEqual(["Budi"]);
    expect(cariRiwayatSurat(data, "berlaku").map(s => s.namaPPL)).toEqual(["Siti"]);
    expect(cariRiwayatSurat(data, "diganti").map(s => s.namaPPL)).toEqual(["Budi"]);
  });

  it("nomor surat ditemukan baik dari nomor SPK maupun dari catatan surat lain", () => {
    expect(cariRiwayatSurat(data, "015").map(s => s.namaPPL)).toEqual(["Budi", "Siti"]);
  });
});

describe("saringBulanSurat", () => {
  const data = [
    surat("Budi", { tanggalSurat: "2026-09-08" }),
    surat("Siti", { tanggalSurat: "2026-10-01" }),
    surat("Ani", { tanggalSurat: "2026-09-30" }),
  ];

  it("hanya surat pada bulan itu", () => {
    expect(saringBulanSurat(data, "09").map(s => s.namaPPL)).toEqual(["Budi", "Ani"]);
    expect(saringBulanSurat(data, "10").map(s => s.namaPPL)).toEqual(["Siti"]);
  });

  it("tanggal 1 tidak jatuh ke bulan sebelumnya", () => {
    // Membaca bulan lewat `new Date` akan menggeser tanggal 1 pukul 00:00 WIB
    // ke bulan sebelumnya di mesin yang berjalan UTC.
    expect(saringBulanSurat(data, "10").map(s => s.namaPPL)).toEqual(["Siti"]);
  });

  it("nilai selain 01-12 berarti semua bulan", () => {
    expect(saringBulanSurat(data, "all")).toHaveLength(3);
    expect(saringBulanSurat(data, "")).toHaveLength(3);
    expect(saringBulanSurat(data, "13")).toHaveLength(3);
  });

  it("dua belas nama bulan tersedia untuk pilihan", () => {
    expect(NAMA_BULAN).toHaveLength(12);
    expect(NAMA_BULAN[0]).toBe("Januari");
    expect(NAMA_BULAN[11]).toBe("Desember");
  });
});
