import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

/**
 * Notifikasi "mitra belum berprogres" untuk PML.
 *
 * Satu-satunya notifikasi yang benar-benar ditujukan ke pegawai biasa. Sebelum
 * ada ini, akun yang bukan pemegang ketua tim dan bukan supervisor praktis
 * tidak menerima apa pun, padahal PML-lah yang mengisi progres mitra.
 *
 * Yang dikunci di sini adalah hal-hal yang kalau berubah TIDAK menimbulkan
 * galat, hanya notifikasi yang salah sasaran atau tidak pernah muncul.
 */

const baca = (jalur: string): string =>
  readFileSync(new URL(jalur, import.meta.url), "utf-8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n").filter(b => !b.trim().startsWith("//")).join("\n");

const potong = (sumber: string, awal: string, akhir: string): string => {
  const i = sumber.indexOf(awal);
  expect(i, `penanda "${awal}" tidak ditemukan`).toBeGreaterThan(-1);
  const j = sumber.indexOf(akhir, i);
  return j === -1 ? sumber.slice(i) : sumber.slice(i, j);
};

const sumber = baca("./notifikasiService.ts");
const badan = potong(sumber, "const qMitraTanpaProgres", "const qSuratBerubah");

describe("qMitraTanpaProgres", () => {
  it("penerimanya PML alokasi itu, bukan peran tertentu", () => {
    // 'PML' tidak ada di users.role; yang menentukan hanya ppl.pml_id.
    expect(badan).toContain("p.pml_id  = ?");
    expect(badan).not.toContain("role");
  });

  it("tahap progres pertama tidak dihitung sebagai progres", () => {
    // 'open' dan 'belum_entry' terisi otomatis sebesar beban kerja saat mitra
    // dialokasikan; kalau ikut dihitung, peringatan ini tidak pernah muncul.
    expect(badan).toContain("g.progress_type NOT IN ('open', 'belum_entry')");
    expect(badan).toMatch(/\)\s*=\s*0/);
  });

  it("hanya menjelang akhir masa pengumpulan data", () => {
    expect(badan).toContain("CURDATE() >= k.tanggalMulaiPengumpulanData");
    expect(badan).toContain("DATEDIFF(k.tanggalSelesaiPengumpulanData, CURDATE()) <= 7");
  });

  it("berhenti seminggu sesudah tenggat, tidak jadi peringatan abadi", () => {
    expect(badan).toContain("DATE_ADD(k.tanggalSelesaiPengumpulanData, INTERVAL 7 DAY)");
  });

  it("melewati kegiatan arsip dan alokasi tanpa beban kerja", () => {
    expect(badan).toContain("k.isArsip = 0");
    expect(badan).toContain("p.bebanKerja > 0");
  });

  it("digabung per kegiatan dan tahap mitra, bukan satu per mitra", () => {
    expect(badan).toContain("COUNT(*)");
    expect(badan).toContain("GROUP BY k.id, k.namaKegiatan, p.tahap");
  });

  it("tiga hari terakhir dan sesudahnya dianggap kritis", () => {
    expect(badan).toMatch(/daysLeft\) <= 3 \? 'critical' : 'warning'/);
  });

  it("tahap mitra dikirim terpisah dari tahap dokumen", () => {
    // ppl.tahap ('listing'/'pencacahan'/'pengolahan-analisis') bukan tipe
    // dokumen; mitra pengolahan bekerja pada masa pendataan.
    expect(badan).toContain("NULL                                                 AS tahap");
    expect(badan).toContain("p.tahap                                              AS tahapMitra");
  });
});

describe("penyaluran notifikasi", () => {
  const penyalur = potong(sumber, "const tugas: Promise<AppNotification[]>[]", "const semua");

  it("dikirim tanpa syarat peran, seperti pengingat dokumen", () => {
    expect(penyalur).toContain("tugas.push(qMitraTanpaProgres(userId));");

    // Barisnya berdiri sendiri: tidak bergantung pada `adalahKetuaTim` maupun
    // `adalahPenyetuju`, sebab PML bukan salah satu dari keduanya.
    const barisPemanggil = penyalur.split("\n")
      .filter(b => b.includes("qMitraTanpaProgres"));
    expect(barisPemanggil).toHaveLength(1);
    expect(barisPemanggil[0]).not.toContain("adalah");
    expect(barisPemanggil[0].trim()).toBe("tugas.push(qMitraTanpaProgres(userId));");
  });
});
