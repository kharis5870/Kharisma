import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import {
  cocokTahun, labelSaringTahun, tahunKegiatan, tahunTersedia, type SaringTahun,
} from "./tahunKegiatan";

/**
 * Penyaringan kegiatan menurut tahun di Dashboard.
 *
 * Tahun diambil dari tanggal mulai persiapan — awal kegiatan. Yang dikunci di
 * sini terutama dua hal yang kalau salah TIDAK menimbulkan galat, hanya daftar
 * yang keliru: pergeseran tahun karena zona waktu, dan kegiatan tanpa tanggal
 * yang diam-diam lenyap.
 */

const kegiatan = (tanggal: string | null) => ({ tanggalMulaiPersiapan: tanggal });

describe("tahunKegiatan", () => {
  it("membaca tahun dari tanggal mulai persiapan", () => {
    expect(tahunKegiatan(kegiatan("2026-03-01"))).toBe(2026);
  });

  it("cap waktu dari database tidak bergeser oleh zona waktu", () => {
    // 1 Januari 2026 WIB tiba sebagai 2025-12-31T17:00:00Z bila diubah lewat
    // Date di mesin UTC; empat digit pertama teksnya yang dipakai.
    expect(tahunKegiatan(kegiatan("2026-01-01T00:00:00.000Z"))).toBe(2026);
    expect(tahunKegiatan(kegiatan("2026-12-31T23:59:59.000Z"))).toBe(2026);
  });

  it("tanggal kosong atau tidak terbaca menghasilkan null", () => {
    expect(tahunKegiatan(kegiatan(null))).toBeNull();
    expect(tahunKegiatan(kegiatan(""))).toBeNull();
    expect(tahunKegiatan({})).toBeNull();
  });
});

describe("tahunTersedia", () => {
  it("hanya tahun yang benar-benar ada, terbaru lebih dulu", () => {
    const daftar = [kegiatan("2025-02-01"), kegiatan("2026-01-01"), kegiatan("2025-11-01")];
    expect(tahunTersedia(daftar)).toEqual([2026, 2025]);
  });

  it("kegiatan tanpa tanggal tidak menambah pilihan kosong", () => {
    expect(tahunTersedia([kegiatan(null), kegiatan("2026-01-01")])).toEqual([2026]);
  });
});

describe("cocokTahun", () => {
  const k2025 = kegiatan("2025-06-01");
  const k2026 = kegiatan("2026-06-01");
  const tanpaTanggal = kegiatan(null);

  it("mode semua meloloskan apa pun, termasuk yang tanpa tanggal", () => {
    const saring: SaringTahun = { mode: 'semua' };
    expect(cocokTahun(k2025, saring)).toBe(true);
    expect(cocokTahun(tanpaTanggal, saring)).toBe(true);
  });

  it("satu tahun menyaring tepat tahun itu", () => {
    const saring: SaringTahun = { mode: 'satu', tahun: 2026 };
    expect(cocokTahun(k2026, saring)).toBe(true);
    expect(cocokTahun(k2025, saring)).toBe(false);
  });

  it("rentang mencakup kedua ujungnya", () => {
    const saring: SaringTahun = { mode: 'rentang', dari: 2025, sampai: 2026 };
    expect(cocokTahun(k2025, saring)).toBe(true);
    expect(cocokTahun(k2026, saring)).toBe(true);
    expect(cocokTahun(kegiatan("2024-06-01"), saring)).toBe(false);
  });

  it("rentang terbalik dibaca sama, bukan menghasilkan daftar kosong", () => {
    expect(cocokTahun(k2025, { mode: 'rentang', dari: 2026, sampai: 2025 })).toBe(true);
  });

  it("kegiatan tanpa tanggal disembunyikan saat tahun dipilih", () => {
    expect(cocokTahun(tanpaTanggal, { mode: 'satu', tahun: 2026 })).toBe(false);
  });
});

describe("labelSaringTahun", () => {
  it("menyebut penyaring yang aktif untuk judul ekspor", () => {
    expect(labelSaringTahun({ mode: 'semua' })).toBe("Semua tahun");
    expect(labelSaringTahun({ mode: 'satu', tahun: 2026 })).toBe("Tahun 2026");
    expect(labelSaringTahun({ mode: 'rentang', dari: 2024, sampai: 2026 })).toBe("Tahun 2024–2026");
  });

  it("rentang satu tahun tidak ditulis sebagai rentang", () => {
    expect(labelSaringTahun({ mode: 'rentang', dari: 2026, sampai: 2026 })).toBe("Tahun 2026");
  });
});

const baca = (jalur: string): string =>
  readFileSync(new URL(jalur, import.meta.url), "utf-8");

describe("Dashboard", () => {
  const layar = baca("../pages/Dashboard.tsx");

  it("penyaring tahun ikut menentukan daftar kegiatan", () => {
    expect(layar).toContain("cocokTahun(activity, saringTahun)");
    expect(layar).toContain("matchesTahun");
  });

  it("pilihan tahun disusun dari data, bukan daftar tetap", () => {
    expect(layar).toContain("tahunTersedia(activeActivities)");
  });

  it("kendali tahunnya satu komponen, bukan blok terpisah", () => {
    // Versi sebelumnya memunculkan blok "Rentang" KEDUA di sebelahnya, yang
    // melewati tepi kotak filter dan mendorong filter lain.
    expect(layar).toContain("<FilterTahun daftarTahun={daftarTahun}");
    expect(layar).not.toContain('tahunPilihan === "rentang"');
  });

  it("penyaring ikut menjadi dependensi useMemo", () => {
    // Tanpa ini daftar tidak ikut berubah saat tahunnya diganti.
    expect(layar).toContain("timFilter, saringTahun]");
  });
});

describe("FilterTahun", () => {
  const komponen = baca("../components/dashboard/FilterTahun.tsx");

  it("menyediakan ketiga mode dalam satu kendali", () => {
    expect(komponen).toContain("mode: 'semua' }");
    expect(komponen).toContain("mode: 'satu'");
    expect(komponen).toContain("mode: 'rentang'");
  });

  it("tombolnya menampilkan rentang yang sedang dipilih", () => {
    // Supaya pilihan rentang tidak memakan ruang setelah selesai dipilih.
    expect(komponen).toContain("labelSaringTahun(saring)");
  });

  it("popover tidak menutup saat rentang sedang disusun", () => {
    // Menutup setelah memilih "dari" membuat "sampai" harus dibuka lagi.
    const bagianRentang = komponen.slice(komponen.indexOf("Rentang tahun"));
    expect(bagianRentang).not.toContain("pilihTahun(");
    expect(bagianRentang).toContain("onUbah({ mode: 'rentang'");
  });
});
