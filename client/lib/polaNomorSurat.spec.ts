import { describe, it, expect } from "vitest";
import { penandaTidakDikenal, contohNomorSurat, PENANDA_SAH } from "./polaNomorSurat";

const POLA_BAWAAN = "{nomor}/SPK/{BULAN}/{ROMAWI}/{tahun}";

describe("penandaTidakDikenal", () => {
  it("meloloskan pola bawaan", () => {
    expect(penandaTidakDikenal(POLA_BAWAAN)).toEqual([]);
  });

  it("meloloskan seluruh penanda yang didukung", () => {
    expect(penandaTidakDikenal(PENANDA_SAH.join("/"))).toEqual([]);
  });

  // Inti masalahnya: salah huruf besar-kecil lolos diam-diam ke surat resmi.
  it("menangkap penanda yang salah huruf besar-kecil", () => {
    expect(penandaTidakDikenal("{NOMOR}/SPK/{tahun}")).toEqual(["{NOMOR}"]);
    expect(penandaTidakDikenal("{Tahun}")).toEqual(["{Tahun}"]);
  });

  it("menangkap penanda yang memang tidak ada", () => {
    expect(penandaTidakDikenal("{nomor}/{kota}/{tahun}")).toEqual(["{kota}"]);
  });

  it("tidak melaporkan penanda yang sama dua kali", () => {
    expect(penandaTidakDikenal("{kota}/{kota}")).toEqual(["{kota}"]);
  });

  it("pola tanpa penanda sama sekali dianggap sah", () => {
    expect(penandaTidakDikenal("SPK/2026")).toEqual([]);
    expect(penandaTidakDikenal("")).toEqual([]);
  });
});

describe("contohNomorSurat", () => {
  // Harus sama persis dengan susunNomorSurat di server.
  it("menyusun pola bawaan seperti server", () => {
    expect(contohNomorSurat(POLA_BAWAAN, 7, new Date(2026, 8, 5)))
      .toBe("007/SPK/SEPTEMBER/IX/2026");
  });

  it("mendukung {bulan} berupa angka dua digit", () => {
    expect(contohNomorSurat("{bulan}-{tahun}", 1, new Date(2026, 8, 5))).toBe("09-2026");
    expect(contohNomorSurat("{bulan}", 1, new Date(2026, 0, 1))).toBe("01");
  });

  it("nomor 3 digit tidak dipotong saat melewati 999", () => {
    expect(contohNomorSurat("{nomor}", 1234, new Date(2026, 0, 1))).toBe("1234");
  });

  it("Januari dan Desember dipetakan benar", () => {
    expect(contohNomorSurat("{BULAN}/{ROMAWI}", 1, new Date(2026, 0, 1))).toBe("JANUARI/I");
    expect(contohNomorSurat("{BULAN}/{ROMAWI}", 1, new Date(2026, 11, 31))).toBe("DESEMBER/XII");
  });

  it("penanda tak dikenal dibiarkan apa adanya — persis seperti server", () => {
    expect(contohNomorSurat("{NOMOR}/{tahun}", 7, new Date(2026, 8, 5))).toBe("{NOMOR}/2026");
  });
});
