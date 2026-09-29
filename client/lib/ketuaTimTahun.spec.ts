import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { ketuaTimTahun, tahunCadangan, tahunUntukKetuaTim } from "./ketuaTimTahun";

/**
 * Pemilihan ketua tim menurut tahun kepengurusan.
 *
 * Kepengurusan berubah tiap tahun, dan kegiatan menyimpan baris ketua tim yang
 * berlaku saat itu — itulah yang membuat kegiatan lama tetap terarsip dengan
 * nama ketua tim yang benar. Yang dikunci di sini: tahun mana yang dipakai, dan
 * apa yang terjadi ketika kepengurusan tahun itu belum didaftarkan.
 */

const DAFTAR = [
  { id: "KT004", tahun: 2026 },
  { id: "KT005", tahun: 2026 },
  { id: "KT009", tahun: 2027 },
  { id: "KT001", tahun: 2024 },
];

const HARI_INI = new Date("2026-09-28T10:00:00");

describe("tahunUntukKetuaTim", () => {
  it("mengikuti tahun jadwal persiapan", () => {
    expect(tahunUntukKetuaTim("2027-01-15", HARI_INI)).toBe(2027);
  });

  it("jadwal belum diisi: memakai tahun berjalan", () => {
    expect(tahunUntukKetuaTim(null, HARI_INI)).toBe(2026);
    expect(tahunUntukKetuaTim(undefined, HARI_INI)).toBe(2026);
    expect(tahunUntukKetuaTim("", HARI_INI)).toBe(2026);
  });

  it("menerima Date dari pemilih tanggal maupun teks dari database", () => {
    expect(tahunUntukKetuaTim(new Date("2027-03-01T00:00:00"), HARI_INI)).toBe(2027);
    expect(tahunUntukKetuaTim("2027-03-01T00:00:00.000Z", HARI_INI)).toBe(2027);
  });

  it("tanggal tidak sah tidak melumpuhkan form", () => {
    expect(tahunUntukKetuaTim(new Date("bukan tanggal"), HARI_INI)).toBe(2026);
    expect(tahunUntukKetuaTim("entah", HARI_INI)).toBe(2026);
  });
});

describe("ketuaTimTahun", () => {
  it("hanya kepengurusan tahun itu", () => {
    expect(ketuaTimTahun(DAFTAR, 2026).map(k => k.id)).toEqual(["KT004", "KT005"]);
    expect(ketuaTimTahun(DAFTAR, 2027).map(k => k.id)).toEqual(["KT009"]);
  });

  it("tahun tanpa kepengurusan menghasilkan daftar kosong", () => {
    expect(ketuaTimTahun(DAFTAR, 2030)).toEqual([]);
  });
});

describe("tahunCadangan", () => {
  it("menawarkan tahun terdekat sebelumnya", () => {
    expect(tahunCadangan(DAFTAR, 2030)).toBe(2027);
    expect(tahunCadangan(DAFTAR, 2027)).toBe(2026);
  });

  it("tidak menawarkan tahun sesudahnya", () => {
    // Memakai kepengurusan yang belum berjalan sebagai cadangan akan
    // memasangkan kegiatan lama dengan ketua tim yang belum menjabat.
    expect(tahunCadangan(DAFTAR, 2024)).toBeNull();
  });

  it("daftar kosong tidak menawarkan apa pun", () => {
    expect(tahunCadangan([], 2026)).toBeNull();
  });
});

const baca = (jalur: string): string =>
  readFileSync(new URL(jalur, import.meta.url), "utf-8");

describe("form Tambah Kegiatan", () => {
  const layar = baca("../pages/InputKegiatan.tsx");

  it("dropdown hanya berisi kepengurusan tahun kegiatan", () => {
    expect(layar).toContain("ketuaTimTahunIni.map(");
    expect(layar).not.toContain("ketuaTimList.map((ketua)");
  });

  it("pilihan dikosongkan saat tahun jadwal berubah", () => {
    expect(layar).toContain("store.updateFormField('ketua_tim_id', '')");
    expect(layar).toContain("tahunSebelumnya");
  });

  it("menawarkan kepengurusan tahun sebelumnya bila tahun ini kosong", () => {
    expect(layar).toContain("Belum ada ketua tim untuk tahun");
    expect(layar).toContain("setTahunPakai(tahunCadanganTersedia)");
  });

  it("menjelaskan bahwa ketua tim mengikuti jadwal persiapan", () => {
    expect(layar).toContain("Ketua tim mengikuti tahun jadwal persiapan");
  });
});

describe("form Edit Kegiatan", () => {
  const layar = baca("../pages/EditActivity.tsx");

  it("ketua tim yang sedang terpilih tetap ada di daftar", () => {
    // Kalau tidak, kegiatan lama kehilangan ketua timnya saat dibuka dan
    // tertimpa begitu disimpan.
    expect(layar).toContain("daftarKetuaTimTampil");
    expect(layar).toContain("[...tahunIni, terpilih]");
  });

  it("tidak mengosongkan pilihan secara otomatis", () => {
    // Berbeda dengan form Tambah: riwayat kegiatan lama harus utuh.
    const blok = layar.slice(layar.indexOf("const ketuaTimBedaTahun"), layar.indexOf("const timKetuaTerpilih"));
    expect(blok).not.toContain("handleFormFieldChange('ketua_tim_id', '')");
  });

  it("memberi tahu bila ketua timnya dari kepengurusan tahun lain", () => {
    expect(layar).toContain("ketuaTimBedaTahun");
    expect(layar).toContain("supaya riwayat kegiatan tidak berubah");
  });
});
