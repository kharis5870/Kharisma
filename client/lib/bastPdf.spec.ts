import { describe, it, expect } from "vitest";
import {
  LEBAR_KOLOM_LAMPIRAN_BAST,
  LEBAR_MINIMUM_JUDUL_BAST,
  LEBAR_MINIMUM_ISI_BAST,
  NOMOR_KOLOM_BAST,
  JUDUL_KOLOM_BAST,
  FONT_TABEL_LAMPIRAN_BAST,
  KODE_SELESAI,
  barisNomorKolomBast,
} from "./bastPdf";

/**
 * Lebar kolom lampiran BAST.
 *
 * Minimumnya diukur dari berkas Bookman Old Style yang sesungguhnya pada 8pt
 * memakai fontkit — bukan ditebak. Mengganti font berarti mengukur ulang.
 */

/** A4 = 595pt, margin kiri 60 + kanan 50. */
const LEBAR_TERSEDIA = 595 - 60 - 50;

describe("lebar kolom lampiran BAST", () => {
  it("jumlah kolom cocok di ketiga daftar", () => {
    expect(LEBAR_KOLOM_LAMPIRAN_BAST).toHaveLength(JUDUL_KOLOM_BAST.length);
    expect(LEBAR_MINIMUM_JUDUL_BAST).toHaveLength(JUDUL_KOLOM_BAST.length);
    expect(LEBAR_MINIMUM_ISI_BAST).toHaveLength(JUDUL_KOLOM_BAST.length);
  });

  it("tepat satu kolom fleksibel, yaitu Uraian Tugas", () => {
    const fleksibel = LEBAR_KOLOM_LAMPIRAN_BAST
      .map((w, i) => (w === "*" ? i : -1))
      .filter(i => i >= 0);
    expect(fleksibel).toEqual([1]);
  });

  it("tiap judul kolom muat tanpa kata terpotong", () => {
    LEBAR_KOLOM_LAMPIRAN_BAST.forEach((lebar, i) => {
      if (lebar === "*") return;
      expect(
        lebar as number,
        `Kolom "${JUDUL_KOLOM_BAST[i]}" hanya ${lebar}pt, judulnya butuh ${LEBAR_MINIMUM_JUDUL_BAST[i]}pt di Bookman`,
      ).toBeGreaterThanOrEqual(LEBAR_MINIMUM_JUDUL_BAST[i]);
    });
  });

  // Judul yang muat belum tentu cukup untuk isinya: "Responden" lebih panjang
  // dari judul "Satuan".
  it("isi sel juga muat, bukan hanya judulnya", () => {
    LEBAR_KOLOM_LAMPIRAN_BAST.forEach((lebar, i) => {
      if (lebar === "*") return;
      expect(
        lebar as number,
        `Kolom "${JUDUL_KOLOM_BAST[i]}" hanya ${lebar}pt, isinya butuh ${LEBAR_MINIMUM_ISI_BAST[i]}pt`,
      ).toBeGreaterThanOrEqual(LEBAR_MINIMUM_ISI_BAST[i]);
    });
  });

  it("total lebar sesuai halaman, dengan sisa memadai untuk Uraian Tugas", () => {
    const tetap = LEBAR_KOLOM_LAMPIRAN_BAST
      .filter((w): w is number => typeof w === "number")
      .reduce((a, b) => a + b, 0);
    const sisaUntukUraian = LEBAR_TERSEDIA - tetap;
    expect(tetap).toBeLessThan(LEBAR_TERSEDIA);
    expect(sisaUntukUraian).toBeGreaterThanOrEqual(120);
  });

  // Kolom terakhir judulnya satu kalimat penuh; pada lebar minimum ia memang
  // tidak terpotong, tapi kepala tabelnya jadi setinggi setengah halaman.
  it("kolom keterangan cukup lega untuk judul sepanjang kalimat", () => {
    expect(LEBAR_KOLOM_LAMPIRAN_BAST[5]).toBeGreaterThanOrEqual(120);
  });

  it("ukuran huruf tabel tidak berubah tanpa mengukur ulang", () => {
    expect(FONT_TABEL_LAMPIRAN_BAST).toBe(8);
  });
});

/**
 * Inti regresi tabel BAST. Berbeda dari Surat PK, nomor kolomnya TIDAK
 * satu-lawan-satu dengan lebarnya: (4) menaungi Volume dan Satuan.
 */
describe("baris nomor kolom (1)…(5)", () => {
  const baris = barisNomorKolomBast();

  it("menghasilkan satu sel untuk setiap kolom fisik", () => {
    expect(baris).toHaveLength(LEBAR_KOLOM_LAMPIRAN_BAST.length);
  });

  // Aturan pdfmake: sel ber-colSpan n HARUS diikuti n-1 sel penampung kosong,
  // dan penampung itu tetap dihitung sebagai sel. Jadi yang harus cocok adalah
  // JUMLAH SEL dengan jumlah kolom — bukan jumlah colSpan, yang akan
  // menghitung ganda karena penampungnya ikut terhitung.
  it("tiap sel ber-colSpan diikuti sel penampung kosong sebanyak yang dinaunginya", () => {
    baris.forEach((sel: any, i: number) => {
      const span = sel?.colSpan ?? 1;
      for (let j = 1; j < span; j++) {
        expect(baris[i + j], `penampung setelah sel ke-${i}`).toEqual({});
      }
    });
  });

  it("nomor yang terlihat persis (1) sampai (5)", () => {
    const terlihat = baris.map((s: any) => s?.text).filter(Boolean);
    expect(terlihat).toEqual(["(1)", "(2)", "(3)", "(4)", "(5)"]);
  });

  it("nomor (4) menaungi dua kolom dan diikuti sel kosong", () => {
    expect(baris[3].colSpan).toBe(2);
    expect(baris[4]).toEqual({});
  });

  // Kalau daftar nomor logis disamakan panjangnya dengan daftar lebar, seluruh
  // tabel bergeser satu kolom.
  it("daftar nomor logis lebih pendek dari daftar kolom fisik", () => {
    expect(NOMOR_KOLOM_BAST).toEqual([1, 2, 3, 4, 5]);
    expect(NOMOR_KOLOM_BAST.length).toBe(LEBAR_KOLOM_LAMPIRAN_BAST.length - 1);
  });
});

describe("kode kolom keterangan", () => {
  // Nilai tetap atas permintaan pengguna, bukan turunan progres mitra.
  it("selalu 1 (Selesai)", () => {
    expect(KODE_SELESAI).toBe("1");
  });
});
