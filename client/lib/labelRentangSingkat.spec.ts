import { describe, it, expect } from "vitest";
import { labelRentangSingkat, labelRentang } from "./honorPeriode";

/**
 * Label periode ringkas untuk kolom tabel yang sempit.
 *
 * Tahun sengaja dihilangkan ketika sudah jelas dari konteks — di Riwayat
 * Penyuratan, tahunnya ditentukan filter di atas tabel. Yang TIDAK boleh
 * hilang adalah tahun pada rentang yang melintasi pergantian tahun, karena di
 * situlah menghilangkannya berubah dari "ringkas" menjadi "menyesatkan".
 */

describe("labelRentangSingkat", () => {
  it("satu bulan yang sama: tanggal awal cukup angkanya", () => {
    expect(labelRentangSingkat("2026-09-01", "2026-09-30")).toBe("1-30 September");
    expect(labelRentangSingkat("2026-02-01", "2026-02-28")).toBe("1-28 Februari");
  });

  it("beda bulan pada tahun yang sama: nama bulan disingkat, tanpa tahun", () => {
    expect(labelRentangSingkat("2026-09-17", "2026-10-17")).toBe("17 Sep - 17 Okt");
  });

  it("melintasi pergantian tahun: tahun WAJIB ikut disebut", () => {
    const hasil = labelRentangSingkat("2026-12-17", "2027-01-05");
    expect(hasil).toContain("26");
    expect(hasil).toContain("27");
  });

  it("tanpa tanggal selesai, satu tanggal lengkap dengan tahunnya", () => {
    expect(labelRentangSingkat("2026-09-08")).toBe("8 Sep 2026");
  });

  it("tanpa tanggal sama sekali", () => {
    expect(labelRentangSingkat()).toBe("-");
    expect(labelRentangSingkat(undefined, "2026-09-30")).toBe("-");
  });

  it("selalu lebih pendek daripada label panjangnya", () => {
    // Inilah alasan fungsi ini ada: kolom periode termakan lebarnya.
    const pasangan: [string, string][] = [
      ["2026-09-01", "2026-09-30"],
      ["2026-09-17", "2026-10-17"],
    ];
    for (const [a, b] of pasangan) {
      expect(labelRentangSingkat(a, b).length).toBeLessThan(labelRentang(a, b).length);
    }
  });
});
