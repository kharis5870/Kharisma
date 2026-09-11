import { describe, it, expect } from "vitest";
import {
  susunNomorSurat,
  penandaTidakDikenal,
  polaTanpaNomor,
  PENANDA_WAJIB,
} from "@shared/nomorSurat";

const POLA_SPK = "{nomor}/SPK/{BULAN}/{ROMAWI}/{tahun}";
const POLA_BAST = "{nomor}/BAST/{BULAN}/{ROMAWI}/{tahun}";

describe("susunNomorSurat", () => {
  it("mengisi kelima penanda", () => {
    const hasil = susunNomorSurat(POLA_SPK, 7, new Date(2026, 8, 5));
    expect(hasil).toBe("007/SPK/SEPTEMBER/IX/2026");
  });

  it("memakai pola BAST tanpa perlakuan khusus", () => {
    const hasil = susunNomorSurat(POLA_BAST, 3, new Date(2026, 0, 31));
    expect(hasil).toBe("003/BAST/JANUARI/I/2026");
  });

  /**
   * Inti keputusan penomoran BAST: nomor URUT diambil dari SPK mitra, tetapi
   * penanda bulan mengikuti TANGGAL BAST. BAST yang terbit Maret atas SPK
   * Februari harus menyebut Maret — kalau tidak, suratnya menyebut bulan yang
   * bukan bulan terbitnya.
   */
  it("memakai bulan tanggal BAST, bukan bulan SPK", () => {
    const nomorUrutDariSpkFebruari = 12;
    const hasil = susunNomorSurat(POLA_BAST, nomorUrutDariSpkFebruari, new Date(2026, 2, 4));
    expect(hasil).toBe("012/BAST/MARET/III/2026");
  });

  it("memberi nol di depan sampai tiga digit dan membiarkan yang lebih besar", () => {
    const maret = new Date(2026, 2, 1);
    expect(susunNomorSurat("{nomor}", 1, maret)).toBe("001");
    expect(susunNomorSurat("{nomor}", 97, maret)).toBe("097");
    expect(susunNomorSurat("{nomor}", 1234, maret)).toBe("1234");
  });

  it("mengisi {bulan} sebagai angka dua digit", () => {
    expect(susunNomorSurat("{bulan}-{tahun}", 1, new Date(2026, 0, 15))).toBe("01-2026");
    expect(susunNomorSurat("{bulan}-{tahun}", 1, new Date(2026, 11, 15))).toBe("12-2026");
  });

  it("mengisi penanda yang muncul lebih dari sekali", () => {
    expect(susunNomorSurat("{nomor}/{nomor}", 5, new Date(2026, 0, 1))).toBe("005/005");
  });

  it("membiarkan penanda yang tidak dikenal apa adanya", () => {
    expect(susunNomorSurat("{NOMOR}/SPK", 5, new Date(2026, 0, 1))).toBe("{NOMOR}/SPK");
  });
});

describe("penandaTidakDikenal", () => {
  it("tidak mengeluh pada pola yang benar", () => {
    expect(penandaTidakDikenal(POLA_SPK)).toEqual([]);
    expect(penandaTidakDikenal(POLA_BAST)).toEqual([]);
  });

  it("menangkap salah huruf besar-kecil", () => {
    expect(penandaTidakDikenal("{NOMOR}/SPK/{Bulan}")).toEqual(["{NOMOR}", "{Bulan}"]);
  });

  it("tidak mengulang penanda yang sama", () => {
    expect(penandaTidakDikenal("{NOMOR}/{NOMOR}")).toEqual(["{NOMOR}"]);
  });
});

describe("polaTanpaNomor", () => {
  /**
   * Kejadian nyata: pola pernah terisi angka harfiah, dan pemeriksaan lama
   * meloloskannya karena tidak ada penanda yang SALAH TULIS — memang tidak ada
   * penanda sama sekali. Akibatnya setiap mitra akan menerima nomor identik.
   */
  it("menandai pola berupa nomor harfiah tanpa penanda", () => {
    expect(polaTanpaNomor("097/SPK/FEBRUARI/II/2026")).toBe(true);
    expect(penandaTidakDikenal("097/SPK/FEBRUARI/II/2026")).toEqual([]); // lolos pemeriksaan lama
  });

  it("menandai pola yang punya penanda lain tapi kehilangan {nomor}", () => {
    expect(polaTanpaNomor("SPK/{BULAN}/{ROMAWI}/{tahun}")).toBe(true);
  });

  it("tidak menandai pola yang benar", () => {
    expect(polaTanpaNomor(POLA_SPK)).toBe(false);
    expect(polaTanpaNomor(POLA_BAST)).toBe(false);
  });

  it("menandai pola kosong", () => {
    expect(polaTanpaNomor("")).toBe(true);
    expect(polaTanpaNomor(null as any)).toBe(true);
  });

  it("penanda wajibnya adalah {nomor}", () => {
    expect(PENANDA_WAJIB).toBe("{nomor}");
  });
});
