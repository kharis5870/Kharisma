import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { bacaSumberLayanan } from "./__uji__/bacaSumberLayanan";

/**
 * Nomor surat tidak boleh terbit ganda saat dua tim keuangan bekerja bersamaan.
 *
 * Sebelum perbaikan, dua Generate yang ditekan bersamaan membaca nomor tertinggi
 * yang sama dan menerbitkan nomor yang sama — 15 nomor ganda dalam 5 percobaan.
 * Yang dikunci di sini: setiap jalur yang MENULIS nomor memegang kunci per
 * tahun, kuncinya selalu dilepas, dan database punya indeks unik sebagai lapis
 * kedua. Juga bahwa isi surat dihitung server, bukan dipercaya dari layar.
 *
 * Repo ini tidak menguji database, jadi yang diperiksa adalah teks sumbernya
 * setelah komentar dibuang.
 */

const tanpaKomentar = (teks: string): string =>
  teks.replace(/\/\*[\s\S]*?\*\//g, "").split("\n").filter(b => !b.trim().startsWith("//")).join("\n");

const kontrak = tanpaKomentar(bacaSumberLayanan("kontrakService.ts"));

const badanFungsi = (sumber: string, nama: string): string => {
  const mulai = sumber.indexOf(`export const ${nama}`);
  expect(mulai, `fungsi ${nama} tidak ditemukan`).toBeGreaterThan(-1);
  const sesudah = sumber.slice(mulai);
  const akhir = sesudah.indexOf("\n};");
  return akhir === -1 ? sesudah : sesudah.slice(0, akhir);
};

describe("penomoran surat memegang kunci per tahun", () => {
  it.each(["pesanNomorKontrak", "ubahNomorSurat", "rapikanNomorTahun"])(
    "%s menulis nomor di dalam denganKunciNomorTahun", (nama) => {
      expect(badanFungsi(kontrak, nama)).toContain("denganKunciNomorTahun(");
    });

  it("kunci bernama diberi awalan nama database dan selalu dilepas", () => {
    // Kunci bernama berlaku untuk seluruh server MySQL (dipakai bersama akun
    // cPanel lain) dan melekat pada koneksi yang kembali ke pool.
    const helper = badanFungsi(kontrak, "denganKunciNomorTahun");
    expect(helper).toMatch(/GET_LOCK\(CONCAT\(DATABASE\(\)/);
    expect(helper).toMatch(/finally\s*\{[\s\S]*RELEASE_LOCK/);
  });

  it("database menolak nomor aktif ganda dalam satu tahun", () => {
    const sql = readFileSync(new URL("../../db/migrations/2026-09-24-kunci-nomor-dan-versi.sql", import.meta.url), "utf-8");
    expect(sql).toContain("UNIQUE KEY uq_kontrak_nomor_aktif (kunci_nomor)");
    expect(sql).toMatch(/IF\(status = 'aktif', CONCAT\(YEAR\(tanggal_surat\), '\|', nomor_urut\), NULL\)/);
  });
});

describe("isi surat dihitung server", () => {
  it("total dan lampiran diambil dari getDataKontrak, bukan dari permintaan", () => {
    const badan = badanFungsi(kontrak, "pesanNomorKontrak");
    expect(badan).toContain("getDataKontrak(periodeMulai, periodeSelesai)");
    expect(badan).toContain("sekarang.totalHonor");
    expect(badan).not.toMatch(/mitra\.totalHonor|mitra\.baris/);
  });
});
