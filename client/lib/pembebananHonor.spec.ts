import { describe, it, expect } from "vitest";
import {
  bacaTanggal,
  batasPeriode,
  bebankanHonor,
  bulanDilalui,
  hariPerBulan,
  kunciBulan,
} from "@shared/pembebananHonor";

/**
 * Aturan yang dikunci di sini, dan kenapa:
 *
 * Batas SBML berlaku per mitra per BULAN. Begitu periode honor melintasi
 * beberapa bulan, harus ada keputusan berapa rupiah yang jatuh di tiap bulan —
 * dan keputusan itu diambil PER ALOKASI PPL, karena tiap mitra punya sisa kuota
 * yang berbeda.
 *
 * Dua sifat yang paling mudah rusak tanpa terlihat:
 *
 * 1. JUMLAHNYA HARUS UTUH. Berapa pun cara membaginya, jumlah seluruh bagian
 *    wajib sama persis dengan honor aslinya. Pembulatan yang menguapkan satu
 *    rupiah membuat rekap tahunan tidak pernah cocok dengan yang dibayarkan.
 *
 * 2. KELEBIHAN TIDAK BOLEH HILANG. Saat 'luber' kehabisan kuota di semua bulan,
 *    kelebihannya dijatuhkan ke bulan terakhir — bukan dibuang. Membuangnya
 *    akan menyembunyikan pelanggaran batas yang justru ingin ditangkap.
 */

describe("bacaTanggal", () => {
  it("membaca 'YYYY-MM-DD' sebagai tanggal LOKAL, bukan UTC", () => {
    // `new Date('2026-01-01')` bernilai tengah malam UTC; di WIB (+7) itu masih
    // 1 Januari, tapi di zona barat menjadi 31 Desember — bulan pembebanannya
    // ikut meleset satu bulan. Karena itu tanggalnya dipecah manual.
    const d = bacaTanggal("2026-01-01")!;
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(0);
    expect(d.getDate()).toBe(1);
  });

  it("menolak nilai kosong dan tidak sah", () => {
    expect(bacaTanggal(null)).toBeNull();
    expect(bacaTanggal(undefined)).toBeNull();
    expect(bacaTanggal("")).toBeNull();
    expect(bacaTanggal("bukan tanggal")).toBeNull();
  });
});

describe("kunciBulan", () => {
  it("memakai format 'MM-YYYY', sama dengan kolom bulanHonor* di database", () => {
    expect(kunciBulan(new Date(2026, 1, 15))).toBe("02-2026");
    expect(kunciBulan(new Date(2026, 11, 1))).toBe("12-2026");
  });
});

describe("bulanDilalui", () => {
  it("periode dalam satu bulan menghasilkan satu bulan", () => {
    // Satu elemen adalah penanda bahwa layar tidak perlu menawarkan pilihan.
    expect(bulanDilalui("2026-01-01", "2026-01-15")).toEqual(["01-2026"]);
  });

  it("periode lintas dua bulan menghasilkan keduanya, berurutan", () => {
    expect(bulanDilalui("2026-02-15", "2026-03-15")).toEqual(["02-2026", "03-2026"]);
  });

  it("periode lintas tiga bulan menghasilkan ketiganya", () => {
    expect(bulanDilalui("2026-01-20", "2026-03-10")).toEqual(["01-2026", "02-2026", "03-2026"]);
  });

  it("melewati pergantian tahun", () => {
    expect(bulanDilalui("2025-12-20", "2026-01-10")).toEqual(["12-2025", "01-2026"]);
  });

  it("rentang kosong atau terbalik menghasilkan daftar kosong", () => {
    expect(bulanDilalui(null, "2026-01-10")).toEqual([]);
    expect(bulanDilalui("2026-03-10", "2026-01-10")).toEqual([]);
  });
});

describe("hariPerBulan", () => {
  it("menghitung hari di tiap bulan, ujung-ujungnya ikut terhitung", () => {
    // 15-28 Februari = 14 hari, 1-15 Maret = 15 hari.
    expect(hariPerBulan("2026-02-15", "2026-03-15")).toEqual({ "02-2026": 14, "03-2026": 15 });
  });

  it("satu hari tetap satu hari", () => {
    expect(hariPerBulan("2026-05-10", "2026-05-10")).toEqual({ "05-2026": 1 });
  });
});

describe("bebankanHonor - periode satu bulan", () => {
  it("seluruh honor jatuh di bulan itu, metode apa pun diabaikan", () => {
    for (const metode of ["bulan_tertentu", "prorata", "luber"] as const) {
      expect(bebankanHonor(3_000_000, "2026-01-01", "2026-01-31", { metode }))
        .toEqual({ "01-2026": 3_000_000 });
    }
  });
});

describe("bebankanHonor - bulan_tertentu", () => {
  it("membebankan seluruhnya ke bulan yang dipilih", () => {
    expect(bebankanHonor(3_000_000, "2026-02-15", "2026-03-15", {
      metode: "bulan_tertentu", bulanDipilih: "03-2026",
    })).toEqual({ "03-2026": 3_000_000 });
  });

  it("bulan awal maupun bulan akhir sama-sama bisa dipilih", () => {
    expect(bebankanHonor(1_000_000, "2026-01-20", "2026-03-10", {
      metode: "bulan_tertentu", bulanDipilih: "02-2026",
    })).toEqual({ "02-2026": 1_000_000 });
  });

  it("pilihan yang tidak lagi dilalui periode jatuh ke bulan pertama, bukan hilang", () => {
    // Terjadi bila periodenya dipersempit setelah bulannya dipilih. Honor yang
    // menghilang dari rekap jauh lebih berbahaya daripada bulan yang meleset.
    expect(bebankanHonor(500_000, "2026-02-15", "2026-03-15", {
      metode: "bulan_tertentu", bulanDipilih: "07-2026",
    })).toEqual({ "02-2026": 500_000 });
  });
});

describe("bebankanHonor - prorata", () => {
  it("membagi menurut jumlah hari di tiap bulan", () => {
    // 14 hari Februari : 15 hari Maret dari total 29 hari.
    const hasil = bebankanHonor(2_900_000, "2026-02-15", "2026-03-15", { metode: "prorata" });
    expect(hasil["02-2026"] + hasil["03-2026"]).toBe(2_900_000);
    expect(hasil["02-2026"]).toBe(1_400_000);
    expect(hasil["03-2026"]).toBe(1_500_000);
  });

  it("periode dua bulan berporsi hari seimbang praktis terbagi dua", () => {
    const hasil = bebankanHonor(1_000_000, "2026-01-16", "2026-02-15", { metode: "prorata" });
    expect(hasil["01-2026"] + hasil["02-2026"]).toBe(1_000_000);
    expect(Math.abs(hasil["01-2026"] - hasil["02-2026"])).toBeLessThanOrEqual(35_000);
  });

  it("tidak menguapkan rupiah saat pembagiannya tidak bulat", () => {
    const hasil = bebankanHonor(1_000_000, "2026-01-01", "2026-03-31", { metode: "prorata" });
    const jumlah = Object.values(hasil).reduce((a, b) => a + b, 0);
    expect(jumlah).toBe(1_000_000);
  });
});

describe("bebankanHonor - luber", () => {
  it("memenuhi kuota bulan pertama, sisanya ke bulan berikutnya", () => {
    // Mitra masih punya sisa 1 juta di Februari; honornya 3 juta.
    const hasil = bebankanHonor(3_000_000, "2026-02-15", "2026-03-15", {
      metode: "luber", sisaKuota: { "02-2026": 1_000_000, "03-2026": 3_000_000 },
    });
    expect(hasil).toEqual({ "02-2026": 1_000_000, "03-2026": 2_000_000 });
  });

  it("mengalir berurutan melewati tiga bulan", () => {
    const hasil = bebankanHonor(5_000_000, "2026-01-20", "2026-03-10", {
      metode: "luber",
      sisaKuota: { "01-2026": 2_000_000, "02-2026": 2_000_000, "03-2026": 3_000_000 },
    });
    expect(hasil).toEqual({ "01-2026": 2_000_000, "02-2026": 2_000_000, "03-2026": 1_000_000 });
  });

  it("bulan yang kuotanya sudah habis dilewati tanpa kebagian", () => {
    const hasil = bebankanHonor(1_500_000, "2026-02-15", "2026-03-15", {
      metode: "luber", sisaKuota: { "02-2026": 0, "03-2026": 3_000_000 },
    });
    expect(hasil).toEqual({ "02-2026": 0, "03-2026": 1_500_000 });
  });

  it("kelebihan yang tidak tertampung JATUH ke bulan terakhir, tidak dibuang", () => {
    // Kalau dibuang, mitra ini akan terlihat aman padahal honornya melanggar.
    const hasil = bebankanHonor(9_000_000, "2026-02-15", "2026-03-15", {
      metode: "luber", sisaKuota: { "02-2026": 1_000_000, "03-2026": 500_000 },
    });
    expect(hasil["02-2026"]).toBe(1_000_000);
    expect(hasil["03-2026"]).toBe(8_000_000);
    expect(Object.values(hasil).reduce((a, b) => a + b, 0)).toBe(9_000_000);
  });

  it("sisa kuota yang tidak disebut dianggap nol", () => {
    const hasil = bebankanHonor(2_000_000, "2026-02-15", "2026-03-15", { metode: "luber" });
    expect(hasil).toEqual({ "02-2026": 0, "03-2026": 2_000_000 });
  });
});

describe("bebankanHonor - jumlah selalu utuh", () => {
  it.each([
    ["bulan_tertentu", { metode: "bulan_tertentu" as const, bulanDipilih: "03-2026" }],
    ["prorata", { metode: "prorata" as const }],
    ["luber", { metode: "luber" as const, sisaKuota: { "02-2026": 777_777 } }],
  ])("%s menjumlah persis honor aslinya", (_nama, opsi) => {
    const total = 3_333_333;
    const hasil = bebankanHonor(total, "2026-02-15", "2026-03-15", opsi);
    expect(Object.values(hasil).reduce((a, b) => a + b, 0)).toBe(total);
  });
});

describe("batasPeriode", () => {
  it("mengalikan batas bulanan dengan jumlah bulan yang tercakup filter", () => {
    expect(batasPeriode(3_000_000, "2026-01-01", "2026-03-31")).toBe(9_000_000);
    expect(batasPeriode(3_000_000, "2026-01-01", "2026-12-31")).toBe(36_000_000);
  });

  it("rentang di dalam satu bulan tetap satu kali batas", () => {
    expect(batasPeriode(3_000_000, "2026-01-05", "2026-01-20")).toBe(3_000_000);
  });

  it("rentang yang tidak sah tidak menghasilkan nol", () => {
    // Nol akan membuat setiap mitra terlihat melanggar saat filternya belum lengkap.
    expect(batasPeriode(3_000_000, null, null)).toBe(3_000_000);
  });
});
