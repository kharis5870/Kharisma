import { describe, it, expect } from "vitest";
import { pesanGalatSql, statusGalatSql, KODE_SALAH_MASUKAN } from "@shared/pesanGalatSql";

const BAWAAN = "Gagal menyimpan kegiatan.";

describe("pesanGalatSql", () => {
  it("menerjemahkan pelanggaran foreign key", () => {
    const pesan = pesanGalatSql("ER_NO_REFERENCED_ROW_2", BAWAAN);
    expect(pesan).not.toBe(BAWAAN);
    expect(pesan.toLowerCase()).toContain("muat ulang");
  });

  it("menerjemahkan penanda ganda dan isian wajib", () => {
    expect(pesanGalatSql("ER_DUP_ENTRY", BAWAAN)).not.toBe(BAWAAN);
    expect(pesanGalatSql("ER_BAD_NULL_ERROR", BAWAAN)).not.toBe(BAWAAN);
  });

  // Galat tak terduga tidak boleh menyamar jadi kesalahan pengguna.
  it("memakai pesan bawaan untuk kode yang tidak dikenal", () => {
    expect(pesanGalatSql("ER_ENTAH_APA", BAWAAN)).toBe(BAWAAN);
    expect(pesanGalatSql(undefined, BAWAAN)).toBe(BAWAAN);
    expect(pesanGalatSql(null, BAWAAN)).toBe(BAWAAN);
  });

  /**
   * Inti perbaikannya. Sebelumnya `error.sqlMessage` diteruskan apa adanya,
   * sehingga pengguna melihat nama basis data, nama tabel, dan nama constraint.
   */
  it("tidak pernah membocorkan istilah internal database", () => {
    const terlarang = [/constraint/i, /foreign key/i, /kharisma_db/i, /\bketua_tim\b/i, /\bkegiatan`/i];
    for (const kode of KODE_SALAH_MASUKAN) {
      const pesan = pesanGalatSql(kode, BAWAAN);
      for (const pola of terlarang) {
        expect(pesan, `${kode} membocorkan ${pola}`).not.toMatch(pola);
      }
    }
  });

  it("selalu memberi kalimat yang tidak kosong", () => {
    for (const kode of KODE_SALAH_MASUKAN) {
      expect(pesanGalatSql(kode, BAWAAN).trim().length).toBeGreaterThan(10);
    }
  });
});

describe("statusGalatSql", () => {
  // Kesalahan masukan bukan kerusakan aplikasi; membalasnya 500 membuat
  // laporan bug penuh galat yang sebenarnya bisa diperbaiki sendiri pengguna.
  it("400 untuk kesalahan masukan", () => {
    for (const kode of KODE_SALAH_MASUKAN) {
      expect(statusGalatSql(kode), kode).toBe(400);
    }
  });

  it("500 untuk sisanya", () => {
    expect(statusGalatSql("ER_LOCK_DEADLOCK")).toBe(500);
    expect(statusGalatSql(undefined)).toBe(500);
    expect(statusGalatSql(null)).toBe(500);
  });
});
