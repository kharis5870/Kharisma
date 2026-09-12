import { describe, it, expect } from "vitest";
import {
  bacaTanggal,
  batasPeriode,
  bebankanVolume,
  bulanDilalui,
  hariPerBulan,
  kunciBulan,
  rentangDalamBulan,
  totalPembebanan,
} from "@shared/pembebananHonor";

/**
 * Aturan yang dikunci di sini, dan kenapa:
 *
 * Batas SBML berlaku per mitra per BULAN. Begitu periode honor melintasi
 * beberapa bulan, harus ada keputusan berapa yang jatuh di tiap bulan — dan
 * keputusan itu diambil PER ALOKASI PPL.
 *
 * YANG DIBAGI ADALAH MUATAN. Tim keuangan memecah Surat PK honor lintas bulan
 * menurut unit beban kerja: target 10 responden jadi SPK bulan pertama
 * 5 responden dan SPK bulan kedua 5 responden. Karena itu:
 *
 * 1. VOLUME SELALU BILANGAN BULAT dan menjumlah persis beban kerjanya.
 * 2. RUPIAH SELALU volume x harga satuan, sehingga jumlah seluruh bulan persis
 *    sama dengan honor alokasinya.
 * 3. KELEBIHAN TIDAK BOLEH HILANG. Saat 'luber' kehabisan kuota di semua bulan,
 *    muatannya dijatuhkan ke bulan terakhir — membuangnya akan menyembunyikan
 *    pelanggaran batas yang justru ingin ditangkap.
 */

const HARGA = 24_000;

describe("bacaTanggal", () => {
  it("membaca 'YYYY-MM-DD' sebagai tanggal LOKAL, bukan UTC", () => {
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
    expect(bulanDilalui("2026-01-01", "2026-01-15")).toEqual(["01-2026"]);
  });

  it("periode lintas bulan menghasilkan semuanya, berurutan", () => {
    expect(bulanDilalui("2026-01-15", "2026-02-15")).toEqual(["01-2026", "02-2026"]);
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
    // 15-31 Januari = 17 hari, 1-15 Februari = 15 hari.
    expect(hariPerBulan("2026-01-15", "2026-02-15")).toEqual({ "01-2026": 17, "02-2026": 15 });
  });
});

describe("rentangDalamBulan — jangka waktu tiap Surat PK", () => {
  it("contoh tim keuangan: 15 Jan - 15 Feb jadi 15-31 Jan dan 1-15 Feb", () => {
    expect(rentangDalamBulan("2026-01-15", "2026-02-15", "01-2026"))
      .toEqual({ mulai: "2026-01-15", selesai: "2026-01-31" });
    expect(rentangDalamBulan("2026-01-15", "2026-02-15", "02-2026"))
      .toEqual({ mulai: "2026-02-01", selesai: "2026-02-15" });
  });

  it("akhir Februari tahun kabisat benar", () => {
    expect(rentangDalamBulan("2028-02-10", "2028-03-05", "02-2028"))
      .toEqual({ mulai: "2028-02-10", selesai: "2028-02-29" });
  });

  it("bulan yang tidak disentuh periode menghasilkan null", () => {
    expect(rentangDalamBulan("2026-01-15", "2026-02-15", "03-2026")).toBeNull();
    expect(rentangDalamBulan(null, "2026-02-15", "01-2026")).toBeNull();
  });
});

describe("bebankanVolume — periode satu bulan", () => {
  it("seluruh muatan jatuh di bulan itu, metode apa pun diabaikan", () => {
    for (const metode of ["bulan_tertentu", "prorata", "luber"] as const) {
      expect(bebankanVolume(10, HARGA, "2026-01-01", "2026-01-31", { metode }))
        .toEqual({ "01-2026": { volume: 10, jumlah: 240_000 } });
    }
  });
});

describe("bebankanVolume — bulan_tertentu", () => {
  it("membebankan seluruh muatan ke bulan yang dipilih", () => {
    expect(bebankanVolume(10, HARGA, "2026-01-15", "2026-02-15", {
      metode: "bulan_tertentu", bulanDipilih: "02-2026",
    })).toEqual({ "02-2026": { volume: 10, jumlah: 240_000 } });
  });

  it("pilihan yang tidak lagi dilalui periode jatuh ke bulan pertama, bukan hilang", () => {
    expect(bebankanVolume(10, HARGA, "2026-01-15", "2026-02-15", {
      metode: "bulan_tertentu", bulanDipilih: "07-2026",
    })).toEqual({ "01-2026": { volume: 10, jumlah: 240_000 } });
  });
});

describe("bebankanVolume — prorata", () => {
  it("contoh tim keuangan: 10 responden pada 15 Jan - 15 Feb menjadi 5 dan 5", () => {
    // 17 : 15 hari -> 5,31 : 4,69. Sisa satu unit jatuh ke PECAHAN terbesar
    // (Februari, ,69), bukan ke bulan terpanjang — kalau ke bulan terpanjang
    // hasilnya 6/4, bukan pembagian yang dipraktikkan tim keuangan.
    expect(bebankanVolume(10, HARGA, "2026-01-15", "2026-02-15", { metode: "prorata" })).toEqual({
      "01-2026": { volume: 5, jumlah: 120_000 },
      "02-2026": { volume: 5, jumlah: 120_000 },
    });
  });

  it("volume selalu bulat dan menjumlah persis beban kerjanya", () => {
    const hasil = bebankanVolume(7, HARGA, "2026-01-01", "2026-03-31", { metode: "prorata" });
    for (const b of Object.values(hasil)) expect(Number.isInteger(b.volume)).toBe(true);
    expect(totalPembebanan(hasil)).toEqual({ volume: 7, jumlah: 7 * HARGA });
  });
});

describe("bebankanVolume — luber", () => {
  it("bulan pertama diisi sebanyak unit yang masih muat, sisanya ke bulan berikutnya", () => {
    // Sisa kuota Januari Rp 100.000 hanya muat 4 dokumen (4 x 24.000 = 96.000).
    expect(bebankanVolume(10, HARGA, "2026-01-15", "2026-02-15", {
      metode: "luber", sisaKuota: { "01-2026": 100_000, "02-2026": 3_000_000 },
    })).toEqual({
      "01-2026": { volume: 4, jumlah: 96_000 },
      "02-2026": { volume: 6, jumlah: 144_000 },
    });
  });

  it("tidak pernah melewati kuota bulan pertama walau hanya kurang serupiah", () => {
    // 95.999 tidak cukup untuk dokumen ke-4 (96.000).
    const hasil = bebankanVolume(10, HARGA, "2026-01-15", "2026-02-15", {
      metode: "luber", sisaKuota: { "01-2026": 95_999 },
    });
    expect(hasil["01-2026"].volume).toBe(3);
    expect(hasil["01-2026"].jumlah).toBeLessThanOrEqual(95_999);
  });

  it("mengalir berurutan melewati tiga bulan", () => {
    expect(bebankanVolume(10, HARGA, "2026-01-20", "2026-03-10", {
      metode: "luber",
      sisaKuota: { "01-2026": 48_000, "02-2026": 72_000, "03-2026": 999_999 },
    })).toEqual({
      "01-2026": { volume: 2, jumlah: 48_000 },
      "02-2026": { volume: 3, jumlah: 72_000 },
      "03-2026": { volume: 5, jumlah: 120_000 },
    });
  });

  it("kelebihan yang tidak tertampung JATUH ke bulan terakhir, tidak dibuang", () => {
    const hasil = bebankanVolume(10, HARGA, "2026-01-15", "2026-02-15", {
      metode: "luber", sisaKuota: { "01-2026": 24_000, "02-2026": 0 },
    });
    expect(hasil["01-2026"].volume).toBe(1);
    expect(hasil["02-2026"].volume).toBe(9);
    expect(totalPembebanan(hasil).volume).toBe(10);
  });

  it("harga satuan nol: seluruh muatan cukup di bulan pertama", () => {
    expect(bebankanVolume(10, 0, "2026-01-15", "2026-02-15", { metode: "luber" }))
      .toEqual({ "01-2026": { volume: 10, jumlah: 0 }, "02-2026": { volume: 0, jumlah: 0 } });
  });
});

describe("bebankanVolume — sifat yang berlaku untuk semua metode", () => {
  it.each([
    ["bulan_tertentu", { metode: "bulan_tertentu" as const, bulanDipilih: "02-2026" }],
    ["prorata", { metode: "prorata" as const }],
    ["luber", { metode: "luber" as const, sisaKuota: { "01-2026": 77_777 } }],
  ])("%s: rupiah tiap bulan = volume x harga, dan totalnya utuh", (_nama, opsi) => {
    const hasil = bebankanVolume(13, HARGA, "2026-01-15", "2026-02-15", opsi);
    for (const b of Object.values(hasil)) expect(b.jumlah).toBe(b.volume * HARGA);
    expect(totalPembebanan(hasil)).toEqual({ volume: 13, jumlah: 13 * HARGA });
  });

  it("muatan nol tetap tercatat di bulan pertama, bukan hilang", () => {
    expect(bebankanVolume(0, HARGA, "2026-01-15", "2026-02-15", { metode: "prorata" }))
      .toEqual({ "01-2026": { volume: 0, jumlah: 0 } });
  });
});

describe("batasPeriode", () => {
  it("mengalikan batas bulanan dengan jumlah bulan yang tercakup filter", () => {
    expect(batasPeriode(3_000_000, "2026-01-01", "2026-03-31")).toBe(9_000_000);
    expect(batasPeriode(3_000_000, "2026-01-01", "2026-12-31")).toBe(36_000_000);
  });

  it("rentang yang tidak sah tidak menghasilkan nol", () => {
    expect(batasPeriode(3_000_000, null, null)).toBe(3_000_000);
  });
});
