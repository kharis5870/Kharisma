import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { progresBolehDiperbarui } from "@shared/hakKegiatan";

/**
 * Progres hanya boleh diisi sejak masa pengumpulan data dimulai.
 *
 * Sebelum ini progres bisa diisi kapan saja, termasuk saat kegiatan masih dalam
 * persiapan — padahal mitranya belum bekerja, sehingga angka apa pun yang masuk
 * pasti keliru dan langsung terbawa ke persentase kegiatan, dasbor, dan rekap.
 */

describe("progresBolehDiperbarui", () => {
  it("ditutup selama masa persiapan", () => {
    expect(progresBolehDiperbarui("2026-10-01", "2026-09-23")).toBe(false);
  });

  it("dibuka tepat pada hari pertama pendataan", () => {
    expect(progresBolehDiperbarui("2026-10-01", "2026-10-01")).toBe(true);
  });

  it("TIDAK ditutup lagi setelah pendataan berakhir", () => {
    // Disengaja: pendataan sering molor, dan masih ada mitra yang
    // menyelesaikan bagiannya setelah tanggal selesai terlewat.
    expect(progresBolehDiperbarui("2026-10-01", "2027-03-15")).toBe(true);
  });

  it("tanggal mulai yang belum diisi tidak menahan siapa pun", () => {
    expect(progresBolehDiperbarui(null, "2026-09-23")).toBe(true);
    expect(progresBolehDiperbarui(undefined, "2026-09-23")).toBe(true);
    expect(progresBolehDiperbarui("", "2026-09-23")).toBe(true);
  });

  it("cap waktu dari database dibaca tanggalnya saja", () => {
    // mysql2 bisa mengembalikan kolom tanggal sebagai '2026-10-01T00:00:00Z'.
    expect(progresBolehDiperbarui("2026-10-01T00:00:00.000Z", "2026-09-30")).toBe(false);
    expect(progresBolehDiperbarui("2026-10-01T00:00:00.000Z", "2026-10-02")).toBe(true);
  });

  it("perbandingannya per hari, bukan per jam", () => {
    expect(progresBolehDiperbarui("2026-10-01", "2026-09-30")).toBe(false);
  });
});

const baca = (jalur: string): string =>
  readFileSync(new URL(jalur, import.meta.url), "utf-8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n").filter(b => !b.trim().startsWith("//")).join("\n");

describe("penjaga di server", () => {
  const progres = baca("../../server/services/kegiatanProgres.ts");

  it("updatePplProgress menolak pengisian sebelum masa pendataan", () => {
    expect(progres).toContain("progresBolehDiperbarui");
    expect(progres).toContain("PROGRES_BELUM_DIBUKA");
    expect(progres).toContain("statusCode: 409");
  });

  it("hari ini diambil dari database, bukan dari jam mesin server", () => {
    // Sesi database sudah disetel +07:00; jam mesin cPanel umumnya UTC.
    expect(progres).toContain("DATE_FORMAT(CURDATE(), '%Y-%m-%d')");
  });

  it("tanggalnya dibaca pada kueri penguncian yang sudah ada", () => {
    // Menambah kueri terpisah berarti meminjam koneksi kedua di tengah
    // transaksi — penyebab macet yang sudah pernah terjadi di layar ini.
    expect(progres).toContain("FROM kegiatan WHERE id = ? FOR UPDATE");
    expect(progres.match(/FROM kegiatan WHERE id = \? FOR UPDATE/g)).toHaveLength(1);
  });
});

describe("alokasi mitra tetap bisa disiapkan saat persiapan", () => {
  const simpan = baca("../../server/services/kegiatanSimpan.ts");

  it("penyimpanan kegiatan TIDAK ikut dijaga aturan ini", () => {
    // Alokasi mitra dan beban kerjanya justru disusun pada masa persiapan, dan
    // penyusunan itu menulis tahap progres pertama. Kalau penjaga waktu ikut
    // dipasang di sini, Edit Kegiatan akan tertolak sepanjang masa persiapan.
    expect(simpan).toContain("INSERT INTO ppl_progress");
    expect(simpan).not.toContain("progresBolehDiperbarui");
  });
});
