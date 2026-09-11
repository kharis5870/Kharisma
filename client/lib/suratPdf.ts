/**
 * Bagian yang benar-benar sama antara Surat PK dan Surat BAST.
 *
 * Dipindahkan ke sini dari `kontrakPdf.ts` saat BAST dibuat — bukan disalin.
 * Yang diangkat hanya yang bentuknya IDENTIK di kedua surat dan memang harus
 * tetap identik: kalau gaya penulisan tanggal berubah, ia harus berubah di
 * keduanya sekaligus.
 *
 * Yang SENGAJA tidak diangkat: pembangun tabel lampiran (jumlah kolom, colSpan,
 * dan baris totalnya berbeda) serta blok "para pihak" (Surat PK memakai kalimat
 * mengalir, BAST memakai daftar berlabel). Menyatukan keduanya butuh objek
 * konfigurasi dengan lebih banyak cabang daripada nilai dua pemanggilnya.
 */

import { format, parse, isValid } from "date-fns";
import { id as localeID } from "date-fns/locale";
import { terbilang } from "./terbilang";

const HARI = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

/** A4 = 595pt. Margin kiri 60, kanan 50 -> 485pt tersisa untuk isi. */
export const MARGIN_HALAMAN: [number, number, number, number] = [60, 50, 50, 50];
export const LEBAR_ISI_HALAMAN = 595 - 60 - 50;

export const keDate = (nilai?: string | null): Date | undefined => {
  if (!nilai) return undefined;
  const d = parse(nilai, "yyyy-MM-dd", new Date());
  return isValid(d) ? d : undefined;
};

/** "2 s.d 28 Februari" — gaya penulisan jangka waktu pada lampiran kedua surat. */
export const jangkaWaktuSingkat = (mulai?: string | null, selesai?: string | null): string => {
  const a = keDate(mulai);
  const b = keDate(selesai);
  if (!a || !b) return "-";
  const bulanSama = a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
  return bulanSama
    ? `${a.getDate()} s.d ${b.getDate()} ${format(b, "MMMM", { locale: localeID })}`
    : `${format(a, "d MMMM", { locale: localeID })} s.d ${format(b, "d MMMM", { locale: localeID })}`;
};

/** "Senin, Tanggal Dua, Bulan Februari Tahun Dua Ribu Dua Puluh Enam" */
export const tanggalPanjangTerbilang = (tanggal: Date): string => {
  const hari = HARI[tanggal.getDay()];
  const namaBulan = format(tanggal, "MMMM", { locale: localeID });
  return `${hari}, Tanggal ${terbilang(tanggal.getDate())}, Bulan ${namaBulan} Tahun ${terbilang(tanggal.getFullYear())}`;
};

/** Paragraf rata kiri-kanan dengan jarak bawah standar surat. */
export const P = (teks: any, opsi: Record<string, any> = {}) =>
  ({ text: teks, alignment: "justify", margin: [0, 0, 0, 6], ...opsi });

/**
 * Satu butir bernomor dengan indentasi menggantung.
 *
 * Surat PK memakainya untuk ayat "(1)" (lebar 22), BAST untuk butir "1."
 * (lebar 18) — hanya lebar nomornya yang berbeda.
 */
export const BUTIR = (nomor: string, isi: any, lebarNomor = 22) => ({
  columns: [
    { text: nomor, width: lebarNomor },
    { text: isi, width: "*", alignment: "justify" },
  ],
  margin: [0, 0, 0, 5],
});

/**
 * Sel judul kepala tabel lampiran.
 *
 * JANGAN menambahkan `verticalAlignment: "middle"` di sini. Properti itu memang
 * ada di pdfmake 0.3 dan memang mengubah keluaran PDF, tetapi pada sel
 * ber-`rowSpan` ia menggeser teksnya KELUAR dari kotak — judul kolom melayang
 * di atas garis tabel dan menabrak judul lampiran di atasnya. Sudah dicoba dan
 * dikembalikan; teks kepala yang menempel ke atas kotak jauh lebih baik
 * daripada teks yang keluar dari kotaknya.
 */
export const selJudulKolom = (teks: string, opsi: Record<string, any> = {}) =>
  ({ text: teks, bold: true, alignment: "center", ...opsi });

/**
 * Sel "(n)" pada baris nomor kolom di bawah judul.
 *
 * Tidak ditengahkan vertikal: barisnya hanya setinggi satu baris teks, jadi
 * tidak ada ruang untuk ditengahkan.
 */
export const selNomorKolom = (n: number, opsi: Record<string, any> = {}) =>
  ({ text: `(${n})`, alignment: "center", italics: true, fontSize: 7, ...opsi });

/**
 * Blok tanda tangan dua kolom. Bentuknya sama persis di kedua surat: pihak
 * kedua di kiri, PPK di kanan lengkap dengan NIP, dipisah ruang tanda tangan.
 */
export const blokTandaTangan = (opsi: {
  jabatanKiri: string;
  jabatanKanan: string;
  namaKiri: string;
  namaKanan: string;
  nipKanan: string;
}) => [
  {
    columns: [
      { width: "*", stack: [{ text: "PIHAK KEDUA", alignment: "center" }, { text: opsi.jabatanKiri, alignment: "center" }] },
      { width: "*", stack: [{ text: "PIHAK PERTAMA", alignment: "center" }, { text: opsi.jabatanKanan, alignment: "center" }] },
    ],
  },
  {
    columns: [
      { width: "*", stack: [{ text: opsi.namaKiri, alignment: "center" }] },
      { width: "*", stack: [{ text: opsi.namaKanan, alignment: "center" }, { text: opsi.nipKanan, alignment: "center" }] },
    ],
    margin: [0, 70, 0, 0],
  },
];

/**
 * Mengubah dokumen pdfmake menjadi Blob.
 *
 * pdfmake 0.3 mengembalikan Promise dan MENGABAIKAN callback; 0.2 sebaliknya.
 * Sekali panggil, keduanya tertangani tanpa merender PDF dua kali. Perilaku ini
 * sudah pernah diselidiki sekali — jangan diturunkan ulang di berkas kedua.
 */
export const pdfKeBlob = (dokumen: any): Promise<Blob> =>
  new Promise<Blob>((resolve, reject) => {
    try {
      const mungkinPromise = dokumen.getBlob(resolve);
      if (mungkinPromise && typeof mungkinPromise.then === "function") {
        mungkinPromise.then(resolve, reject);
      }
    } catch (error) {
      reject(error);
    }
  });

/** Nama berkas PDF yang aman dipakai di sistem berkas mana pun. */
export const namaBerkasSurat = (awalan: string, nomor: string | undefined, namaMitra: string): string => {
  const n = (nomor || "tanpa-nomor").replace(/\//g, "-");
  const nama = namaMitra.replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "_");
  return `${awalan}_${n}_${nama}.pdf`;
};
