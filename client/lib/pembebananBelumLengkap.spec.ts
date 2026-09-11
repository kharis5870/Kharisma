import { describe, it, expect } from "vitest";
import { pembebananBelumLengkap, bulanDalamRentang } from "./honorPeriode";

/**
 * Penjaga simpan: setiap alokasi PPL harus punya cara pembebanan yang jelas
 * SEBELUM kegiatan bisa disimpan — tapi hanya bila periode honor tahapnya
 * memang melintasi lebih dari satu bulan.
 *
 * Dulu yang diperiksa adalah kolom `bulanHonor*` milik tahap. Sejak keputusan
 * itu pindah ke tiap alokasi, kolom tahap sengaja dibiarkan kosong untuk
 * periode lintas bulan — dan memeriksanya akan membuat kegiatan seperti itu
 * TIDAK PERNAH bisa disimpan. Tes ini yang menjaga agar pemeriksaan tidak
 * kembali ke kolom lama.
 */

const duaBulan = bulanDalamRentang("2026-09-15", "2026-10-15");
const satuBulan = bulanDalamRentang("2026-09-01", "2026-09-30");

describe("pembebananBelumLengkap", () => {
  it("periode satu bulan tidak pernah menahan simpan", () => {
    // Tidak ada keputusan untuk diambil, jadi metode yang kosong pun tidak apa.
    expect(pembebananBelumLengkap(satuBulan, [{}])).toBe(false);
    expect(pembebananBelumLengkap([], [{}])).toBe(false);
  });

  it("menahan alokasi lintas bulan yang belum ditentukan sama sekali", () => {
    expect(pembebananBelumLengkap(duaBulan, [{}])).toBe(true);
  });

  it("prorata dan luber tidak butuh bulan pilihan", () => {
    expect(pembebananBelumLengkap(duaBulan, [{ metodePembebanan: "prorata" }])).toBe(false);
    expect(pembebananBelumLengkap(duaBulan, [{ metodePembebanan: "luber" }])).toBe(false);
  });

  it("bulan_tertentu dengan bulan yang sah dianggap lengkap", () => {
    expect(pembebananBelumLengkap(duaBulan, [
      { metodePembebanan: "bulan_tertentu", bulanPembebananDipilih: "10-2026" },
    ])).toBe(false);
  });

  it("bulan yang sudah di luar rentang dianggap BELUM dipilih", () => {
    // Terjadi bila periodenya dipersempit setelah pilihannya dibuat. Membiarkan
    // lolos berarti server diam-diam memindahkannya ke bulan pertama.
    expect(pembebananBelumLengkap(duaBulan, [
      { metodePembebanan: "bulan_tertentu", bulanPembebananDipilih: "01-2026" },
    ])).toBe(true);
  });

  it("cukup SATU alokasi yang belum lengkap untuk menahan simpan", () => {
    expect(pembebananBelumLengkap(duaBulan, [
      { metodePembebanan: "prorata" },
      { metodePembebanan: "bulan_tertentu", bulanPembebananDipilih: "09-2026" },
      {},
    ])).toBe(true);
  });

  it("daftar alokasi kosong tidak menahan simpan", () => {
    expect(pembebananBelumLengkap(duaBulan, [])).toBe(false);
  });
});
