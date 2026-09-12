import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

/**
 * Daftar PPL dan Daftar PML menyaring ANGKA-ANGKANYA menurut periode, bukan
 * daftar orangnya.
 *
 * Mitra yang tidak kebagian kegiatan pada periode terpilih harus tetap tampil
 * dengan 0 kegiatan, dan PML yang tidak mengawasi apa pun harus tetap tampil
 * dengan 0 mitra — justru merekalah yang dicari ketika beban sedang dibagi.
 * Orang yang sedang menganggur adalah jawaban atas pertanyaan "siapa yang masih
 * bisa ditambah", dan daftar yang menghilangkan mereka menjawab kebalikannya.
 *
 * Karena itu syarat periode diletakkan DI DALAM tabel turunan yang di-LEFT JOIN,
 * bukan di WHERE kueri utama. Memindahkannya ke WHERE adalah satu baris yang
 * terlihat lebih sederhana, tetap lolos typecheck, tetap mengembalikan data yang
 * masuk akal — dan diam-diam menghapus setiap orang yang sedang tidak bertugas
 * dari daftar. Tes ini ada untuk menahan perpindahan itu.
 *
 * Repo ini tidak menguji database, jadi yang diperiksa adalah teks sumbernya
 * setelah komentar dibuang, supaya penjelasan di atas tidak ikut terhitung
 * sebagai bukti.
 */

const bacaTanpaKomentar = (berkas: string): string =>
  readFileSync(new URL(berkas, import.meta.url), "utf-8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .filter(baris => !baris.trim().startsWith("//") && !baris.trim().startsWith("--"))
    .join("\n");

const ppl = bacaTanpaKomentar("./pplService.ts");
const pml = bacaTanpaKomentar("./pmlService.ts");

/** Isi sebuah fungsi yang diekspor, dari namanya sampai penutupnya. */
const badanFungsi = (sumber: string, nama: string): string => {
  const mulai = sumber.indexOf(`export const ${nama}`);
  expect(mulai, `fungsi ${nama} tidak ditemukan`).toBeGreaterThan(-1);
  const sesudah = sumber.slice(mulai);
  const akhir = sesudah.indexOf("\n};");
  return akhir === -1 ? sesudah : sesudah.slice(0, akhir);
};

describe.each([
  ["daftar mitra", ppl, "getPplAdminData"],
  ["daftar PML", pml, "getPmlAdminData"],
])("%s menyaring periode tanpa menghilangkan orang", (_nama, sumber, fungsi) => {
  const badan = () => badanFungsi(sumber, fungsi);

  it("memakai aturan rentang honor bersama, bukan salinannya sendiri", () => {
    expect(sumber).toContain("from './rentangHonorSql'");
    expect(badan()).toContain("KONDISI_PERIODE");
    expect(badan()).toContain("paramPeriode");
  });

  it("syarat periode berada DI DALAM tabel turunan yang di-LEFT JOIN", () => {
    const isi = badan();
    const turunan = isi.indexOf("LEFT JOIN (");
    expect(turunan, "tabel turunan tidak ditemukan").toBeGreaterThan(-1);

    // Penyisip periode harus muncul sesudah pembuka tabel turunan, dan sebelum
    // tabel turunan itu ditutup.
    const penyisip = isi.indexOf("${saringPeriode}");
    expect(penyisip).toBeGreaterThan(turunan);
    expect(isi.slice(turunan, penyisip)).not.toContain("GROUP BY");
  });

  it("tanpa periode, syaratnya menjadi '1' sehingga hasilnya utuh seperti semula", () => {
    // Dibuktikan terhadap database sungguhan: tanpa filter, kueri yang disusun
    // ulang ini memberi hasil identik dengan kueri lamanya.
    expect(badan()).toContain("periode ? KONDISI_PERIODE : '1'");
    expect(badan()).toContain("periode ? paramPeriode(periode.mulai, periode.selesai) : []");
  });

  it("periode TIDAK dipakai di WHERE kueri terluar", () => {
    const isi = badan();
    // WHERE terluar hanya boleh menyaring peran (u.isPML), tidak pernah periode.
    const whereTerluar = isi.slice(isi.lastIndexOf(") x ON"));
    expect(whereTerluar).not.toContain("KONDISI_PERIODE");
    expect(whereTerluar).not.toContain("saringPeriode");
  });
});
