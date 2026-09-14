/**
 * Lapisan berkas untuk impor mitra: membuat template dan membaca `.xlsx`.
 *
 * Sengaja dipisah dari `shared/imporMitra.ts`. Modul itu murni dan berisi
 * ATURAN (kolom mana artinya apa, baris mana orang yang mana) sehingga bisa
 * diuji tanpa berkas; berkas ini berisi urusan peramban — membaca File dan
 * memicu unduhan — yang tidak bisa diuji tanpa peramban.
 *
 * exceljs dimuat saat dibutuhkan saja (`await import`), mengikuti pola
 * `exportUtils.ts`: pustakanya besar dan tidak pantas membebani orang yang
 * tidak pernah mengimpor apa pun.
 */

import { unduhBlob } from "@/lib/exportUtils";
import { ALIAS_KOLOM, type KolomMitra } from "@shared/imporMitra";

/** Judul kolom pada template, dalam urutan yang paling enak dibaca manusia. */
export const KOLOM_TEMPLATE: { kolom: KolomMitra; judul: string }[] = [
  { kolom: 'sobatId', judul: 'ID SOBAT' },
  { kolom: 'nama', judul: 'Nama' },
  { kolom: 'posisi', judul: 'Posisi' },
  { kolom: 'alamat', judul: 'Alamat' },
  { kolom: 'telepon', judul: 'No HP' },
  { kolom: 'kecamatan', judul: 'Kecamatan' },
  { kolom: 'desa', judul: 'Desa' },
];

/**
 * Mengunduh template impor.
 *
 * Headernya diletakkan di BARIS PERTAMA tanpa baris judul di atasnya. Berkas
 * ekspor lain di aplikasi ini memakai baris judul, dan itu wajar untuk berkas
 * yang dibaca manusia — tetapi berkas ini dibaca mesin, dan menaruh judul di
 * atasnya hanya menambah satu hal yang bisa salah. (Pembacanya tetap mampu
 * melewati baris judul, untuk berkas dari SOBAT yang memakainya.)
 */
export const unduhTemplateMitra = async (): Promise<void> => {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Mitra");

  ws.addRow(KOLOM_TEMPLATE.map(k => k.judul));
  ws.getRow(1).font = { bold: true };
  ws.columns = KOLOM_TEMPLATE.map(k => ({ width: Math.max(14, k.judul.length + 4) }));

  // Satu baris contoh: jauh lebih jelas daripada penjelasan tertulis tentang
  // bentuk isian yang diharapkan.
  ws.addRow(["SB-001", "Nama Mitra Contoh", "Pendataan", "Jl. Contoh No. 1", "081234567890", "Kota Manna", "Padang Sialang"]);

  const isi = await wb.xlsx.writeBuffer();
  unduhBlob(new Blob([isi], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
    "template-impor-mitra.xlsx");
};

/**
 * Mengubah satu sel exceljs menjadi teks biasa.
 *
 * Sel `.xlsx` tidak selalu berisi teks: ada hasil rumus, teks berformat
 * (richText), tautan, dan tanggal. Tanpa penanganan ini semuanya menjadi
 * "[object Object]" — dan yang paling berbahaya, itu terbaca sebagai NAMA yang
 * sah sehingga mitra bernama "[object Object]" masuk ke database tanpa galat.
 */
export const nilaiSel = (sel: unknown): string => {
  if (sel === null || sel === undefined) return '';
  if (typeof sel === 'string' || typeof sel === 'number' || typeof sel === 'boolean') {
    return String(sel);
  }
  if (sel instanceof Date) return sel.toISOString().slice(0, 10);

  const obj = sel as Record<string, unknown>;
  if (Array.isArray(obj.richText)) {
    return (obj.richText as { text?: string }[]).map(r => r.text ?? '').join('');
  }
  if ('result' in obj) return nilaiSel(obj.result);
  if ('text' in obj) return nilaiSel(obj.text);
  if ('hyperlink' in obj) return nilaiSel(obj.hyperlink);
  return '';
};

/**
 * Membaca lembar pertama sebuah berkas `.xlsx` menjadi larik baris.
 *
 * Baris kosong TETAP disertakan supaya nomor baris yang dilaporkan ke pengguna
 * sama dengan nomor baris yang ia lihat di Excel. Menghapusnya di sini akan
 * membuat pesan "baris 12 bermasalah" menunjuk baris yang berbeda.
 */
export const bacaBerkasMitra = async (berkas: File): Promise<unknown[][]> => {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(await berkas.arrayBuffer());

  const ws = wb.worksheets[0];
  if (!ws) return [];

  const hasil: unknown[][] = [];
  for (let i = 1; i <= ws.rowCount; i++) {
    const baris = ws.getRow(i);
    // `row.values` berbasis 1 dan menyisakan satu slot kosong di depan.
    const nilai = Array.isArray(baris.values) ? baris.values.slice(1) : [];
    hasil.push(nilai.map(nilaiSel));
  }
  return hasil;
};

/** Judul kolom yang dikenali, untuk ditawarkan di layar pemetaan manual. */
export const contohAlias = (kolom: KolomMitra): string =>
  ALIAS_KOLOM[kolom].slice(0, 3).join(", ");
