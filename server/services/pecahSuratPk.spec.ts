import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

/**
 * Mengunci cara Surat PK dan BAST memecah honor lintas bulan.
 *
 * ATURANNYA, sesuai praktik tim keuangan: honor yang periodenya melintasi
 * beberapa bulan dipecah menjadi SATU SURAT PER BULAN menurut MUATAN — target
 * 10 responden jadi SPK bulan pertama 5 responden dan SPK bulan kedua
 * 5 responden, masing-masing dengan jangka waktunya sendiri (15-31 Jan, lalu
 * 1-15 Feb).
 *
 * KENAPA PERLU DIKUNCI: versi sebelumnya mencetak beban kerja dan honor UTUH
 * alokasinya di surat setiap bulan yang disentuh periodenya. Satu pekerjaan
 * 4,8 juta yang melintasi September-Oktober tercetak penuh di SPK September
 * DAN penuh lagi di SPK Oktober — terkontrak dua kali, tanpa satu pun pesan
 * galat. Kesalahan seperti ini hanya ketahuan setelah suratnya ditandatangani.
 *
 * Repo ini tidak menguji database, jadi yang diperiksa adalah teks sumbernya
 * setelah komentar dibuang.
 */

const baca = (berkas: string): string =>
  readFileSync(fileURLToPath(new URL(berkas, import.meta.url)), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "")
    .replace(/^\s*--.*$/gm, "");

describe("Surat PK mengambil porsi bulan periodenya", () => {
  const sumber = baca("kontrakService.ts");
  const fungsi = sumber.slice(
    sumber.indexOf("export const getDataKontrak"),
    sumber.indexOf("export const pesanNomorKontrak"));

  it("volume dan nilai diambil dari ppl_honor_bulan, bukan dari honor utuh", () => {
    expect(fungsi).toContain("FROM ppl_honor_bulan");
    expect(fungsi).toMatch(/volume:\s*adaPembebanan\s*\?\s*volumePeriode/);
    expect(fungsi).toMatch(/nilaiPerjanjian:\s*adaPembebanan\s*\?\s*jumlahPeriode/);
  });

  it("alokasi yang seluruh muatannya di bulan lain tidak masuk surat ini", () => {
    // "Seluruhnya di Oktober" tidak boleh muncul di SPK September hanya
    // karena rentang kerjanya menyentuh September.
    expect(fungsi).toMatch(/volumePeriode === 0 && jumlahPeriode === 0\) continue;/);
  });

  it("jangka waktu dipotong HANYA bila muatannya memang terpecah", () => {
    // Alokasi yang seluruhnya dibebankan ke satu bulan tetap satu surat dengan
    // jangka kerja utuh; memotongnya akan menyalahi periode kerja sebenarnya.
    expect(fungsi).toMatch(/if \(bulanTerisi > 1\)/);
  });

  it("modul pembagian diimpor lewat jalur relatif, bukan alias @shared", () => {
    // Alias @shared tidak tersedia saat vite.config.ts memuat kode server
    // lewat Node; nilai runtime dari sana membuat server gagal menyala.
    expect(sumber).toContain("from '../../shared/pembebananHonor'");
    expect(sumber).not.toMatch(/from ['"]@shared\/pembebananHonor['"]/);
  });
});

describe("pembebanan menyimpan muatan, bukan hanya rupiah", () => {
  it("pembebananService membagi VOLUME dan menyimpan kolom volume", () => {
    const sumber = baca("pembebananService.ts");
    expect(sumber).toContain("bebankanVolume(");
    expect(sumber).not.toContain("bebankanHonor(");
    expect(sumber).toMatch(/INSERT INTO ppl_honor_bulan \(ppl_id, bulan, volume, jumlah\)/);
  });

  it("kegiatanService menghitung volume dari beban kerja, bukan dari besaran honor", () => {
    const sumber = baca("kegiatanService.ts");
    const fungsi = sumber.slice(
      sumber.indexOf("const siapkanPembebanan"),
      sumber.indexOf("export const createKegiatan"));
    expect(fungsi).toMatch(/const volume = ppl\.honorarium\?\.reduce\([\s\S]*?parseRupiah\(h\.bebanKerja\)/);
    expect(fungsi).not.toMatch(/parseRupiah\(h\.besaranHonor\)/);
  });
});
