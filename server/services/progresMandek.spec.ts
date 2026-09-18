import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

/**
 * Peringatan "progres tidak diperbarui lebih dari 2 hari".
 *
 * Muncul di DUA tempat dengan aturan yang harus sama: notifikasi lonceng untuk
 * Ketua Tim (`qMandek`) dan peringatan pada kartu kegiatan di Dashboard
 * (`calculateActivityStatus`). Dulu keduanya berbeda — kartu berhenti di akhir
 * Pengolahan & Analisis, notifikasi baru berhenti di akhir Diseminasi — dan
 * keduanya sama-sama melewati batas masa pendataan.
 *
 * Yang dikunci di sini: peringatan hanya berlaku SELAMA MASA PENGUMPULAN DATA,
 * yaitu masa PML mengisi progres (termasuk mitra Pengolahan, yang juga bekerja
 * pada masa pendataan), dan tidak muncul bila memang tidak ada yang bisa
 * diperbarui.
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

describe("notifikasi Ketua Tim (qMandek)", () => {
  const badan = potong(baca("./notifikasiService.ts"), "const qMandek", "const qMenunggu");

  it("berhenti di akhir masa pengumpulan data, bukan di akhir diseminasi", () => {
    expect(badan).toContain("CURDATE() <= k.tanggalSelesaiPengumpulanData");
    expect(badan).not.toContain("tanggalSelesaiDiseminasiEvaluasi");
  });

  it("melewati kegiatan yang tidak punya progres untuk diperbarui", () => {
    expect(badan).toContain("k.progressKeseluruhan < 100");
    expect(badan).toMatch(/EXISTS \(SELECT 1 FROM ppl p WHERE p\.kegiatanId = k\.id\)/);
  });
});

describe("peringatan kartu kegiatan (Dashboard)", () => {
  const badan = potong(
    baca("../../client/components/dashboard/logikaDashboard.ts"),
    "const mulaiPendataan", "return { status, color, warnings }");

  it("memakai batas masa pengumpulan data, bukan nama tahap", () => {
    expect(badan).toContain("kegiatan.tanggalMulaiPengumpulanData");
    expect(badan).toContain("kegiatan.tanggalSelesaiPengumpulanData");
    expect(badan).not.toContain("Pengolahan & Analisis");
  });

  it("syaratnya sama dengan notifikasi: ada alokasi mitra dan progres belum penuh", () => {
    expect(badan).toContain("kegiatan.ppl?.length ?? 0) > 0");
    expect(badan).toContain("kegiatan.progressKeseluruhan ?? 0) < 100");
  });
});
