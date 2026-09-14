import { describe, it, expect } from "vitest";
import {
  alokasiIdMitra, cocokkanWilayah, normalkanNamaWilayah, type WilayahRef,
} from "@shared/terapkanImporMitra";
import { nextId } from "./idOtomatis";

/**
 * Penerjemahan wilayah dan pembagian ID saat mengimpor mitra.
 *
 * Dua-duanya jenis kesalahan yang TIDAK menimbulkan galat, hanya data yang
 * keliru: mitra masuk ke desa yang salah, atau dua mitra berebut ID yang sama.
 *
 * Contoh desanya diambil dari data sungguhan: di Kabupaten Bengkulu Selatan ada
 * 158 desa dengan hanya 147 nama berbeda, dan "Sukaraja" memang dipakai dua
 * kecamatan.
 */

const KECAMATAN: WilayahRef[] = [
  { id: 1, nama: "Kota Manna" },
  { id: 2, nama: "Pino Raya" },
];

const DESA: WilayahRef[] = [
  { id: 10, nama: "Sukaraja", kecamatanId: 1 },
  { id: 20, nama: "Sukaraja", kecamatanId: 2 },   // nama kembar, kecamatan beda
  { id: 30, nama: "Padang Sialang", kecamatanId: 1 },
];

describe("normalkanNamaWilayah", () => {
  it("beda penulisan dianggap sama", () => {
    expect(normalkanNamaWilayah("Pasar Baru")).toBe("pasarbaru");
    expect(normalkanNamaWilayah("PASAR  BARU")).toBe("pasarbaru");
    expect(normalkanNamaWilayah("pasar-baru")).toBe("pasarbaru");
  });
});

describe("cocokkanWilayah", () => {
  it("wilayah kosong bukan masalah", () => {
    // kecamatan_id dan desa_id di ppl_master memang boleh kosong.
    expect(cocokkanWilayah(undefined, undefined, KECAMATAN, DESA))
      .toEqual({ kecamatanId: null, desaId: null, masalah: null });
  });

  it("desa dicari DI DALAM kecamatannya", () => {
    expect(cocokkanWilayah("Kota Manna", "Sukaraja", KECAMATAN, DESA))
      .toEqual({ kecamatanId: 1, desaId: 10, masalah: null });
    expect(cocokkanWilayah("Pino Raya", "Sukaraja", KECAMATAN, DESA))
      .toEqual({ kecamatanId: 2, desaId: 20, masalah: null });
  });

  it("nama desa kembar TANPA kecamatan ditolak, bukan ditebak", () => {
    // Inilah kesalahan yang paling mahal: menebak akan memasukkan mitra ke desa
    // yang keliru tanpa galat apa pun.
    const hasil = cocokkanWilayah(undefined, "Sukaraja", KECAMATAN, DESA);
    expect(hasil.masalah).toBe("desa-ambigu");
    expect(hasil.desaId).toBeNull();
    expect(hasil.pesan).toContain("2 desa");
  });

  it("nama desa unik tanpa kecamatan boleh diterima, kecamatannya disimpulkan", () => {
    expect(cocokkanWilayah(undefined, "Padang Sialang", KECAMATAN, DESA))
      .toEqual({ kecamatanId: 1, desaId: 30, masalah: null });
  });

  it("kecamatan tidak dikenali dilaporkan", () => {
    const hasil = cocokkanWilayah("Kecamatan Antah Berantah", "Sukaraja", KECAMATAN, DESA);
    expect(hasil.masalah).toBe("kecamatan-tidak-dikenal");
    expect(hasil.kecamatanId).toBeNull();
  });

  it("desa yang tidak ada di kecamatan itu dilaporkan, bukan diambil dari kecamatan lain", () => {
    const hasil = cocokkanWilayah("Pino Raya", "Padang Sialang", KECAMATAN, DESA);
    expect(hasil.masalah).toBe("desa-tidak-dikenal");
    expect(hasil.desaId).toBeNull();
    // Kecamatannya sendiri dikenali, jadi tetap dikembalikan.
    expect(hasil.kecamatanId).toBe(2);
  });

  it("kecamatan saja tanpa desa boleh", () => {
    expect(cocokkanWilayah("Kota Manna", undefined, KECAMATAN, DESA))
      .toEqual({ kecamatanId: 1, desaId: null, masalah: null });
  });
});

describe("alokasiIdMitra", () => {
  it("mengisi lubang lebih dulu, lalu melanjutkan", () => {
    expect(alokasiIdMitra(["PPL001", "PPL003"], 3)).toEqual(["PPL002", "PPL004", "PPL005"]);
  });

  it("tidak pernah mengulang ID di dalam satu rombongan", () => {
    // Inti masalahnya: nextId dipanggil berulang menghasilkan ID yang sama,
    // karena daftar masukannya tidak ikut bertambah.
    const terpakai = ["PPL001"];
    const berulang = [nextId(terpakai, "PPL"), nextId(terpakai, "PPL"), nextId(terpakai, "PPL")];
    expect(new Set(berulang).size).toBe(1);

    const sekaligus = alokasiIdMitra(terpakai, 3);
    expect(new Set(sekaligus).size).toBe(3);
  });

  it("hasilnya tidak menabrak ID yang sudah ada", () => {
    const terpakai = ["PPL001", "PPL002", "PPL005"];
    const baru = alokasiIdMitra(terpakai, 4);
    for (const id of baru) expect(terpakai).not.toContain(id);
    expect(baru).toEqual(["PPL003", "PPL004", "PPL006", "PPL007"]);
  });

  it("meminta nol ID menghasilkan daftar kosong", () => {
    expect(alokasiIdMitra(["PPL001"], 0)).toEqual([]);
  });

  it("aturan penomorannya sama dengan nextId untuk satu ID", () => {
    const terpakai = ["PPL001", "PPL003", "PPL004"];
    expect(alokasiIdMitra(terpakai, 1)[0]).toBe(nextId(terpakai, "PPL"));
  });

  it("nomor yang melampaui lebar dibiarkan memanjang, tidak dipotong", () => {
    const terpakai = Array.from({ length: 999 }, (_, i) => `PPL${String(i + 1).padStart(3, "0")}`);
    expect(alokasiIdMitra(terpakai, 1)[0]).toBe("PPL1000");
  });
});
