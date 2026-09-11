import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

/**
 * Mengunci perilaku kegiatan yang diarsipkan.
 *
 * ATURANNYA, dan alasannya:
 *
 * Mengarsipkan kegiatan HANYA menyembunyikannya dari daftar Dashboard dan dari
 * notifikasi. Data honor dan penilaian mitranya TETAP tampil di Manajemen
 * Honor, Penilaian Mitra, dan Rekap Penilaian — honor yang sudah terjadi tetap
 * harus dibayar dan direkap untuk SPJ, dan penilaian triwulanan tetap harus
 * lengkap meski kegiatannya sudah selesai lalu diarsipkan. Data itu baru
 * benar-benar hilang bila kegiatannya DIHAPUS, lewat CASCADE dari
 * `fk_penilaian_kegiatan` dan `honorarium_kegiatan`.
 *
 * Arsip dan hapus memang dua hal berbeda: `setArsipKegiatan` hanya menulis
 * kolom `isArsip` dan bisa dibatalkan, sedangkan `deleteKegiatan` menghapus
 * barisnya sungguhan.
 *
 * Tes ini ada karena menambahkan `AND k.isArsip = 0` ke kueri honor atau
 * penilaian terasa masuk akal sekilas — dan akibatnya tidak akan terlihat
 * sampai seseorang mengarsipkan kegiatan lalu honor mitranya lenyap dari
 * rekap SPJ. Kalau tes ini merah, baca dulu paragraf di atas.
 *
 * Repo ini tidak menguji database, jadi yang diperiksa adalah teks sumbernya
 * setelah komentar dibuang.
 */

const baca = (namaBerkas: string): string => {
  const isi = readFileSync(fileURLToPath(new URL(namaBerkas, import.meta.url)), "utf8");
  return isi
    .replace(/\/\*[\s\S]*?\*\//g, "")   // komentar blok
    .replace(/^\s*\/\/.*$/gm, "")       // komentar baris
    .replace(/^\s*--.*$/gm, "");        // komentar di dalam SQL
};

describe("kegiatan arsip tidak menyembunyikan honor & penilaian", () => {
  it.each([
    ["honorService.ts", "Manajemen Honor"],
    ["penilaianService.ts", "Penilaian Mitra & Rekap Penilaian"],
    ["kontrakService.ts", "Surat PK & BAST"],
  ])("%s tidak menyaring isArsip (%s)", (berkas) => {
    expect(baca(berkas)).not.toContain("isArsip");
  });

  /**
   * Penjaga anti-hampa. Tanpa ini, regex yang kelak rusak akan membuat seluruh
   * tes di atas hijau palsu — tidak menemukan apa pun di mana pun. Notifikasi
   * MEMANG menyaring arsip, jadi berkas ini harus tetap memuat kata itu.
   */
  it("notifikasiService.ts tetap menyaring isArsip", () => {
    expect(baca("notifikasiService.ts")).toContain("isArsip");
  });
});
