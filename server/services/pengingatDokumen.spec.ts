import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

/**
 * Mengunci aturan pengingat dokumen kosong.
 *
 * ATURANNYA, dan alasannya:
 *
 * Tim keuangan bisa menegur sebuah dokumen yang link-nya masih kosong. Teguran
 * itu muncul sebagai notifikasi di lonceng ketua tim kegiatan DAN pembuat
 * kegiatannya — dua peran yang sama-sama berhak menyunting kegiatan, jadi
 * keduanya bisa menindaklanjuti.
 *
 * Tiga sifat yang mudah rusak tanpa disadari, dan itulah yang dikunci di sini:
 *
 * 1. CUKUP SEKALI. Notifikasi di aplikasi ini dihitung saat dibaca, bukan
 *    disimpan sebagai baris, sehingga tidak ada apa pun yang dengan sendirinya
 *    mengingat bahwa pengingat sudah dikirim. `pengingatDikirimPada` yang
 *    memikul tugas itu, dan syarat `IS NULL` pada UPDATE-lah yang menolak
 *    kiriman kedua — bukan pemeriksaan SELECT sebelumnya, yang akan sama-sama
 *    lolos bila dua permintaan datang hampir bersamaan.
 *
 * 2. HILANG SENDIRI SAAT DIISI. Kedua jalur pengisian link — `updateSingleDocument`
 *    (dialog tim keuangan di View Documents) dan simpan massal `updateKegiatan`
 *    (halaman Edit Kegiatan) — WAJIB mengosongkan kembali kolom pengingatnya.
 *    Kalau salah satu lupa, dokumen yang sudah diisi lewat jalur itu tidak akan
 *    pernah bisa diingatkan lagi seandainya kelak dikosongkan.
 *
 * 3. BUKAN UNTUK KEGIATAN ARSIP. Kegiatan yang diarsipkan tidak lagi
 *    memunculkan notifikasi apa pun; lihat filterArsip.spec.ts.
 *
 * Repo ini tidak menguji database, jadi yang diperiksa adalah teks sumbernya
 * setelah komentar dibuang — komentar di berkas ini justru menjelaskan
 * aturannya, jadi ia tidak boleh ikut jadi bukti.
 */

const baca = (namaBerkas: string): string => {
  const isi = readFileSync(fileURLToPath(new URL(namaBerkas, import.meta.url)), "utf8");
  return isi
    .replace(/\/\*[\s\S]*?\*\//g, "")   // komentar blok
    .replace(/^\s*\/\/.*$/gm, "");      // komentar baris
};

describe("pengingat dokumen hanya bisa dikirim sekali", () => {
  const sumber = baca("kegiatanService.ts");

  it("menolak kiriman kedua lewat syarat pada UPDATE, bukan lewat SELECT", () => {
    // Syarat inilah yang membuat dua permintaan bersamaan tidak sama-sama lolos.
    expect(sumber).toContain("pengingatDikirimPada IS NULL");
    expect(sumber).toMatch(/affectedRows === 0/);
  });

  it("hanya menandai dokumen yang link-nya benar-benar kosong", () => {
    expect(sumber).toMatch(/AND \(link IS NULL OR link = ''\)/);
  });
});

describe("pengingat dikosongkan kembali begitu link terisi", () => {
  const sumber = baca("kegiatanService.ts");

  it("kedua jalur pengisian link mengosongkan kolom pengingat", () => {
    // Dua kemunculan: satu di updateSingleDocument, satu di simpan massal
    // updateKegiatan. Kalau salah satu hilang, jumlahnya turun jadi 1.
    const kemunculan = sumber.match(
      /pengingatDikirimPada = NULL, pengingatDikirimOleh = NULL/g) ?? [];
    expect(kemunculan).toHaveLength(2);
  });
});

describe("notifikasi pengingat sampai ke dua orang yang tepat", () => {
  const sumber = baca("notifikasiService.ts");

  it("ditujukan ke ketua tim DAN pembuat kegiatan", () => {
    expect(sumber).toContain("kt.user_id = ? OR k.createdBy_userId = ?");
  });

  it("muncul hanya bila pengingatnya sudah dikirim dan link masih kosong", () => {
    expect(sumber).toContain("d.pengingatDikirimPada IS NOT NULL");
    expect(sumber).toMatch(/pengingatDikirimPada IS NOT NULL[\s\S]{0,200}d\.link IS NULL OR d\.link = ''/);
  });

  it("tidak memunculkan pengingat untuk kegiatan yang diarsipkan", () => {
    // Pemeriksaan sempit: khusus di dalam query pengingat, bukan di berkas ini
    // secara umum — query lain juga memakai isArsip.
    const query = sumber.slice(
      sumber.indexOf("qPengingatDokumen"),
      sumber.indexOf("const PERINGKAT"));
    expect(query).toContain("k.isArsip = 0");
  });

  it("tidak dibatasi peran, karena pembuat kegiatan bisa siapa saja", () => {
    // Semua pengguna boleh membuat kegiatan, jadi query ini TIDAK boleh
    // diletakkan di balik `adalahKetuaTim` maupun `adalahPenyetuju`.
    expect(sumber).toMatch(/^\s*tugas\.push\(qPengingatDokumen\(userId\)\);/m);
  });
});
