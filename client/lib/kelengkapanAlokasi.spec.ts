import { describe, it, expect } from "vitest";
import { periksaKelengkapanAlokasi, teksPeringatan, type AlokasiDiperiksa, type PengaturanTahapDiperiksa } from "./kelengkapanAlokasi";

/**
 * Peringatan sebelum menyimpan kegiatan. Yang dikunci:
 * - hanya tahap yang PUNYA alokasi yang diperiksa;
 * - nama mitra disebut, supaya pengguna tahu siapa yang perlu dilengkapi;
 * - pengaturan honor kosong dilaporkan per bagian yang kosong.
 */

const lengkap: PengaturanTahapDiperiksa = {
  tahap: 'listing', satuanBebanKerja: 'Dokumen', hargaSatuan: 24000, adaRentang: true,
};
const mitra = (nama: string, lain: Partial<AlokasiDiperiksa> = {}): AlokasiDiperiksa => ({
  tahap: 'listing', nama, adaMitra: true, bebanKerja: 10, adaPml: true, ...lain,
});

describe("periksaKelengkapanAlokasi", () => {
  it("alokasi dan pengaturan yang lengkap tidak menghasilkan peringatan", () => {
    expect(periksaKelengkapanAlokasi([mitra('A'), mitra('B')], [lengkap])).toEqual([]);
  });

  it("tanpa alokasi, pengaturan honor kosong pun tidak diperingatkan", () => {
    expect(periksaKelengkapanAlokasi([], [])).toEqual([]);
  });

  it("menyebut nama mitra yang beban kerjanya 0 dan yang belum punya PML", () => {
    const hasil = periksaKelengkapanAlokasi(
      [mitra('A', { bebanKerja: 0 }), mitra('B', { bebanKerja: 0, adaPml: false }), mitra('C', { adaPml: false })],
      [lengkap],
    );
    expect(hasil).toHaveLength(1);
    expect(hasil[0].judul).toBe('Tahap Listing');
    expect(hasil[0].rincian).toContain('Beban kerja masih 0: A, B.');
    expect(hasil[0].rincian).toContain('Belum punya PML: B, C.');
  });

  it("melaporkan setiap bagian pengaturan honor yang kosong", () => {
    const hasil = periksaKelengkapanAlokasi(
      [mitra('A')],
      [{ tahap: 'listing', satuanBebanKerja: '', hargaSatuan: 0, adaRentang: false }],
    );
    expect(hasil[0].rincian).toContain(
      'Pengaturan honor belum diisi: satuan beban kerja, harga per satuan, rentang tanggal honor.');
  });

  it("alokasi tanpa mitra dihitung terpisah dan tidak dicampur daftar nama", () => {
    const hasil = periksaKelengkapanAlokasi(
      [mitra('', { adaMitra: false, bebanKerja: 0, adaPml: false })],
      [lengkap],
    );
    expect(hasil[0].rincian).toEqual(['1 alokasi belum memilih mitra — alokasi ini tidak akan ikut tersimpan.']);
  });

  it("teksPeringatan menyusun judul dan butir dengan ganti baris sungguhan", () => {
    const teks = teksPeringatan([
      { judul: 'Tahap Listing', rincian: ['Beban kerja masih 0: A.', 'Belum punya PML: B.'] },
      { judul: 'Tahap Pencacahan', rincian: ['Beban kerja masih 0: C.'] },
    ]);
    expect(teks).toBe(
      'Tahap Listing:\n• Beban kerja masih 0: A.\n• Belum punya PML: B.'
      + '\n\nTahap Pencacahan:\n• Beban kerja masih 0: C.');
  });

  it("teksPeringatan pada daftar kosong menghasilkan teks kosong", () => {
    expect(teksPeringatan([])).toBe('');
  });

  it("memeriksa tiap tahap sendiri-sendiri", () => {
    const hasil = periksaKelengkapanAlokasi(
      [mitra('A'), mitra('P', { tahap: 'pengolahan-analisis', adaPml: false })],
      [lengkap, { ...lengkap, tahap: 'pengolahan-analisis' }],
    );
    expect(hasil.map(h => h.judul)).toEqual(['Tahap Pengolahan']);
  });
});
