import { describe, it, expect } from "vitest";
import {
  validasiPerpindahanProgress,
  sudahSelesai,
  statusPengawasanPML,
  hapusGalatPpl,
  kunciGalat,
} from "./progressMitra";

const pplPendataan = (progress: Record<string, number>, beban = '10') => ({
  tahap: 'pencacahan' as const,
  bebanKerja: beban,
  progress,
});

describe("validasiPerpindahanProgress", () => {
  // Kasus persis yang dilaporkan: submit diisi 3 padahal open hanya 2.
  it("menolak saat tahap sebelumnya tidak mencukupi, dengan pesan yang menyebut sisanya", () => {
    const hasil = validasiPerpindahanProgress(
      pplPendataan({ open: 2, submit: 8, diperiksa: 0, approved: 0 }),
      'submit',
      11,
    );
    expect(hasil.ok).toBe(false);
    expect(hasil.pesan).toContain('Hanya tersedia 2');
    expect(hasil.pesan).toContain('Open');
  });

  it("menerima perpindahan yang valid dan mengurangi tahap sebelumnya", () => {
    const hasil = validasiPerpindahanProgress(
      pplPendataan({ open: 5, submit: 5, diperiksa: 0, approved: 0 }),
      'submit',
      7,
    );
    expect(hasil.ok).toBe(true);
    expect(hasil.progressBaru).toEqual({ open: 3, submit: 7, diperiksa: 0, approved: 0 });
  });

  // Skenario yang dilaporkan: alokasi baru (semua masih di Open), lalu Submit
  // dinaikkan. Open WAJIB berkurang sebanyak itu — total tetap sama dengan
  // beban kerja, bukan bertambah.
  it("menaikkan submit dari alokasi baru mengurangi open sebanyak itu", () => {
    const hasil = validasiPerpindahanProgress(
      pplPendataan({ open: 10, submit: 0, diperiksa: 0, approved: 0 }),
      'submit',
      3,
    );
    expect(hasil.ok).toBe(true);
    expect(hasil.progressBaru?.open).toBe(7);
    expect(hasil.progressBaru?.submit).toBe(3);
  });

  it("menurunkan submit mengembalikan sisanya ke open", () => {
    const hasil = validasiPerpindahanProgress(
      pplPendataan({ open: 7, submit: 3, diperiksa: 0, approved: 0 }),
      'submit',
      1,
    );
    expect(hasil.ok).toBe(true);
    expect(hasil.progressBaru).toEqual({ open: 9, submit: 1, diperiksa: 0, approved: 0 });
  });

  it("total progress selalu sama dengan beban kerja setelah perpindahan", () => {
    const beban = 10;
    let progress: Record<string, number> = { open: beban, submit: 0, diperiksa: 0, approved: 0 };

    // Alirkan 4 dokumen melewati seluruh rantai tahap.
    for (const [field, nilai] of [['submit', 4], ['diperiksa', 4], ['approved', 4]] as const) {
      const hasil = validasiPerpindahanProgress(
        { tahap: 'pencacahan', bebanKerja: String(beban), progress },
        field,
        nilai,
      );
      expect(hasil.ok).toBe(true);
      progress = hasil.progressBaru as Record<string, number>;
      const total = ['open', 'submit', 'diperiksa', 'approved'].reduce((a, k) => a + (progress[k] ?? 0), 0);
      expect(total).toBe(beban);
    }

    expect(progress).toEqual({ open: 6, submit: 0, diperiksa: 0, approved: 4 });
  });

  it("menolak perubahan pada tahap pertama yang dihitung otomatis", () => {
    const hasil = validasiPerpindahanProgress(
      pplPendataan({ open: 5, submit: 5 }),
      'open' as any,
      3,
    );
    expect(hasil.ok).toBe(false);
    expect(hasil.pesan).toContain('dihitung otomatis');
  });

  it("menolak angka negatif", () => {
    const hasil = validasiPerpindahanProgress(pplPendataan({ open: 10 }), 'submit', -1);
    expect(hasil.ok).toBe(false);
  });

  it("memakai urutan tahap pengolahan untuk tahap pengolahan-analisis", () => {
    const hasil = validasiPerpindahanProgress(
      { tahap: 'pengolahan-analisis', bebanKerja: '10', progress: { belum_entry: 4, sudah_entry: 6 } },
      'sudah_entry',
      9,
    );
    expect(hasil.ok).toBe(true);
    expect(hasil.progressBaru).toMatchObject({ belum_entry: 1, sudah_entry: 9 });
  });
});

describe("hapusGalatPpl", () => {
  // Skenario yang dilaporkan: 'submit' pernah ditolak sehingga bertanda merah.
  // Lalu 'diperiksa' diturunkan — yang otomatis MENAMBAH 'submit' — dan
  // peringatan lama di 'submit' tetap menempel. Membersihkan hanya kotak yang
  // disunting tidak cukup, karena satu perubahan menyentuh dua tahap.
  it("membuang galat di kotak tetangga, bukan hanya kotak yang disunting", () => {
    const galat = {
      [kunciGalat(5, 'submit')]: 'Hanya tersedia 2 di tahap Open.',
      [kunciGalat(5, 'diperiksa')]: 'Angka tidak valid.',
    };
    expect(hapusGalatPpl(galat, 5)).toEqual({});
  });

  it("tidak menyentuh galat milik PPL lain", () => {
    const galat = {
      [kunciGalat(5, 'submit')]: 'galat A',
      [kunciGalat(6, 'submit')]: 'galat B',
    };
    expect(hapusGalatPpl(galat, 5)).toEqual({ [kunciGalat(6, 'submit')]: 'galat B' });
  });

  // Tanpa tanda titik dua, id 1 akan ikut menghapus milik id 11 dan 12.
  it("tidak tertukar antara id yang berawalan sama", () => {
    const galat = {
      [kunciGalat(1, 'submit')]: 'milik 1',
      [kunciGalat(11, 'submit')]: 'milik 11',
      [kunciGalat(12, 'approved')]: 'milik 12',
    };
    expect(hapusGalatPpl(galat, 1)).toEqual({
      [kunciGalat(11, 'submit')]: 'milik 11',
      [kunciGalat(12, 'approved')]: 'milik 12',
    });
  });

  it("mengembalikan objek yang sama persis bila tidak ada yang dihapus", () => {
    // Menjaga identitas objek supaya React tidak render ulang sia-sia.
    const galat = { [kunciGalat(9, 'submit')]: 'galat' };
    expect(hapusGalatPpl(galat, 5)).toBe(galat);
    expect(hapusGalatPpl({}, 5)).toEqual({});
  });
});

describe("sudahSelesai", () => {
  it("pendataan selesai bila approved mencapai beban kerja", () => {
    expect(sudahSelesai(pplPendataan({ approved: 10 }))).toBe(true);
    expect(sudahSelesai(pplPendataan({ approved: 9 }))).toBe(false);
  });

  it("pengolahan selesai bila clean mencapai beban kerja", () => {
    expect(sudahSelesai({ tahap: 'pengolahan-analisis', bebanKerja: '5', progress: { clean: 5 } })).toBe(true);
  });

  it("beban kerja nol tidak dianggap selesai", () => {
    expect(sudahSelesai(pplPendataan({ approved: 0 }, '0'))).toBe(false);
  });
});

describe("statusPengawasanPML", () => {
  const tenggat = { pencacahan: '2026-01-31' };
  const sebelumTenggat = new Date(2026, 0, 20);
  const setelahTenggat = new Date(2026, 1, 5);

  it("tanpa titik bila tidak mengawasi mitra di kegiatan ini", () => {
    const ppl = [{ ...pplPendataan({ approved: 0 }), pml_id: 'U9' }];
    expect(statusPengawasanPML(ppl, 'U1', tenggat, sebelumTenggat)).toBe('tidak-mengawasi');
  });

  it("hijau bila semua mitra yang diawasi sudah selesai", () => {
    const ppl = [{ ...pplPendataan({ approved: 10 }), pml_id: 'U1' }];
    expect(statusPengawasanPML(ppl, 'U1', tenggat, sebelumTenggat)).toBe('selesai');
  });

  it("kuning bila ada yang belum selesai tapi tenggat belum lewat", () => {
    const ppl = [{ ...pplPendataan({ approved: 3 }), pml_id: 'U1' }];
    expect(statusPengawasanPML(ppl, 'U1', tenggat, sebelumTenggat)).toBe('berjalan');
  });

  it("merah bila ada yang belum selesai dan tenggat sudah lewat", () => {
    const ppl = [{ ...pplPendataan({ approved: 3 }), pml_id: 'U1' }];
    expect(statusPengawasanPML(ppl, 'U1', tenggat, setelahTenggat)).toBe('terlambat');
  });

  it("mengabaikan mitra milik PML lain saat menilai", () => {
    const ppl = [
      { ...pplPendataan({ approved: 10 }), pml_id: 'U1' },
      { ...pplPendataan({ approved: 0 }), pml_id: 'U2' }, // milik orang lain
    ];
    expect(statusPengawasanPML(ppl, 'U1', tenggat, setelahTenggat)).toBe('selesai');
  });

  it("tanpa tenggat tidak pernah dianggap terlambat", () => {
    const ppl = [{ ...pplPendataan({ approved: 3 }), pml_id: 'U1' }];
    expect(statusPengawasanPML(ppl, 'U1', {}, setelahTenggat)).toBe('berjalan');
  });
});
