import { describe, it, expect } from "vitest";
import {
  FRASA_KONFIRMASI_ATUR_ULANG,
  konfirmasiAturUlangSah,
  ringkasNomorPeriode,
  kalimatRingkasanNomor,
} from "@shared/aturUlangNomor";

describe("konfirmasiAturUlangSah", () => {
  it("menerima frasa yang benar", () => {
    expect(konfirmasiAturUlangSah(FRASA_KONFIRMASI_ATUR_ULANG)).toBe(true);
  });

  // Pengguna sedang mengetik ulang frasa, bukan kata sandi.
  it("toleran terhadap huruf kecil dan spasi berlebih", () => {
    expect(konfirmasiAturUlangSah("atur ulang")).toBe(true);
    expect(konfirmasiAturUlangSah("  Atur   Ulang  ")).toBe(true);
  });

  // Justru inilah gunanya frasa ini ada.
  it("menolak salah ketik dan frasa lain", () => {
    expect(konfirmasiAturUlangSah("aturulang")).toBe(false);
    expect(konfirmasiAturUlangSah("ATUR ULANGG")).toBe(false);
    expect(konfirmasiAturUlangSah("HAPUS")).toBe(false);
    expect(konfirmasiAturUlangSah("")).toBe(false);
  });

  // Endpoint-nya destruktif; permintaan tanpa field ini harus tertolak.
  it("menolak yang bukan string", () => {
    expect(konfirmasiAturUlangSah(undefined)).toBe(false);
    expect(konfirmasiAturUlangSah(null)).toBe(false);
    expect(konfirmasiAturUlangSah(true)).toBe(false);
    expect(konfirmasiAturUlangSah(1)).toBe(false);
  });
});

describe("ringkasNomorPeriode", () => {
  it("meringkas rentang nomor dan jumlah BAST", () => {
    const r = ringkasNomorPeriode([
      { nomorUrut: 1, nomorBast: "001/BAST/SEPTEMBER/IX/2026" },
      { nomorUrut: 2, nomorBast: null },
      { nomorUrut: 3 },
      { nomorUrut: 4, nomorBast: undefined },
    ]);
    expect(r).toEqual({ jumlah: 4, jumlahBast: 1, nomorTerkecil: 1, nomorTerbesar: 4 });
  });

  // Mitra yang belum digenerate ikut tampil di daftar layar.
  it("mengabaikan mitra yang belum punya nomor", () => {
    const r = ringkasNomorPeriode([{ nomorUrut: 7 }, {}, { nomorUrut: null }]);
    expect(r.jumlah).toBe(1);
    expect(r.nomorTerkecil).toBe(7);
  });

  it("menangani daftar kosong", () => {
    expect(ringkasNomorPeriode([])).toEqual({
      jumlah: 0, jumlahBast: 0, nomorTerkecil: null, nomorTerbesar: null,
    });
  });
});

describe("kalimatRingkasanNomor", () => {
  it("menyebut jumlah dan rentang bernol depan", () => {
    const kalimat = kalimatRingkasanNomor(ringkasNomorPeriode([{ nomorUrut: 1 }, { nomorUrut: 4 }]));
    expect(kalimat).toContain("2 nomor");
    expect(kalimat).toContain("001–004");
  });

  it("tidak menulis rentang bila nomornya hanya satu", () => {
    const kalimat = kalimatRingkasanNomor(ringkasNomorPeriode([{ nomorUrut: 7 }]));
    expect(kalimat).toContain("(007)");
    expect(kalimat).not.toContain("–");
  });

  // BAST menumpang baris kontrak_mitra yang sama, jadi ia ikut terhapus —
  // pengguna harus diberi tahu sebelum menekan tombolnya.
  it("memperingatkan bahwa nomor BAST ikut hilang", () => {
    const kalimat = kalimatRingkasanNomor(
      ringkasNomorPeriode([{ nomorUrut: 1, nomorBast: "001/BAST/IX/2026" }]),
    );
    expect(kalimat).toContain("BAST");
    expect(kalimat.toLowerCase()).toContain("ikut hilang");
  });

  it("tidak menyebut BAST bila memang belum ada", () => {
    expect(kalimatRingkasanNomor(ringkasNomorPeriode([{ nomorUrut: 1 }]))).not.toContain("BAST");
  });

  it("mengatakan apa adanya bila belum ada nomor sama sekali", () => {
    expect(kalimatRingkasanNomor(ringkasNomorPeriode([]))).toContain("Belum ada nomor");
  });
});
