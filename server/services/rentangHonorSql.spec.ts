import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import {
  KONDISI_PERIODE, kondisiOverlap, listingRange, paramPeriode,
  rentangHonorSql, MULAI_SESUAI_TAHAP,
} from "./rentangHonorSql";

/**
 * Aturan "kapan honor sebuah tahap berlaku" harus hidup di SATU tempat.
 *
 * Sebelumnya potongan SQL ini disalin di honorService dan kontrakService, dan
 * salinan yang menyimpang adalah cara paling sunyi untuk membuat dua layar
 * melaporkan angka berbeda atas data yang sama: tidak ada galat, keduanya
 * tampak masuk akal, dan yang keliru baru ketahuan ketika angkanya dipakai
 * membayar orang.
 *
 * Dua hal dikunci di sini: urutan penampung yang terbalik (paling mudah salah
 * saat menyalin), dan tidak adanya salinan baru di layanan lain.
 */

describe("rentangHonorSql", () => {
  it("memakai fallback ke kolom bulan lama", () => {
    // Tanpa fallback ini, kegiatan lama yang hanya menyimpan bulan LENYAP dari
    // rekap — bukan tampil salah, tapi hilang sama sekali.
    const r = rentangHonorSql("Listing");
    expect(r.mulai).toContain("COALESCE(k.tanggalMulaiHonorListing");
    expect(r.mulai).toContain("k.bulanHonorListing");
    expect(r.selesai).toContain("LAST_DAY(");
    expect(r.bulan).toBe("k.bulanHonorListing");
  });

  it("syarat beririsan, bukan termuat seluruhnya", () => {
    // "mulai <= akhirFilter AND selesai >= awalFilter" adalah irisan.
    expect(kondisiOverlap(listingRange)).toBe(
      `(${listingRange.mulai} <= ? AND ${listingRange.selesai} >= ?)`);
  });
});

describe("paramPeriode", () => {
  it("tiap pasangan berurutan SELESAI dulu, baru MULAI", () => {
    // Terbalik dari dugaan, dan itulah yang membuatnya mudah salah disalin:
    // syaratnya berbunyi `mulaiHonor <= ?` sehingga penampung pertama adalah
    // akhir periode filter.
    expect(paramPeriode("2026-09-01", "2026-09-30")).toEqual([
      "2026-09-30", "2026-09-01",
      "2026-09-30", "2026-09-01",
      "2026-09-30", "2026-09-01",
    ]);
  });

  it("jumlah penampung persis sebanyak tanda tanya di KONDISI_PERIODE", () => {
    const penampung = (KONDISI_PERIODE.match(/\?/g) ?? []).length;
    expect(paramPeriode("2026-01-01", "2026-01-31")).toHaveLength(penampung);
  });

  it("KONDISI_PERIODE mencakup ketiga tahap", () => {
    expect(KONDISI_PERIODE).toContain("p.tahap = 'listing'");
    expect(KONDISI_PERIODE).toContain("p.tahap = 'pencacahan'");
    expect(KONDISI_PERIODE).toContain("p.tahap = 'pengolahan-analisis'");
  });

  it("MULAI_SESUAI_TAHAP mengeluarkan tanggal berformat yyyy-MM-dd", () => {
    expect(MULAI_SESUAI_TAHAP).toContain("'%Y-%m-%d'");
  });
});

describe("tidak ada salinan aturan ini di layanan lain", () => {
  const dir = new URL(".", import.meta.url);

  it("hanya rentangHonorSql.ts yang menyusun COALESCE(k.tanggalMulaiHonor...)", () => {
    const pelanggar = readdirSync(dir)
      .filter(n => n.endsWith(".ts") && !n.endsWith(".spec.ts") && n !== "rentangHonorSql.ts")
      .filter(n => readFileSync(new URL(n, dir), "utf-8").includes("COALESCE(k.tanggalMulaiHonor"));
    expect(pelanggar).toEqual([]);
  });

  it("honorService dan kontrakService mengambilnya dari modul bersama", () => {
    for (const berkas of ["honorService.ts", "kontrakService.ts"]) {
      expect(readFileSync(new URL(berkas, dir), "utf-8")).toContain("from './rentangHonorSql'");
    }
  });
});
