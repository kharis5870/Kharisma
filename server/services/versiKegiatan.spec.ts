import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { bacaSumberLayanan } from "./__uji__/bacaSumberLayanan";

/**
 * Dua orang yang menyunting kegiatan yang sama tidak boleh saling menimpa tanpa tahu.
 *
 * Sebelumnya simpanan kedua menimpa simpanan pertama begitu saja: mitra yang
 * baru ditambahkan orang lain hilang tanpa pesan. Sekarang setiap simpan dari
 * Edit Kegiatan mensyaratkan versi yang sama dengan saat halaman dibuka.
 */

const tanpaKomentar = (teks: string): string =>
  teks.replace(/\/\*[\s\S]*?\*\//g, "").split("\n").filter(b => !b.trim().startsWith("//")).join("\n");

const kegiatan = tanpaKomentar(bacaSumberLayanan("kegiatanService.ts"));

const badanFungsi = (sumber: string, nama: string): string => {
  const mulai = sumber.indexOf(`export const ${nama}`);
  expect(mulai, `fungsi ${nama} tidak ditemukan`).toBeGreaterThan(-1);
  const sesudah = sumber.slice(mulai);
  const akhir = sesudah.indexOf("\n};");
  return akhir === -1 ? sesudah : sesudah.slice(0, akhir);
};

describe("simpan Edit Kegiatan memeriksa versi", () => {
  const badan = badanFungsi(kegiatan, "updateKegiatan");

  it("menaikkan versi dan mensyaratkan versi yang dikirim layar", () => {
    expect(badan).toContain("versi = versi + 1");
    expect(badan).toContain("AND versi = ?");
  });

  it("menolak dengan 409 bertanda KEGIATAN_BERUBAH bila tidak ada baris yang berubah", () => {
    expect(badan).toMatch(/hasilUbah\.affectedRows === 0/);
    expect(badan).toContain("KEGIATAN_BERUBAH");
    expect(badan).toContain("statusCode: 409");
  });

  it("pemanggil yang tidak mengirim versi tetap diterima", () => {
    expect(badan).toMatch(/versiKlien !== null \? ' AND versi = \?' : ''/);
  });
});

describe("layar dan skema mendukung versi", () => {
  it("Edit Kegiatan menampilkan pesan khusus untuk KEGIATAN_BERUBAH", () => {
    const layar = readFileSync(new URL("../../client/pages/EditActivity.tsx", import.meta.url), "utf-8");
    expect(layar).toContain("'KEGIATAN_BERUBAH'");
  });

  it("migrasi menambah kolom kegiatan.versi", () => {
    const sql = readFileSync(new URL("../../db/migrations/2026-09-24-kunci-nomor-dan-versi.sql", import.meta.url), "utf-8");
    expect(sql).toContain("ADD COLUMN versi INT UNSIGNED NOT NULL DEFAULT 0");
  });
});
