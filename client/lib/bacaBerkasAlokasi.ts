/**
 * Lapisan berkas untuk impor alokasi mitra: templat dan pembacaan `.xlsx`.
 *
 * Dipisah dari `shared/imporAlokasi.ts` dengan alasan yang sama seperti pada
 * impor mitra: modul itu murni dan berisi ATURAN sehingga bisa diuji tanpa
 * berkas, sedangkan berkas ini berisi urusan peramban yang tidak bisa diuji
 * tanpa peramban.
 */

import { unduhBlob } from "@/lib/exportUtils";
import { nilaiSel } from "@/lib/bacaBerkasMitra";
import {
  cariBarisHeaderAlokasi, kolomWajibAlokasiHilang, petakanKolomAlokasi,
  type KolomAlokasi,
} from "@shared/imporAlokasi";

/** Kolom templat, dalam urutan yang paling enak diisi manusia. */
export const KOLOM_TEMPLATE_ALOKASI: { kolom: KolomAlokasi; judul: string; lebar: number }[] = [
  { kolom: 'sobatId', judul: 'SOBAT ID', lebar: 18 },
  { kolom: 'nama', judul: 'Nama Mitra', lebar: 28 },
  { kolom: 'tahap', judul: 'Tahap', lebar: 16 },
  { kolom: 'pml', judul: 'PML', lebar: 24 },
  { kolom: 'bebanKerja', judul: 'Beban Kerja', lebar: 14 },
];

/**
 * Mengunduh templat impor alokasi.
 *
 * Header di BARIS PERTAMA, tanpa baris judul di atasnya: berkas ini dibaca
 * mesin, dan baris judul hanya menambah satu hal yang bisa salah. (Pembacanya
 * tetap mampu melewati baris judul, untuk berkas susunan orang lain.)
 *
 * Dua baris contoh disertakan — satu tahap pendataan, satu pengolahan dengan
 * bulan tertentu — karena satu baris contoh jauh lebih jelas daripada
 * penjelasan tertulis tentang bentuk isian yang diharapkan.
 */
export const unduhTemplateAlokasi = async (namaKegiatan?: string): Promise<void> => {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Alokasi");

  ws.addRow(KOLOM_TEMPLATE_ALOKASI.map(k => k.judul));
  ws.getRow(1).font = { bold: true };
  ws.columns = KOLOM_TEMPLATE_ALOKASI.map(k => ({ width: k.lebar }));

  ws.addRow(["170122030011", "Nama Mitra Contoh", "Listing", "Nama PML Contoh", 32]);
  ws.addRow(["", "Mitra Tanpa ID SOBAT", "Pengolahan", "Nama PML Contoh", 120]);

  // Keterangan ditaruh di lembar KEDUA, bukan di bawah data: baris keterangan
  // yang menempel pada tabel ikut terbaca sebagai baris data ketika berkasnya
  // diunggah kembali.
  const info = wb.addWorksheet("Keterangan");
  info.columns = [{ width: 22 }, { width: 86 }];
  info.addRow(["Kolom", "Penjelasan"]);
  info.getRow(1).font = { bold: true };
  [
    ["SOBAT ID", "Penanda mitra di aplikasi SOBAT. Paling andal — dipakai lebih dulu bila diisi."],
    ["Nama Mitra", "Dipakai bila SOBAT ID kosong. Nama yang dipakai lebih dari satu mitra akan ditolak, bukan ditebak."],
    ["Tahap", "Listing, Pencacahan, atau Pengolahan."],
    ["PML", "Nama PML yang mengawasi. Nama panggilan sudah cukup selama menunjuk satu orang, mis. \"Edianto\" untuk \"Edianto, S.E\". Boleh dikosongkan bila belum ditentukan."],
    ["Beban Kerja", "Bilangan bulat lebih dari nol. Honor dihitung dari beban kerja dikali harga satuan tahapnya."],
    ["", ""],
    ["Harga satuan", "TIDAK diisi di sini — harga adalah setelan per tahap di kegiatannya, bukan milik tiap mitra."],
    ["Bulan & metode pembebanan", "TIDAK diisi di sini — diatur di form, dan hanya ditanyakan bila rentang honor tahapnya melintasi lebih dari satu bulan."],
  ].forEach(baris => info.addRow(baris));

  const isi = await wb.xlsx.writeBuffer();
  const nama = namaKegiatan
    ? `template-alokasi-${namaKegiatan.replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-").toLowerCase()}.xlsx`
    : "template-alokasi-mitra.xlsx";
  unduhBlob(
    new Blob([isi], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
    nama);
};

/**
 * Membaca berkas alokasi menjadi baris-baris sel.
 *
 * LEMBAR MANA YANG DIBACA: bukan selalu yang pertama, dengan alasan yang sama
 * seperti impor mitra — daftar kerja kantor sering hidup di dalam buku kerja
 * berisi puluhan lembar. Yang dipilih adalah lembar dengan kolom dikenali
 * terbanyak.
 */
export const bacaBerkasAlokasi = async (berkas: File): Promise<unknown[][]> => {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(await berkas.arrayBuffer());

  const isiLembar = (ws: { rowCount: number; getRow: (i: number) => { values: unknown } }) => {
    const hasil: unknown[][] = [];
    for (let i = 1; i <= ws.rowCount; i++) {
      const baris = ws.getRow(i);
      const nilai = Array.isArray(baris.values) ? baris.values.slice(1) : [];
      hasil.push(nilai.map(nilaiSel));
    }
    return hasil;
  };

  if (wb.worksheets.length === 0) return [];

  let terbaik: unknown[][] | null = null;
  let skorTerbaik = 0;
  for (const ws of wb.worksheets) {
    const baris = isiLembar(ws);
    const iHeader = cariBarisHeaderAlokasi(baris);
    if (iHeader < 0) continue;
    const peta = petakanKolomAlokasi(baris[iHeader]);
    if (kolomWajibAlokasiHilang(peta).length > 0) continue;
    const skor = (Object.keys(peta) as KolomAlokasi[]).filter(k => peta[k] !== null).length;
    if (skor > skorTerbaik) {
      skorTerbaik = skor;
      terbaik = baris;
    }
  }

  return terbaik ?? isiLembar(wb.worksheets[0]);
};
