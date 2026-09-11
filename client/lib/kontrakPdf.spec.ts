import { describe, it, expect } from "vitest";
import {
  LEBAR_KOLOM_LAMPIRAN,
  LEBAR_MINIMUM_JUDUL_LAMPIRAN,
  LEBAR_MINIMUM_ISI_LAMPIRAN,
  NOMOR_KOLOM_LAMPIRAN,
  FONT_TABEL_LAMPIRAN,
  barisNomorKolomLampiran,
  buatDefinisiKontrak,
} from "./kontrakPdf";

/**
 * Lebar kolom tabel lampiran Surat PK.
 *
 * Nilai minimum di bawah diukur dari berkas font **Bookman Old Style** yang
 * sesungguhnya pada 8pt (kata terpanjang tiap judul + padding sel pdfmake 4pt
 * kiri & kanan). Bookman sekitar 10% lebih lebar dari Roboto yang dipakai
 * sebelumnya, jadi angkanya sudah diukur ulang — mengganti font lagi berarti
 * mengukur ulang lagi, bukan memakai angka ini.
 *
 * Turun baris ANTAR kata boleh; yang dilarang adalah kata terpotong di tengah —
 * itulah keluhan aslinya: huruf "e" pada "Volume" jatuh ke baris kedua karena
 * kolomnya hanya 26pt padahal butuh 40pt.
 */

const JUDUL = ['NO', 'Uraian Tugas', 'Jangka Waktu', 'Volume', 'Satuan',
  'Harga Satuan', 'Nilai Perjanjian', 'Beban Anggaran'];

/** A4 = 595pt, margin kiri 60 + kanan 50. */
const LEBAR_TERSEDIA = 595 - 60 - 50;

describe("lebar kolom lampiran Surat PK", () => {
  it("jumlah kolom cocok dengan jumlah judul", () => {
    expect(LEBAR_KOLOM_LAMPIRAN).toHaveLength(JUDUL.length);
    expect(LEBAR_MINIMUM_JUDUL_LAMPIRAN).toHaveLength(JUDUL.length);
    expect(LEBAR_MINIMUM_ISI_LAMPIRAN).toHaveLength(JUDUL.length);
  });

  it("tepat satu kolom fleksibel, yaitu Uraian Tugas", () => {
    const fleksibel = LEBAR_KOLOM_LAMPIRAN
      .map((w, i) => (w === "*" ? i : -1))
      .filter(i => i >= 0);
    expect(fleksibel).toEqual([1]);
  });

  // Inti regresinya.
  it("tiap judul kolom muat tanpa kata terpotong", () => {
    LEBAR_KOLOM_LAMPIRAN.forEach((lebar, i) => {
      if (lebar === "*") return; // kolom fleksibel selalu cukup
      expect(
        lebar as number,
        `Kolom "${JUDUL[i]}" hanya ${lebar}pt, judulnya butuh ${LEBAR_MINIMUM_JUDUL_LAMPIRAN[i]}pt di Bookman — katanya akan terpotong di tengah`,
      ).toBeGreaterThanOrEqual(LEBAR_MINIMUM_JUDUL_LAMPIRAN[i]);
    });
  });

  // Judul yang muat belum tentu cukup untuk isinya: "Responden" lebih panjang
  // dari "Satuan", dan "12.000.000" lebih panjang dari "Nilai".
  it("isi sel juga muat, bukan hanya judulnya", () => {
    LEBAR_KOLOM_LAMPIRAN.forEach((lebar, i) => {
      if (lebar === "*") return;
      expect(
        lebar as number,
        `Kolom "${JUDUL[i]}" hanya ${lebar}pt, isinya butuh ${LEBAR_MINIMUM_ISI_LAMPIRAN[i]}pt di Bookman`,
      ).toBeGreaterThanOrEqual(LEBAR_MINIMUM_ISI_LAMPIRAN[i]);
    });
  });

  it("kolom Volume dan NO — dua yang dulu terpotong — kini cukup untuk Bookman", () => {
    expect(LEBAR_KOLOM_LAMPIRAN[3]).toBeGreaterThanOrEqual(40); // Volume
    expect(LEBAR_KOLOM_LAMPIRAN[0]).toBeGreaterThanOrEqual(21); // NO
  });

  it("total lebar tetap sesuai halaman, dengan sisa memadai untuk Uraian Tugas", () => {
    const tetap = LEBAR_KOLOM_LAMPIRAN
      .filter((w): w is number => typeof w === "number")
      .reduce((a, b) => a + b, 0);
    const sisaUntukUraian = LEBAR_TERSEDIA - tetap;
    expect(tetap).toBeLessThan(LEBAR_TERSEDIA);
    // Uraian tugas berisi kalimat, jadi butuh ruang jauh lebih lega.
    expect(sisaUntukUraian).toBeGreaterThanOrEqual(120);
  });

  // Memperbesar huruf tanpa memperbesar kolom akan memunculkan lagi bug yang sama.
  it("ukuran huruf tabel tidak berubah tanpa mengukur ulang", () => {
    expect(FONT_TABEL_LAMPIRAN).toBe(8);
  });
});

/**
 * Nomor kolom TIDAK satu-lawan-satu dengan kolom fisiknya: (4) menaungi Volume
 * dan Satuan, mengikuti kepala "Target Pekerjaan" di atasnya — sama seperti
 * lampiran BAST. Dulu keduanya bernomor sendiri, (4) dan (5), sehingga tidak
 * cocok dengan format surat yang dipakai kantor.
 */
describe("baris nomor kolom (1)…(7)", () => {
  const baris = barisNomorKolomLampiran();

  it("daftar nomor logis lebih pendek dari daftar kolom fisik", () => {
    expect(NOMOR_KOLOM_LAMPIRAN).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(NOMOR_KOLOM_LAMPIRAN.length).toBe(LEBAR_KOLOM_LAMPIRAN.length - 1);
  });

  it("menghasilkan satu sel untuk setiap kolom fisik", () => {
    expect(baris).toHaveLength(LEBAR_KOLOM_LAMPIRAN.length);
  });

  // Aturan pdfmake: sel ber-colSpan n harus diikuti n-1 sel penampung kosong,
  // dan penampung itu tetap dihitung sebagai sel.
  it("tiap sel ber-colSpan diikuti sel penampung kosong", () => {
    baris.forEach((sel: any, i: number) => {
      const span = sel?.colSpan ?? 1;
      for (let j = 1; j < span; j++) {
        expect(baris[i + j], `penampung setelah sel ke-${i}`).toEqual({});
      }
    });
  });

  it("nomor yang terlihat persis (1) sampai (7)", () => {
    const terlihat = baris.map((s: any) => s?.text).filter(Boolean);
    expect(terlihat).toEqual(["(1)", "(2)", "(3)", "(4)", "(5)", "(6)", "(7)"]);
  });

  it("nomor (4) menaungi Volume dan Satuan", () => {
    expect(baris[3].colSpan).toBe(2);
    expect(baris[4]).toEqual({});
  });
});

/**
 * Kepala tabel lampiran SENGAJA dibiarkan rata atas.
 *
 * `verticalAlignment: "middle"` sempat dipasang agar judul kolom tidak
 * menggantung di atas kotak. Properti itu memang ada di pdfmake 0.3 dan memang
 * mengubah keluaran PDF — tapi pada sel ber-`rowSpan` ia menggeser teksnya
 * KELUAR dari kotak: judul kolom melayang di atas garis tabel dan menabrak
 * judul lampiran. Dikembalikan, dan tes ini menjaganya agar tidak dipasang lagi
 * tanpa memeriksa hasil cetaknya lebih dulu.
 */
describe("kepala tabel lampiran tidak memakai perataan vertikal", () => {
  const mitra: any = {
    pplMasterId: "PPL001", nama: "Uji Coba", alamat: "Alamat",
    totalHonor: 100000, nomorSurat: "001/SPK/SEPTEMBER/IX/2026", tanggalSurat: "2026-09-01",
    jangkaWaktuMulai: "2026-09-01", jangkaWaktuSelesai: "2026-09-30",
    baris: [{
      uraianTugas: "Uraian", jangkaWaktuMulai: "2026-09-01", jangkaWaktuSelesai: "2026-09-30",
      volume: 1, satuan: "Dokumen", hargaSatuan: 100000, nilaiPerjanjian: 100000, kodeAnggaran: "X",
    }],
  };
  const template: any = {
    id: 1, ppk_nama: "PPK", ppk_nip: "1", ppk_jabatan: "Jabatan",
    satker_nama: "Satker", satker_alamat: "Alamat", pengadilan_negeri: "PN",
  };

  const tabel = (() => {
    const def = buatDefinisiKontrak(mitra, template, new Date("2026-09-01T00:00:00"));
    const node = def.content.find((n: any) => n?.table?.headerRows === 3);
    return node.table;
  })();

  it("tidak ada sel judul yang memakai verticalAlignment", () => {
    for (const barisKepala of [tabel.body[0], tabel.body[1]]) {
      for (const sel of barisKepala) {
        if (sel?.text === undefined) continue;
        expect(sel.verticalAlignment, `sel "${sel.text}"`).toBeUndefined();
      }
    }
  });

  // pdfmake mengharapkan sel yang ternaungi rowSpan/colSpan benar-benar kosong.
  it("sel penampung tetap kosong polos", () => {
    for (const barisKepala of [tabel.body[0], tabel.body[1]]) {
      for (const sel of barisKepala) {
        if (sel?.text === undefined) expect(sel).toEqual({});
      }
    }
  });

  it("baris data juga tidak memakainya", () => {
    // body[0..2] kepala; body[3] baris data pertama.
    for (const sel of tabel.body[3]) {
      expect(sel.verticalAlignment).toBeUndefined();
    }
  });
});
