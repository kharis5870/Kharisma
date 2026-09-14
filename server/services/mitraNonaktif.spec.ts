import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

/**
 * Mitra yang berhenti DINONAKTIFKAN, tidak dihapus — dan penyaring `aktif`
 * hanya boleh dipasang di SATU tempat.
 *
 * Menghapus mitra berbahaya secara senyap: `kontrak_mitra.ppl_master_id` adalah
 * ON DELETE CASCADE, sehingga surat perjanjian yang sudah ditandatangani ikut
 * hilang, dan `ppl.ppl_master_id` adalah ON DELETE SET NULL, sehingga alokasi
 * kegiatannya menjadi yatim. Keduanya tanpa satu pun pesan galat.
 *
 * Pembagian penyaringnya sengaja TIDAK seragam, dan ketidakseragaman itulah
 * yang perlu dijaga:
 *
 *   getAllMasterPPL   MENYARING  - mengisi pemilih mitra saat alokasi BARU
 *                                  dibuat; mantan mitra tidak boleh diberi
 *                                  pekerjaan lagi.
 *   getPplAdminData   TIDAK      - Daftar PPL harus tetap memuat mereka,
 *                                  dengan penanda, bukan menghilangkannya.
 *   honor / kontrak / penilaian  - menunjuk `ppl.ppl_master_id`, yaitu
 *                                  pekerjaan yang SUDAH terjadi; menyaringnya
 *                                  akan menghapus sejarah dari layar dan
 *                                  membuat honor yang terutang tak terlihat.
 *
 * Orang berikutnya yang melihat ini akan tergoda "merapikannya" menjadi
 * seragam. Ke arah mana pun ia merapikan, akibatnya sunyi.
 */

const baca = (berkas: string): string =>
  readFileSync(new URL(berkas, import.meta.url), "utf-8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .filter(baris => !baris.trim().startsWith("//"))
    .join("\n");

const ppl = baca("./pplService.ts");
const honor = baca("./honorService.ts");
const kontrak = baca("./kontrakService.ts");
const penilaian = baca("./penilaianService.ts");
const impor = baca("./imporMitraService.ts");

/** Isi sebuah fungsi yang diekspor, dari namanya sampai penutupnya. */
const badanFungsi = (sumber: string, nama: string): string => {
  const mulai = sumber.indexOf(`export const ${nama}`);
  expect(mulai, `fungsi ${nama} tidak ditemukan`).toBeGreaterThan(-1);
  const sesudah = sumber.slice(mulai);
  const akhir = sesudah.indexOf("\n};");
  return akhir === -1 ? sesudah : sesudah.slice(0, akhir);
};

describe("penyaring mitra aktif", () => {
  it("pemilih mitra hanya menawarkan yang masih aktif", () => {
    expect(badanFungsi(ppl, "getAllMasterPPL")).toContain("aktif = 1");
  });

  it("Daftar PPL TIDAK menyaring, supaya mantan mitra tetap terlihat", () => {
    const badan = badanFungsi(ppl, "getPplAdminData");
    expect(badan).not.toContain("aktif = 1");
    // Statusnya tetap dikirim supaya layar bisa menandainya.
    expect(badan).toContain("pm.aktif");
  });

  it("honor, kontrak, dan penilaian tidak menyaring status mitra", () => {
    // Pekerjaan yang sudah terjadi tetap harus terbaca dan terbayar.
    //
    // Yang dilarang adalah penyaring kolom `aktif` MILIK MITRA. Versi pertama
    // tes ini hanya mencari substring "aktif = 1" dan langsung merah: ternyata
    // kontrakService memuat `WHERE is_aktif = 1`, yaitu penanda template surat
    // yang sedang dipakai — kolom tabel lain yang kebetulan namanya berakhiran
    // sama. Karena itu kolom tak terkait disingkirkan dulu sebelum diperiksa.
    for (const sumber of [honor, kontrak, penilaian]) {
      const tanpaKolomLain = sumber.replace(/is_aktif/g, "");
      expect(tanpaKolomLain).not.toMatch(/\baktif\s*=\s*1\b/);
      expect(tanpaKolomLain).not.toMatch(/\b(pm|ppl_master)\.aktif\b/);
    }
  });
});

describe("impor tidak pernah menghapus mitra", () => {
  it("hanya menambah, memperbarui, dan menonaktifkan", () => {
    expect(impor).toContain("INSERT INTO ppl_master");
    expect(impor).toContain("UPDATE ppl_master");
    expect(impor).toContain("aktif = 0");
    expect(impor).not.toContain("DELETE FROM ppl_master");
  });

  it("berjalan dalam satu transaksi", () => {
    // Impor yang gagal separuh jalan meninggalkan daftar mitra setengah
    // berubah, tanpa ada yang tahu bagian mana yang sudah masuk.
    expect(impor).toContain("beginTransaction");
    expect(impor).toContain("rollback");
  });

  it("pratinjau tidak menulis apa pun", () => {
    // Penjaganya berada SEBELUM koneksi transaksi diambil.
    const posisiPratinjau = impor.indexOf("if (pratinjau) return hasil;");
    const posisiTransaksi = impor.indexOf("beginTransaction");
    expect(posisiPratinjau).toBeGreaterThan(-1);
    expect(posisiPratinjau).toBeLessThan(posisiTransaksi);
  });

  it("memperbarui tidak menghapus wilayah yang sudah tercatat", () => {
    // Berkas yang tidak memuat kolom desa tidak boleh MENGOSONGKAN desa yang
    // sudah ada — COALESCE yang menjaganya.
    expect(impor).toContain("kecamatan_id = COALESCE(?, kecamatan_id)");
    expect(impor).toContain("desa_id = COALESCE(?, desa_id)");
  });
});
