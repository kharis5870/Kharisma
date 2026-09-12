import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

/**
 * Peringatan "isi surat berubah sejak digenerate" harus dihitung di SATU tempat.
 *
 * Ada dua pemakai peringatan ini: layar Generate Surat (lencana "Berubah" per
 * mitra) dan notifikasi untuk tim keuangan. Godaan yang wajar adalah memberi
 * notifikasi kueri agregatnya sendiri — lebih cepat, dan tampak setara. Tapi
 * begitu keduanya berhitung sendiri-sendiri, keduanya akan menyimpang, dan
 * selisihnya nyaris mustahil dikenali karena angka yang satu maupun yang lain
 * sama-sama terlihat masuk akal. Yang terjadi di lapangan: layar bilang surat
 * sudah sesuai, lonceng masih berdering, dan tidak ada yang tahu mana benar.
 *
 * Karena itu rantainya dikunci di sini:
 *   getDataKontrak  ->  bandingkanIsiSurat        (satu-satunya pembanding)
 *   suratBerubahSejakTerbit -> getDataKontrak     (bukan kueri sendiri)
 *   qSuratBerubah   ->  suratBerubahSejakTerbit   (bukan kueri sendiri)
 *
 * Dikunci juga bahwa salinan isi surat benar-benar DITULIS saat nomor dipesan.
 * Tanpa itu seluruh rantai di atas tetap hijau tapi tidak pernah menemukan apa
 * pun selain selisih total — kegagalan yang paling sunyi dari semuanya.
 *
 * Repo ini tidak menguji database, jadi yang diperiksa adalah teks sumbernya
 * setelah komentar dibuang, supaya penjelasan seperti ini tidak ikut terhitung
 * sebagai bukti.
 */

const bacaTanpaKomentar = (berkas: string): string =>
  readFileSync(new URL(berkas, import.meta.url), "utf-8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .filter(baris => !baris.trim().startsWith("//"))
    .join("\n");

const kontrak = bacaTanpaKomentar("./kontrakService.ts");
const notifikasi = bacaTanpaKomentar("./notifikasiService.ts");

/** Isi sebuah fungsi yang diekspor, dari namanya sampai penutupnya. */
const badanFungsi = (sumber: string, nama: string): string => {
  const mulai = sumber.indexOf(`export const ${nama}`);
  expect(mulai, `fungsi ${nama} tidak ditemukan`).toBeGreaterThan(-1);
  const sesudah = sumber.slice(mulai);
  const akhir = sesudah.indexOf("\n};");
  return akhir === -1 ? sesudah : sesudah.slice(0, akhir);
};

describe("rantai perhitungan peringatan surat berubah", () => {
  it("getDataKontrak membandingkan isi surat dengan bandingkanIsiSurat", () => {
    const badan = badanFungsi(kontrak, "getDataKontrak");
    expect(badan).toContain("bandingkanIsiSurat");
    expect(badan).toContain("isi_terbit");
  });

  it("suratBerubahSejakTerbit memakai getDataKontrak, bukan kueri agregat sendiri", () => {
    const badan = badanFungsi(kontrak, "suratBerubahSejakTerbit");
    expect(badan).toContain("getDataKontrak");
    // Tidak boleh menghitung ulang muatan/honor dengan SQL-nya sendiri.
    expect(badan).not.toMatch(/SUM\(/);
    expect(badan).not.toContain("ppl_honor_bulan");
  });

  it("surat yang mitranya kehilangan seluruh pekerjaan ikut diperingatkan", () => {
    // Ditemukan saat pengujian dengan data sungguhan: sebuah surat aktif tidak
    // pernah diperiksa karena mitranya sudah tidak muncul di data periode itu.
    // Perbandingan per mitra hanya melihat mitra yang MASIH ada, sehingga
    // perubahan terbesar — seluruh pekerjaannya hilang — justru satu-satunya
    // yang lolos tanpa peringatan.
    const badan = badanFungsi(kontrak, "suratBerubahSejakTerbit");
    expect(badan).toContain("suratAktif");
    expect(badan).toContain("baris.length > 0) continue");
    expect(badan).toContain("Tidak ada pekerjaan tersisa");
  });

  it("notifikasi memakai suratBerubahSejakTerbit, bukan kueri sendiri", () => {
    expect(notifikasi).toContain("suratBerubahSejakTerbit");
    const mulai = notifikasi.indexOf("const qSuratBerubah");
    expect(mulai).toBeGreaterThan(-1);
    const badan = notifikasi.slice(mulai, notifikasi.indexOf("const PERINGKAT"));
    expect(badan).toContain("suratBerubahSejakTerbit");
    expect(badan).not.toContain("pool.query");
  });

  it("notifikasi surat berubah hanya untuk penyetuju, satu per surat", () => {
    // Pemanggil lain di baris yang sama ikut berkurung, jadi polanya tidak bisa
    // memakai "bukan tanda kurung" sebagai pengisi antara.
    expect(notifikasi).toMatch(/adalahPenyetuju\)[\s\S]{0,200}qSuratBerubah\(\)/);
    // Satu notifikasi per surat: dikumpulkan lebih dulu per suratId.
    expect(notifikasi).toContain("perSurat");
  });

  it("salinan isi surat benar-benar ditulis saat nomor dipesan", () => {
    const badan = badanFungsi(kontrak, "pesanNomorKontrak");
    expect(badan).toContain("isi_terbit");
    expect(badan).toContain("JSON.stringify(isi)");
    expect(badan).toContain("total_volume");
  });

  it("memperbarui kontrak menulis ulang salinan isinya, dan tidak menyentuh nomor", () => {
    const badan = badanFungsi(kontrak, "perbaruiIsiSurat");
    expect(badan).toContain("isi_terbit = ?");
    // Nomor surat TIDAK boleh ikut berubah: bagi tim keuangan ini surat yang
    // sama yang dicetak ulang, bukan surat baru.
    expect(badan).not.toContain("nomor_urut =");
    expect(badan).not.toContain("nomor_surat =");
  });
});
