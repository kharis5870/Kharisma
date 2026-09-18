import { describe, it, expect, vi } from "vitest";
import { tangani, galatUntukKlien, bacaPeriodeOpsional } from "./utilRoute";

/**
 * Perkakas route bersama.
 *
 * Yang paling penting dikunci: galat database TIDAK PERNAH sampai ke layar
 * dengan teks aslinya, sementara pesan yang memang ditulis untuk pengguna
 * tetap sampai.
 */

describe("galatUntukKlien", () => {
  it("galat MySQL tidak membocorkan nama database, tabel, atau constraint", () => {
    const galat = Object.assign(
      new Error("Duplicate entry 'USR001' for key 'PRIMARY' in `kharisma_db`.`users`"),
      { code: "ER_DUP_ENTRY", sqlMessage: "Duplicate entry 'USR001' for key 'PRIMARY'" });
    const hasil = galatUntukKlien(galat, "Gagal menyimpan.");
    expect(hasil.status).toBe(400);
    expect(hasil.message).not.toContain("kharisma_db");
    expect(hasil.message).not.toContain("PRIMARY");
    expect(hasil.message).not.toContain("USR001");
  });

  it("galat sistem ber-kode (mis. koneksi DB putus) memakai pesan bawaan", () => {
    const galat = Object.assign(new Error("connect ECONNREFUSED 127.0.0.1:3307"), { code: "ECONNREFUSED" });
    const hasil = galatUntukKlien(galat, "Gagal memuat data.");
    expect(hasil).toEqual({ status: 500, message: "Gagal memuat data." });
  });

  it("galat bertanda statusCode diteruskan apa adanya", () => {
    const galat = Object.assign(new Error("Mitra ini tidak bisa dihapus."), { statusCode: 409 });
    expect(galatUntukKlien(galat, "x")).toEqual({ status: 409, message: "Mitra ini tidak bisa dihapus." });
  });

  it("pesan dari service tanpa kode tetap sampai, seperti sebelumnya", () => {
    expect(galatUntukKlien(new Error("Dokumen tidak ditemukan."), "x"))
      .toEqual({ status: 500, message: "Dokumen tidak ditemukan." });
  });

  it("nilai yang bukan Error pun tidak membuatnya melempar", () => {
    expect(galatUntukKlien(undefined, "Bawaan.")).toEqual({ status: 500, message: "Bawaan." });
  });
});

describe("tangani", () => {
  it("penolakan promise diteruskan ke next, bukan menjadi unhandled rejection", async () => {
    const galat = new Error("boom");
    const next = vi.fn();
    tangani(async () => { throw galat; })({} as any, {} as any, next);
    await new Promise(r => setTimeout(r, 0));
    expect(next).toHaveBeenCalledWith(galat);
  });

  it("handler yang berhasil tidak memanggil next", async () => {
    const next = vi.fn();
    tangani(async () => { /* sukses */ })({} as any, {} as any, next);
    await new Promise(r => setTimeout(r, 0));
    expect(next).not.toHaveBeenCalled();
  });
});

describe("bacaPeriodeOpsional", () => {
  it("periode lengkap dan sah dikembalikan", () => {
    expect(bacaPeriodeOpsional({ tanggalMulai: "2026-09-01", tanggalSelesai: "2026-09-30" }))
      .toEqual({ mulai: "2026-09-01", selesai: "2026-09-30" });
  });

  it("separuh, salah bentuk, atau terbalik dianggap tidak ada", () => {
    expect(bacaPeriodeOpsional({ tanggalMulai: "2026-09-01" })).toBeUndefined();
    expect(bacaPeriodeOpsional({ tanggalMulai: "1/9/2026", tanggalSelesai: "2026-09-30" })).toBeUndefined();
    expect(bacaPeriodeOpsional({ tanggalMulai: "2026-09-30", tanggalSelesai: "2026-09-01" })).toBeUndefined();
  });
});
