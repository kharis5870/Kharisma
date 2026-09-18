import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

/**
 * Beberapa orang yang memperbarui progres dan menyunting kegiatan bersamaan.
 *
 * Tiga bug yang dikunci di sini semuanya terbukti pada build produksi:
 *
 * - C1: transaksi yang meminjam koneksi KEDUA dari pool (isi 10). 30 simpan
 *   progres serentak membuat 29 macet dan seluruh server berhenti menjawab.
 * - C2: kueri di dalam transaksi yang memakai pool tidak melihat progres yang
 *   baru diubah, sehingga persentase kegiatan tertinggal satu langkah.
 * - C3: simpan Edit Kegiatan menimpa progres yang diisi PML setelah halaman
 *   edit dibuka (PML mengisi 21, kembali ke 13).
 *
 * Diperiksa lewat teks sumber setelah komentar dibuang, mengikuti kebiasaan
 * repo ini untuk hal yang bergantung pada database.
 */

const baca = (berkas: string): string =>
  readFileSync(new URL(berkas, import.meta.url), "utf-8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n").filter(b => !b.trim().startsWith("//")).join("\n");

/**
 * Isi sebuah fungsi yang diekspor, sampai deklarasi ekspor berikutnya.
 *
 * Dipotong di `export` berikutnya, bukan di `};` pertama: createKegiatan dan
 * updateKegiatan ditutup dengan `}` tanpa titik koma, sehingga pencarian `};`
 * menelan fungsi sesudahnya.
 */
const badanFungsi = (sumber: string, nama: string): string => {
  const mulai = sumber.indexOf(`export const ${nama}`);
  expect(mulai, `fungsi ${nama} tidak ditemukan`).toBeGreaterThan(-1);
  const sesudah = sumber.slice(mulai);
  const akhir = sesudah.indexOf("\nexport ", 1);
  return akhir === -1 ? sesudah : sesudah.slice(0, akhir);
};

describe("C1/C2: transaksi progres hanya memakai koneksinya sendiri", () => {
  const progres = badanFungsi(baca("./kegiatanProgres.ts"), "updatePplProgress");

  it("tidak ada kueri lewat pool di dalam simpan progres", () => {
    expect(progres).not.toMatch(/await db\.(query|execute)\(/);
  });

  it("kunci diambil berurutan: kegiatan, lalu ppl", () => {
    const kunciKegiatan = progres.indexOf("FROM kegiatan WHERE id = ? FOR UPDATE");
    const kunciPpl = progres.indexOf("FROM ppl WHERE id = ? FOR UPDATE");
    expect(kunciKegiatan).toBeGreaterThan(-1);
    expect(kunciPpl).toBeGreaterThan(kunciKegiatan);
  });
});

describe("pesan galat simpan progres sampai ke pengguna", () => {
  const progres = badanFungsi(baca("./kegiatanProgres.ts"), "updatePplProgress");

  it("galat validasi bertanda statusCode dan diteruskan apa adanya", () => {
    expect(progres).toMatch(/tidak bisa melebihi total beban kerja[\s\S]{0,80}statusCode: 400/);
    expect(progres).toMatch(/if \(error\?\.statusCode\) throw error;/);
  });

  it("angka progres negatif atau pecahan ditolak", () => {
    expect(progres).toContain("!Number.isInteger(Number(nilai)) || Number(nilai) < 0");
  });

  it("route membalas lewat kirimGalat, bukan 400 untuk semua galat", () => {
    const route = baca("../routes/kegiatan.ts");
    const blok = route.slice(route.indexOf("router.put('/ppl/:pplId/progress'"), route.indexOf("router.put('/dokumen/:dokumenId/status'"));
    expect(blok).toContain("kirimGalat(res, error, 'Gagal memperbarui progress PPL')");
    expect(blok).not.toContain("res.status(400).json({ message: pesan })");
  });
});

describe("C1: simpan kegiatan tidak memegang dua koneksi", () => {
  const simpan = baca("./kegiatanSimpan.ts");

  it.each(["createKegiatan", "updateKegiatan"])("%s memeriksa batas honor & ketua tim sebelum meminjam koneksi", (nama) => {
    const badan = badanFungsi(simpan, nama);
    const pinjam = badan.indexOf("db.getConnection()");
    expect(badan.indexOf("siapkanPembebanan(")).toBeLessThan(pinjam);
    expect(badan.indexOf("pastikanKetuaTimAda(")).toBeLessThan(pinjam);
  });

  it.each(["createKegiatan", "updateKegiatan"])("%s mengambil hasilnya setelah koneksi dikembalikan", (nama) => {
    const badan = badanFungsi(simpan, nama);
    expect(badan.indexOf("getKegiatanById(")).toBeGreaterThan(badan.lastIndexOf("connection.release()"));
  });
});

describe("C3: simpan Edit Kegiatan tidak menimpa progres PML", () => {
  const badan = badanFungsi(baca("./kegiatanSimpan.ts"), "updateKegiatan");

  it("progres alokasi lama tidak lagi dihapus lalu ditulis ulang dari layar", () => {
    expect(badan).not.toContain("DELETE FROM ppl_progress WHERE ppl_id = ?");
    expect(badan).toContain("idLama === null && p.progress");
  });

  it("perubahan beban diterapkan sebagai selisih pada nilai terbaru, dan pengurangan berlebih ditolak", () => {
    expect(badan).toContain("const selisihBeban = totalBeban - (bebanLamaPerId.get(idLama) ?? 0)");
    expect(badan).toMatch(/progress_type = \? FOR UPDATE/);
    expect(badan).toContain("PROGRES_BERJALAN");
  });

  it("alokasi dikunci dengan urutan yang sama seperti simpan progres", () => {
    expect(badan.indexOf("UPDATE kegiatan SET")).toBeLessThan(badan.indexOf("FROM ppl WHERE kegiatanId = ? FOR UPDATE"));
  });
});
