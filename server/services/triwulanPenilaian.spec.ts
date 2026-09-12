import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

/**
 * Mengunci cara Penilaian Mitra menentukan triwulan sebuah alokasi PPL.
 *
 * ATURANNYA: triwulan diambil dari bulan PERTAMA honor alokasi itu dibebankan
 * (`ppl_honor_bulan`), dengan kolom `bulanHonor*` milik tahap hanya sebagai
 * cadangan.
 *
 * KENAPA INI PERNAH RUSAK: dulu triwulan ditentukan dari `bulanHonor*` SAJA.
 * Sejak bulan pembebanan dipilih per alokasi, kolom tahap itu sengaja dibiarkan
 * kosong untuk periode honor lintas bulan — dan `BETWEEN` atas NULL bernilai
 * NULL. Mitranya hilang dari daftar penilaian tanpa pesan apa pun, dan tidak
 * pernah bisa dinilai. Rekap triwulannya ikut kekurangan satu kegiatan.
 *
 * SATU triwulan per alokasi: `penilaian_mitra` punya kunci unik
 * (pplId, kegiatanId), jadi satu alokasi hanya dinilai sekali. Memunculkannya
 * di setiap triwulan yang disentuh honornya akan membuat nilai yang sama
 * terhitung dua kali di rekap.
 *
 * Repo ini tidak menguji database, jadi yang diperiksa adalah teks sumbernya
 * setelah komentar dibuang — komentar di berkas sumber justru menyebut
 * `bulanHonor*`, jadi ia tidak boleh ikut jadi bukti.
 */

const sumber = (() => {
  const isi = readFileSync(
    fileURLToPath(new URL("penilaianService.ts", import.meta.url)), "utf8");
  return isi
    .replace(/\/\*[\s\S]*?\*\//g, "")   // komentar blok
    .replace(/^\s*\/\/.*$/gm, "")       // komentar baris
    .replace(/^\s*--.*$/gm, "");        // komentar di dalam SQL
})();

describe("triwulan penilaian", () => {
  it("bulan acuan diambil dari ppl_honor_bulan lebih dulu", () => {
    const fragmen = sumber.slice(
      sumber.indexOf("const BULAN_ACUAN_PENILAIAN"),
      sumber.indexOf("const FILTER_TRIWULAN"));
    expect(fragmen).toContain("FROM ppl_honor_bulan");
    // Cadangan ke kolom lama tetap ada untuk data tanpa baris pembebanan.
    expect(fragmen).toContain("k.bulanHonorListing");
    // Sumber utama harus disebut SEBELUM cadangannya di dalam COALESCE.
    expect(fragmen.indexOf("ppl_honor_bulan")).toBeLessThan(fragmen.indexOf("k.bulanHonorListing"));
  });

  it("kunci 'MM-YYYY' diubah jadi tanggal sebelum diambil MIN-nya", () => {
    // Sebagai teks, '12-2025' dianggap lebih besar dari '01-2026', sehingga
    // MIN atas teks memilih bulan yang salah di pergantian tahun.
    expect(sumber).toMatch(/MIN\(STR_TO_DATE\(CONCAT\('01-', b\.bulan\)/);
    expect(sumber).not.toMatch(/MIN\(b\.bulan\)/);
  });

  it("daftar penilaian dan rekap memakai filter triwulan yang SAMA", () => {
    // Kalau keduanya menyimpang, seorang mitra bisa muncul di daftar untuk
    // dinilai tapi tidak ikut terhitung di rekap triwulan yang sama.
    const pemakaian = sumber.match(/\$\{FILTER_TRIWULAN\}|push\(FILTER_TRIWULAN\)/g) ?? [];
    expect(pemakaian).toHaveLength(2);
  });

  it("tidak ada lagi filter triwulan yang bersandar pada bulanHonor* saja", () => {
    // Pola lama: SUBSTRING_INDEX atas CASE kolom bulanHonor, dibandingkan
    // langsung dengan tahun/bulan. Satu-satunya kemunculan kolom lama yang sah
    // adalah cadangan di dalam BULAN_ACUAN_PENILAIAN.
    expect(sumber).not.toMatch(/SUBSTRING_INDEX\(\s*CASE/);
    expect(sumber.match(/k\.bulanHonorListing/g) ?? []).toHaveLength(1);
  });
});
