import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

/**
 * Generate Surat harus memilih BULAN, bukan rentang tanggal bebas.
 *
 * Ini mengunci perbaikan atas keluhan nyata: dengan pemilih rentang bebas,
 * setiap pergeseran rentang dianggap periode baru sehingga nomor surat baru
 * dipesan. PPL117 sampai memegang tiga nomor (001 untuk 1-30 September, 005
 * untuk 1 September-16 Oktober, 007 untuk 1 Agustus-31 Oktober) atas pekerjaan
 * yang sama, dan nomor 005 "hilang" dari tampilan September.
 *
 * Kuncinya ada di dua sisi dan keduanya diperiksa di sini:
 *  - layar hanya boleh menghasilkan periode berupa satu bulan kalender penuh;
 *  - isian "Mulai dari Nomor" tidak boleh kembali, karena nomor yang sudah
 *    dipesan bersifat permanen sehingga isian itu tidak pernah berlaku bagi
 *    mitra yang sudah bernomor — penyesuaian nomor dilakukan per surat di
 *    halaman Riwayat Penyuratan.
 *
 * Repo ini tidak merender komponen dalam pengujian, jadi yang diperiksa adalah
 * teks sumbernya setelah komentar dibuang — supaya penjelasan seperti paragraf
 * di atas tidak ikut terhitung sebagai bukti.
 */

const baca = (berkas: string): string => {
  const mentah = readFileSync(new URL(berkas, import.meta.url), "utf-8");
  return mentah
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, "")
    .split("\n")
    .filter(baris => !baris.trim().startsWith("//"))
    .join("\n");
};

const generate = baca("./GenerateKontrak.tsx");

describe("Generate Surat memakai periode per bulan", () => {
  it("memakai pemilih bulan", () => {
    expect(generate).toContain("MonthPicker");
    expect(generate).toContain("rentangDariBulan");
  });

  it("tidak lagi merender pemilih rentang tanggal bebas", () => {
    // Tipe RentangTanggal masih boleh diimpor: periodenya tetap berbentuk
    // pasangan tanggal, hanya cara memilihnya yang berubah.
    expect(generate).not.toMatch(/<DateRangePicker/);
  });

  it("isian Mulai dari Nomor sudah tidak ada", () => {
    expect(generate).not.toContain("nomorMulai");
    expect(generate).not.toContain("Mulai dari Nomor");
  });

  it("masih memberi tahu nomor tertinggi yang sudah terpakai tahun ini", () => {
    // Angka ini datang dari server (MAX seluruh tahun), bukan dihitung dari
    // periode yang sedang tampil. Tanpa ini pengguna kehilangan satu-satunya
    // petunjuk nomor berapa yang akan terbit.
    expect(generate).toContain("maksTerpakaiTahun");
  });
});
