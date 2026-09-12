import { describe, it, expect } from "vitest";
import {
  bandingkanIsiSurat, celahNomor, nomorBolehDipakai, rencanaRapikanNomor,
  type BarisIsiSurat, type SuratBernomor,
} from "@shared/penomoranSurat";

/**
 * Aturan penomoran surat dan perbandingan isinya. Yang dikunci:
 * - surat batal tetap "memegang" nomornya di riwayat, tapi TIDAK menahan
 *   nomor saat dirapikan — lubang bekas surat batal justru yang ingin diisi;
 * - dua surat AKTIF tidak boleh bernomor sama;
 * - perubahan isi dilaporkan per baris, dan surat lama tanpa salinan isi
 *   hanya bisa dibandingkan totalnya.
 */

const surat = (id: number, nomorUrut: number, status: 'aktif' | 'batal' = 'aktif'): SuratBernomor =>
  ({ id, nomorUrut, status });

describe("celahNomor", () => {
  it("menemukan nomor yang tidak dipegang surat mana pun", () => {
    expect(celahNomor([surat(1, 1), surat(2, 2), surat(3, 4), surat(4, 6)])).toEqual([3, 5]);
  });

  it("nomor surat batal bukan lubang — ia tampil sebagai surat batal", () => {
    expect(celahNomor([surat(1, 1), surat(2, 2, 'batal'), surat(3, 3)])).toEqual([]);
  });

  it("tanpa surat, tidak ada lubang", () => {
    expect(celahNomor([])).toEqual([]);
  });
});

describe("rencanaRapikanNomor", () => {
  it("contoh Anda: nomor 3 mundur, 4 mengisi 3, 5 mengisi 4, dan seterusnya", () => {
    const { perubahan } = rencanaRapikanNomor([
      surat(1, 1), surat(2, 2), surat(4, 4), surat(5, 5), surat(6, 6),
    ]);
    expect(perubahan).toEqual([
      { id: 4, lama: 4, baru: 3 },
      { id: 5, lama: 5, baru: 4 },
      { id: 6, lama: 6, baru: 5 },
    ]);
  });

  it("surat batal tidak menahan nomor, tapi bentroknya dilaporkan", () => {
    const hasil = rencanaRapikanNomor([surat(1, 1), surat(3, 3, 'batal'), surat(4, 4)]);
    expect(hasil.perubahan).toEqual([{ id: 4, lama: 4, baru: 2 }]);
    expect(hasil.bentrokDenganBatal).toEqual([]);

    const bentrok = rencanaRapikanNomor([surat(1, 1), surat(2, 2, 'batal'), surat(3, 3)]);
    expect(bentrok.perubahan).toEqual([{ id: 3, lama: 3, baru: 2 }]);
    expect(bentrok.bentrokDenganBatal).toEqual([2]);
  });

  it("nomor yang sudah rapat tidak menghasilkan perubahan", () => {
    expect(rencanaRapikanNomor([surat(1, 1), surat(2, 2)]).perubahan).toEqual([]);
  });

  it("nomor ganda dipecah dengan id, supaya hasilnya selalu sama", () => {
    const { perubahan } = rencanaRapikanNomor([surat(9, 2), surat(3, 2)]);
    expect(perubahan).toEqual([{ id: 3, lama: 2, baru: 1 }]);
  });
});

describe("nomorBolehDipakai", () => {
  const daftar = [surat(1, 1), surat(2, 2), surat(3, 3, 'batal')];
  it("menolak nomor yang dipegang surat aktif lain", () => {
    expect(nomorBolehDipakai(2, daftar)).toBe(false);
  });
  it("mengizinkan nomor surat itu sendiri saat disunting", () => {
    expect(nomorBolehDipakai(2, daftar, 2)).toBe(true);
  });
  it("mengizinkan nomor yang hanya dipegang surat batal", () => {
    expect(nomorBolehDipakai(3, daftar)).toBe(true);
  });
  it("menolak nol, negatif, dan pecahan", () => {
    expect(nomorBolehDipakai(0, daftar)).toBe(false);
    expect(nomorBolehDipakai(-1, daftar)).toBe(false);
    expect(nomorBolehDipakai(1.5, daftar)).toBe(false);
  });
});

describe("bandingkanIsiSurat", () => {
  const baris = (kunci: string, volume: number, harga = 24000, lain: Partial<BarisIsiSurat> = {}): BarisIsiSurat => ({
    kunci, uraianTugas: `Kegiatan ${kunci}`, volume, satuan: 'Dokumen', hargaSatuan: harga,
    nilaiPerjanjian: volume * harga, jangkaWaktuMulai: '2026-09-01', jangkaWaktuSelesai: '2026-09-30', ...lain,
  });

  it("isi yang sama tidak menghasilkan perubahan", () => {
    const isi = [baris('74-listing', 10)];
    expect(bandingkanIsiSurat(isi, 240000, isi)).toEqual([]);
  });

  it("melaporkan muatan dan nilai yang berubah", () => {
    const hasil = bandingkanIsiSurat([baris('74-listing', 10)], 240000, [baris('74-listing', 12)]);
    expect(hasil).toHaveLength(1);
    expect(hasil[0].jenis).toBe('ubah');
    expect(hasil[0].rincian).toContain('Muatan 10 → 12 Dokumen');
    expect(hasil[0].rincian).toContain('Nilai Rp 240.000 → Rp 288.000');
  });

  it("melaporkan kegiatan baru dan kegiatan yang hilang", () => {
    const hasil = bandingkanIsiSurat(
      [baris('74-listing', 10)], 240000,
      [baris('75-listing', 5)],
    );
    expect(hasil.map(h => h.jenis).sort()).toEqual(['baru', 'hilang']);
  });

  it("surat lama tanpa salinan isi hanya dibandingkan totalnya, dan jujur soal itu", () => {
    const hasil = bandingkanIsiSurat(null, 336000, [baris('74-listing', 25, 25000)]);
    expect(hasil).toHaveLength(1);
    expect(hasil[0].jenis).toBe('total');
    expect(hasil[0].rincian[0]).toBe('Saat terbit Rp 336.000, sekarang Rp 625.000.');
    expect(hasil[0].rincian[1]).toMatch(/tidak tersimpan/);
  });

  it("surat lama yang totalnya masih sama dianggap sesuai", () => {
    expect(bandingkanIsiSurat(null, 240000, [baris('74-listing', 10)])).toEqual([]);
  });
});
