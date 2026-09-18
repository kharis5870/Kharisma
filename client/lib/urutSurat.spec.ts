import { describe, it, expect } from "vitest";
import type { DataKontrakMitra } from "@shared/api";
import { urutkanSurat, ubahUrutan, URUTAN_SURAT_AWAL } from "./urutSurat";

const mitra = (nama: string, isi: Partial<DataKontrakMitra> = {}): DataKontrakMitra => ({
  pplMasterId: nama,
  nama,
  baris: [],
  totalHonor: 0,
  ...isi,
});

const nama = (data: DataKontrakMitra[]) => data.map(m => m.nama);

describe("urutan tabel Generate SPK & BAST", () => {
  const data = [
    mitra("Citra", { nomorUrut: 10, totalHonor: 500 }),
    mitra("Budi"),
    mitra("Andi", { nomorUrut: 2, totalHonor: 900 }),
    mitra("Dewi", { nomorUrut: 7, totalHonor: 900 }),
    mitra("Eka"),
  ];

  it("awalnya nomor surat dari kecil ke besar, dibandingkan sebagai angka", () => {
    expect(URUTAN_SURAT_AWAL).toEqual({ key: "nomor", direction: "asc" });
    expect(nama(urutkanSurat(data, URUTAN_SURAT_AWAL))).toEqual(["Andi", "Dewi", "Citra", "Budi", "Eka"]);
  });

  it("mitra tanpa nomor tetap di bawah saat urutan dibalik", () => {
    expect(nama(urutkanSurat(data, { key: "nomor", direction: "desc" }))).toEqual(["Citra", "Dewi", "Andi", "Budi", "Eka"]);
  });

  it("nilai kembar diurutkan menurut nama", () => {
    const hasil = nama(urutkanSurat(data, { key: "totalHonor", direction: "desc" }));
    expect(hasil.slice(0, 2)).toEqual(["Andi", "Dewi"]);
  });

  it("nomor BAST hanya dihitung untuk mitra yang BAST-nya sudah dibuat", () => {
    const bast = [
      mitra("A", { nomorUrut: 3 }),
      mitra("B", { nomorUrut: 5, nomorBast: "005/BAST" }),
      mitra("C", { nomorUrut: 1, nomorBast: "001/BAST" }),
    ];
    expect(nama(urutkanSurat(bast, { key: "nomorBast", direction: "asc" }))).toEqual(["C", "B", "A"]);
  });

  it("jangka waktu diurutkan dari tanggal mulai; yang kosong di bawah", () => {
    const jw = [
      mitra("X", { jangkaWaktuMulai: "2026-09-15", jangkaWaktuSelesai: "2026-09-30" }),
      mitra("Y"),
      mitra("Z", { jangkaWaktuMulai: "2026-09-01", jangkaWaktuSelesai: "2026-09-30" }),
    ];
    expect(nama(urutkanSurat(jw, { key: "jangkaWaktu", direction: "asc" }))).toEqual(["Z", "X", "Y"]);
  });

  it("tidak mengubah larik aslinya", () => {
    const salinan = [...data];
    urutkanSurat(data, { key: "nama", direction: "desc" });
    expect(data).toEqual(salinan);
  });

  it("klik kolom yang sama membalik arah, kolom lain mulai dari naik", () => {
    expect(ubahUrutan(URUTAN_SURAT_AWAL, "nomor")).toEqual({ key: "nomor", direction: "desc" });
    expect(ubahUrutan({ key: "nomor", direction: "desc" }, "nomor")).toEqual({ key: "nomor", direction: "asc" });
    expect(ubahUrutan({ key: "nomor", direction: "desc" }, "nama")).toEqual({ key: "nama", direction: "asc" });
  });
});
