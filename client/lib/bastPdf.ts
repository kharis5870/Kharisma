/**
 * Surat BAST — Berita Acara Serah Terima Pekerjaan.
 *
 * Menyusul Surat PK: bentuk, margin, dan fontnya sama, tetapi isinya jauh lebih
 * pendek (tanpa pasal) dan tabel lampirannya BERBEDA — tanpa kolom harga, nilai
 * perjanjian, dan beban anggaran, diganti satu kolom keterangan penyelesaian.
 *
 * DUA TANGGAL YANG BERBEDA, jangan tertukar:
 *  - `tanggalBast` menentukan kalimat "Pada hari ini …" dan penanda bulan pada
 *    nomor BAST. Ini tanggal serah terimanya.
 *  - `mitra.tanggalSurat` (tanggal SPK) menentukan frasa "SURVEI BULAN … TAHUN
 *    …" pada kepala BAST maupun kepala lampiran, karena keduanya mengacu ke
 *    periode surveinya dan kepala lampiran mengulang judul SPK verbatim beserta
 *    nomornya. Memakai tanggal BAST di situ akan membuat lampiran menyebut
 *    bulan yang tidak cocok dengan nomor SPK yang tercetak tepat di bawahnya.
 */

import { format } from "date-fns";
import { id as localeID } from "date-fns/locale";
import type { DataKontrakMitra, TemplateSurat } from "@shared/api";
import { muatPdfMake } from "./exportUtils";
import { pastikanFontKontrak, namaFontKontrak } from "./fontKontrak";
import {
  MARGIN_HALAMAN, keDate, jangkaWaktuSingkat, tanggalPanjangTerbilang,
  P, BUTIR, blokTandaTangan, pdfKeBlob, namaBerkasSurat,
  selJudulKolom, selNomorKolom,
} from "./suratPdf";

/** Ukuran huruf tabel lampiran BAST. */
export const FONT_TABEL_LAMPIRAN_BAST = 8;

/** Judul kolom FISIK tabel lampiran BAST, berurutan kiri ke kanan. */
export const JUDUL_KOLOM_BAST = [
  "NO",
  "Uraian Tugas",
  "Jangka Waktu",
  "Volume",
  "Satuan",
  "Apakah Seluruh SLS dan rumah tangga sampel telah selesai di data?",
];

/**
 * Lebar minimum agar JUDUL kolom tidak terpotong di tengah kata.
 *
 * Diukur dari berkas Bookman Old Style **Bold** 8pt yang sesungguhnya
 * (`public/fonts/BookmanOldStyle-Bold.ttf`) memakai fontkit: kata terpanjang
 * tiap judul + padding sel pdfmake 4pt kiri dan 4pt kanan. Turun baris ANTAR
 * kata boleh; yang dilarang adalah kata terpotong di tengah.
 *
 * Kata terpanjang tiap kolom: "NO", "Uraian", "Jangka", "Volume", "Satuan",
 * "Seluruh". ANGKA INI TIDAK BOLEH DIPAKAI ULANG untuk font lain — ukur ulang.
 */
export const LEBAR_MINIMUM_JUDUL_BAST = [21, 36, 38, 40, 37, 41];

/**
 * Lebar minimum agar ISI sel tidak terpotong.
 *
 * Diukur pada Bookman Old Style Regular 8pt untuk nilai terpanjang yang wajar:
 * satuan "Responden" (52pt) dan jangka waktu "2 s.d 31 Januari" (39pt, kata
 * terpanjangnya "Januari"). Nol berarti kolomnya memang boleh turun baris.
 */
export const LEBAR_MINIMUM_ISI_BAST = [18, 0, 39, 28, 52, 13];

/**
 * Lebar kolom lampiran BAST. Kolom "Uraian Tugas" mengambil sisa halaman.
 *
 * Anggaran: A4 (595pt) − margin kiri 60 − margin kanan 50 = 485pt.
 *
 * Kolom terakhir diberi 150pt — jauh di atas minimumnya (41pt) — karena
 * judulnya satu kalimat penuh. Pada lebar minimum ia memang tidak terpotong,
 * tapi akan turun menjadi belasan baris dan membuat kepala tabelnya setinggi
 * setengah halaman.
 *
 *   NO  Uraian  Jangka  Volume  Satuan  Keterangan selesai
 */
export const LEBAR_KOLOM_LAMPIRAN_BAST: (number | string)[] =
  [ 24,   "*",    52,     42,     54,    150 ];

/**
 * Nomor kolom LOGIS pada baris "(1) (2) (3) (4) (5)".
 *
 * Ada LIMA nomor untuk ENAM kolom fisik: nomor (4) menaungi Volume dan Satuan,
 * mengikuti kepala "Target Pekerjaan" di atasnya. Karena itu daftar ini SENGAJA
 * lebih pendek dari `LEBAR_KOLOM_LAMPIRAN_BAST`, dan pola satu-lebar-satu-nomor
 * milik Surat PK (`NOMOR_KOLOM_LAMPIRAN`) tidak boleh dipakai di sini.
 */
export const NOMOR_KOLOM_BAST = [1, 2, 3, 4, 5];

/**
 * Kode yang diisikan pada kolom terakhir lampiran.
 *
 * NILAI TETAP, atas permintaan eksplisit pengguna: "1" berarti Selesai. Ini
 * BUKAN turunan dari progres mitra di `ppl_progress` — jangan "diperbaiki"
 * menjadi perhitungan otomatis tanpa meminta pengguna lebih dulu.
 */
export const KODE_SELESAI = "1";

/**
 * Baris nomor kolom "(1) … (5)".
 *
 * Menghasilkan ENAM sel untuk LIMA nomor: sel keempat ber-colSpan 2 dan diikuti
 * satu sel kosong, sebagaimana pdfmake mengharapkan sel yang ternaungi colSpan.
 * Menyamakan jumlah sel dengan jumlah nomor akan menggeser seluruh tabel satu
 * kolom ke kiri.
 */
export const barisNomorKolomBast = (): any[] => [
  selNomorKolom(1), selNomorKolom(2), selNomorKolom(3),
  selNomorKolom(4, { colSpan: 2 }), {},
  selNomorKolom(5),
];

/** Menyusun docDefinition pdfmake untuk satu Surat BAST. */
export function buatDefinisiBast(
  mitra: DataKontrakMitra,
  template: TemplateSurat,
  tanggalBast: Date,
  namaFont = "Roboto",
): any {
  const nomorBast = mitra.nomorBast ?? "-";
  const nomorSpk = mitra.nomorSurat ?? "-";

  // Periode survei diambil dari tanggal SPK; lihat catatan di kepala berkas.
  const tanggalSpk = keDate(mitra.tanggalSurat) ?? tanggalBast;
  const bulanSurvei = format(tanggalSpk, "MMMM", { locale: localeID }).toUpperCase();
  const tahunSurvei = tanggalSpk.getFullYear();

  const barisLampiran = mitra.baris.map((b, i) => [
    { text: String(i + 1), alignment: "center" },
    { text: b.uraianTugas },
    { text: jangkaWaktuSingkat(b.jangkaWaktuMulai, b.jangkaWaktuSelesai), alignment: "center" },
    { text: String(b.volume ?? ""), alignment: "center" },
    { text: b.satuan || "-", alignment: "center" },
    { text: KODE_SELESAI, alignment: "center" },
  ]);

  /** Satu baris "Label : Nilai" pada blok para pihak. */
  const barisPihak = (label: string, nilai: any, nomor?: string) => ({
    columns: [
      { text: nomor ?? "", width: 14 },
      { text: label, width: 92 },
      { text: ":", width: 10 },
      { text: nilai, width: "*" },
    ],
    margin: [0, 0, 0, 2],
  });

  return {
    pageSize: "A4",
    pageMargins: MARGIN_HALAMAN,
    content: [
      // ---------------- Kepala ----------------
      { text: "BERITA ACARA SERAH TERIMA PEKERJAAN", bold: true, alignment: "center" },
      { text: `PETUGAS KEGIATAN SURVEI BULAN ${bulanSurvei} TAHUN ${tahunSurvei}`, bold: true, alignment: "center" },
      { text: `PADA ${template.satker_nama.toUpperCase()}`, bold: true, alignment: "center" },
      { text: `NOMOR: ${nomorBast}`, bold: true, alignment: "center", margin: [0, 6, 0, 12] },

      // ---------------- Pembuka ----------------
      P(`Pada hari ini ${tanggalPanjangTerbilang(tanggalBast)}, bertempat di Kantor ${template.satker_nama}, dengan alamat ${template.satker_alamat || "-"}, yang bertanda tangan di bawah ini:`),

      // ---------------- Para pihak ----------------
      barisPihak("Nama", template.ppk_nama, "1."),
      barisPihak("Jabatan", template.ppk_jabatan),
      barisPihak("Alamat Kantor", [
        `${template.satker_alamat || "-"}, yang selanjutnya disebut sebagai `,
        { text: "PIHAK PERTAMA", bold: true },
      ]),
      { text: "", margin: [0, 0, 0, 6] },
      barisPihak("Nama", mitra.nama, "2."),
      barisPihak("Pekerjaan", "Mitra BPS"),
      barisPihak("Alamat Rumah", [
        `${mitra.alamat || "-"}, yang selanjutnya disebut sebagai `,
        { text: "PIHAK KEDUA", bold: true },
      ]),
      { text: "", margin: [0, 0, 0, 8] },

      P([
        `Berdasarkan Perjanjian Kerja Nomor ${nomorSpk}, Tanggal `,
        format(tanggalSpk, "d MMMM yyyy", { locale: localeID }),
        " bersama ini ", { text: "PIHAK KEDUA", bold: true },
        " telah menyerahkan pekerjaan di Kabupaten Bengkulu Selatan kepada ",
        { text: "PIHAK PERTAMA", bold: true }, ", dengan ketentuan sebagai berikut:",
      ]),

      BUTIR("1.", [
        "Hasil pekerjaan ", { text: "PIHAK KEDUA", bold: true },
        " telah sesuai dengan jumlah dan kualitas yang ditetapkan dalam Perjanjian Kerja.",
      ], 18),
      BUTIR("2.", [
        "Hasil pekerjaan sebagaimana tersebut pada butir 1 telah diperiksa oleh Pengawas/Pemeriksa dan diterima kelengkapannya oleh ",
        { text: "PIHAK PERTAMA", bold: true }, ".",
      ], 18),

      P("Demikian Berita Acara ini dibuat untuk dipergunakan sebagaimana mestinya.", { margin: [0, 10, 0, 20] }),

      // ---------------- Tanda tangan ----------------
      ...blokTandaTangan({
        jabatanKiri: "Petugas Pendataan,",
        jabatanKanan: template.ppk_jabatan,
        namaKiri: mitra.nama,
        namaKanan: template.ppk_nama,
        nipKanan: template.ppk_nip,
      }),

      // ---------------- Lampiran ----------------
      { text: "", pageBreak: "before" },
      { text: "LAMPIRAN", alignment: "center", margin: [0, 0, 0, 2] },
      { text: `PERJANJIAN KERJA PETUGAS KEGIATAN SURVEI BULAN ${bulanSurvei} TAHUN ${tahunSurvei}`, alignment: "center" },
      { text: `PADA ${template.satker_nama.toUpperCase()}`, alignment: "center" },
      { text: `NOMOR: ${nomorSpk}`, alignment: "center", margin: [0, 0, 0, 14] },
      { text: "DAFTAR URAIAN TUGAS, JANGKA WAKTU, NILAI PERJANJIAN, DAN BEBAN ANGGARAN", bold: true, alignment: "center", margin: [0, 0, 0, 10] },
      {
        table: {
          // 3 baris kepala: judul (2 baris karena rowSpan) + nomor kolom.
          headerRows: 3,
          widths: LEBAR_KOLOM_LAMPIRAN_BAST,
          body: [
            [
              selJudulKolom("NO", { rowSpan: 2 }),
              selJudulKolom("Uraian Tugas", { rowSpan: 2 }),
              selJudulKolom("Jangka Waktu", { rowSpan: 2 }),
              selJudulKolom("Target Pekerjaan", { colSpan: 2 }), {},
              selJudulKolom("Apakah Seluruh SLS dan rumah tangga sampel telah selesai di data?\n1. Selesai\n2. Belum", { rowSpan: 2 }),
            ],
            [{}, {}, {}, selJudulKolom("Volume"), selJudulKolom("Satuan"), {}],
            barisNomorKolomBast(),
            ...barisLampiran,
          ],
        },
        fontSize: FONT_TABEL_LAMPIRAN_BAST,
      },
    ],
    defaultStyle: { font: namaFont, fontSize: 10, lineHeight: 1.15 },
  };
}

/** Nama berkas PDF BAST untuk satu mitra. */
export const namaBerkasBast = (mitra: DataKontrakMitra): string =>
  namaBerkasSurat("BAST", mitra.nomorBast, mitra.nama);

/** Mengunduh Surat BAST satu mitra sebagai berkas PDF. */
export async function unduhBast(mitra: DataKontrakMitra, template: TemplateSurat, tanggalBast: Date): Promise<void> {
  const pdfMake = await muatPdfMake();
  const font = namaFontKontrak(await pastikanFontKontrak(pdfMake));
  pdfMake.createPdf(buatDefinisiBast(mitra, template, tanggalBast, font)).download(namaBerkasBast(mitra));
}

/** Menghasilkan BAST satu mitra sebagai Blob, dipakai saat membungkus ke ZIP. */
export async function bastKeBlob(mitra: DataKontrakMitra, template: TemplateSurat, tanggalBast: Date): Promise<Blob> {
  const pdfMake = await muatPdfMake();
  const font = namaFontKontrak(await pastikanFontKontrak(pdfMake));
  return pdfKeBlob(pdfMake.createPdf(buatDefinisiBast(mitra, template, tanggalBast, font)));
}
