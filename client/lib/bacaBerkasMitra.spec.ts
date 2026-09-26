import { describe, it, expect } from "vitest";
import ExcelJS from "exceljs";
import { bacaBerkasMitra } from "./bacaBerkasMitra";
import { cariBarisHeader, petakanKolom } from "@shared/imporMitra";

/**
 * Pemilihan lembar saat membaca berkas `.xlsx` mitra.
 *
 * Daftar mitra kantor ini tidak berdiri sendiri: ia satu lembar di dalam buku
 * kerja berisi puluhan lembar lain (surat tugas, SPD, visum, kamus kode), dan
 * letaknya jauh dari lembar pertama. Membaca lembar pertama begitu saja membuat
 * berkas yang sah ditolak dengan pesan "kolom nama tidak ditemukan".
 */

const HEADER_PALAPA = ["Email", "SOBAT ID", "Nama Lengkap", "Alamat Detail", "Alamat Kec",
  "Alamat Desa", "Jenis Kelamin", "No Telp", "NPWP", "POSISI DITERIMA", "STATUS", "Catatan"];

const BARIS_PALAPA = ["afzumarni@contoh.id", "170123110117", "AFZUMARNI",
  "Prumnas Kayu Kunyit No.128", "040", "033", "2", "+62 823-7404-1702", "",
  "Mitra (Pendataan dan Pengolahan)", "Diterima", ""];

/** Menyusun buku kerja di memori, lalu membungkusnya sebagai File. */
const buatBerkas = async (
  lembar: { nama: string; baris: unknown[][] }[],
): Promise<File> => {
  const wb = new ExcelJS.Workbook();
  for (const l of lembar) {
    const ws = wb.addWorksheet(l.nama);
    l.baris.forEach(b => ws.addRow(b));
  }
  const isi = await wb.xlsx.writeBuffer();
  return new File([isi], "uji.xlsx", {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
};

describe("bacaBerkasMitra", () => {
  it("menemukan lembar mitra walau bukan lembar pertama", async () => {
    const berkas = await buatBerkas([
      { nama: "ST", baris: [["YTH. KARYAWAN/ WATI"], ["JANGAN MERUSAK LINK EXCEL INI"]] },
      { nama: "Kamus Kode", baris: [["KODE POKOK", "KELOMPOK"], ["KA", "KEARSIPAN"]] },
      { nama: "Mitra", baris: [HEADER_PALAPA, BARIS_PALAPA] },
      { nama: "Visum", baris: [["Tanggal", "Tujuan"], ["2026-09-01", "Manna"]] },
    ]);

    const baris = await bacaBerkasMitra(berkas);
    const iHeader = cariBarisHeader(baris);
    expect(iHeader).toBe(0);
    expect(baris[iHeader][2]).toBe("Nama Lengkap");
    expect(baris[1][2]).toBe("AFZUMARNI");
  });

  it("berkas berlembar satu dibaca seperti sebelumnya", async () => {
    const berkas = await buatBerkas([{ nama: "Mitra", baris: [HEADER_PALAPA, BARIS_PALAPA] }]);
    const baris = await bacaBerkasMitra(berkas);
    expect(petakanKolom(baris[0]).nama).toBe(2);
    expect(baris).toHaveLength(2);
  });

  it("memilih lembar dengan kolom dikenali terbanyak", async () => {
    // Lembar pertama punya kolom wajib (nama) tapi tidak lebih dari itu;
    // lembar kedua daftar mitra sungguhan.
    const berkas = await buatBerkas([
      { nama: "Daftar Nama", baris: [["Nama"], ["Seseorang"]] },
      { nama: "Mitra", baris: [HEADER_PALAPA, BARIS_PALAPA] },
    ]);

    const baris = await bacaBerkasMitra(berkas);
    expect(baris[0]).toContain("POSISI DITERIMA");
  });

  it("tidak ada lembar yang dikenali: lembar pertama dikembalikan apa adanya", async () => {
    // Supaya layar pemetaan kolom manual tetap punya sesuatu untuk ditawarkan,
    // bukan tabel kosong tanpa penjelasan.
    const berkas = await buatBerkas([
      { nama: "Acak", baris: [["Kolom A", "Kolom B"], ["1", "2"]] },
      { nama: "Lain", baris: [["X"], ["9"]] },
    ]);

    const baris = await bacaBerkasMitra(berkas);
    expect(baris[0]).toEqual(["Kolom A", "Kolom B"]);
  });
});
