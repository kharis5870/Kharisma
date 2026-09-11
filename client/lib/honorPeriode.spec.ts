import { describe, it, expect } from "vitest";
import { bulanDalamRentang, bulanPembebananSetelahUbah, rentangDariBulan, labelRentang } from "./honorPeriode";

describe("bulanDalamRentang", () => {
  it("mengembalikan satu bulan bila rentang tidak melewati batas bulan", () => {
    expect(bulanDalamRentang("2026-01-01", "2026-01-31").map(o => o.label)).toEqual(["Januari 2026"]);
    expect(bulanDalamRentang("2026-01-10", "2026-01-15").map(o => o.label)).toEqual(["Januari 2026"]);
  });

  it("mengembalikan dua bulan untuk rentang lintas dua bulan", () => {
    expect(bulanDalamRentang("2026-01-21", "2026-02-12").map(o => o.label)).toEqual([
      "Januari 2026",
      "Februari 2026",
    ]);
  });

  // Kasus yang diminta: rentang tiga bulan harus memberi tiga pilihan.
  it("mengembalikan tiga bulan untuk rentang lintas tiga bulan", () => {
    const opsi = bulanDalamRentang("2026-01-21", "2026-03-05");
    expect(opsi.map(o => o.label)).toEqual(["Januari 2026", "Februari 2026", "Maret 2026"]);
    expect(opsi.map(o => o.value)).toEqual(["01-2026", "02-2026", "03-2026"]);
  });

  it("menangani rentang yang melewati pergantian tahun", () => {
    expect(bulanDalamRentang("2025-11-15", "2026-02-10").map(o => o.label)).toEqual([
      "November 2025",
      "Desember 2025",
      "Januari 2026",
      "Februari 2026",
    ]);
  });

  it("mengembalikan daftar kosong untuk rentang tidak lengkap atau terbalik", () => {
    expect(bulanDalamRentang(undefined, "2026-01-31")).toEqual([]);
    expect(bulanDalamRentang("2026-01-01", undefined)).toEqual([]);
    expect(bulanDalamRentang("2026-02-01", "2026-01-01")).toEqual([]);
  });
});

describe("bulanPembebananSetelahUbah", () => {
  it("memilih otomatis bila rentang hanya menyentuh satu bulan", () => {
    expect(bulanPembebananSetelahUbah("2026-01-01", "2026-01-31", undefined)).toBe("01-2026");
  });

  it("mempertahankan pilihan lama bila masih di dalam rentang baru", () => {
    expect(bulanPembebananSetelahUbah("2026-01-21", "2026-03-05", "02-2026")).toBe("02-2026");
  });

  it("mengosongkan pilihan bila bulan lama keluar dari rentang baru", () => {
    // Pengguna harus memilih ulang secara sadar, bukan diam-diam dipindahkan.
    expect(bulanPembebananSetelahUbah("2026-04-01", "2026-06-30", "02-2026")).toBeUndefined();
  });

  it("mengosongkan pilihan bila rentang dihapus", () => {
    expect(bulanPembebananSetelahUbah(undefined, undefined, "02-2026")).toBeUndefined();
  });
});

describe("rentangDariBulan", () => {
  it("memberi tanggal 1 sampai akhir bulan", () => {
    expect(rentangDariBulan("02-2026")).toEqual({ mulai: "2026-02-01", selesai: "2026-02-28" });
    expect(rentangDariBulan("01-2026")).toEqual({ mulai: "2026-01-01", selesai: "2026-01-31" });
  });

  it("menangani Februari pada tahun kabisat", () => {
    expect(rentangDariBulan("02-2024")).toEqual({ mulai: "2024-02-01", selesai: "2024-02-29" });
  });
});

describe("labelRentang", () => {
  it("menampilkan rentang lengkap", () => {
    expect(labelRentang("2026-01-21", "2026-02-12")).toBe("21 Jan 2026 — 12 Feb 2026");
  });

  it("menampilkan tanda hubung bila kosong", () => {
    expect(labelRentang(undefined, undefined)).toBe("-");
  });
});
