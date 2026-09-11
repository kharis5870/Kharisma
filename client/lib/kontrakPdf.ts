import { format } from "date-fns";
import { id as localeID } from "date-fns/locale";
import type { DataKontrakMitra, TemplateSurat } from "@shared/api";
import { terbilangRupiah, formatRupiah } from "./terbilang";
// pdfmake dimuat dinamis lewat helper ini agar tidak membebani muatan awal.
import { muatPdfMake } from "./exportUtils";
import { pastikanFontKontrak, namaFontKontrak } from "./fontKontrak";
// Helper yang dipakai bersama Surat BAST. Perubahan di sini ikut terasa di
// kedua surat — itu memang tujuannya.
import {
  MARGIN_HALAMAN, jangkaWaktuSingkat, tanggalPanjangTerbilang,
  P, BUTIR, blokTandaTangan, pdfKeBlob, namaBerkasSurat,
  selJudulKolom, selNomorKolom,
} from "./suratPdf";

const JUDUL_PASAL = (nomor: string) => ({ text: nomor, bold: true, alignment: "center", margin: [0, 8, 0, 6] });

/** Ayat bernomor "(1) ..." pada pasal-pasal Surat PK. */
const AYAT = (nomor: string, isi: any) => BUTIR(nomor, isi, 22);


/**
 * Menyusun docDefinition pdfmake untuk satu Surat Perjanjian Kerja, mengikuti
 * format Surat PK BPS Kabupaten Bengkulu Selatan: Pasal 1-12 lalu lampiran
 * berisi tabel uraian tugas.
 */
/** Ukuran huruf tabel lampiran Surat PK. */
export const FONT_TABEL_LAMPIRAN = 8;

/**
 * Lebar minimum tiap kolom lampiran, dalam poin.
 *
 * Diukur dari berkas font Bookman Old Style Bold yang sesungguhnya pada 8pt,
 * memakai KATA TERPANJANG di tiap judul ditambah padding sel pdfmake (4pt
 * kiri + 4pt kanan). Turun baris ANTAR kata tidak masalah; yang dilarang
 * adalah kata terpotong di tengah.
 *
 * Ini yang menyebabkan keluhan "huruf e pada Volume jatuh ke baris kedua":
 * kolom Volume dulu 26pt padahal kata itu butuh 40pt di Bookman. Kolom NO
 * juga terpotong. Bookman sekitar 10% lebih lebar dari Roboto, jadi angka di
 * sini TIDAK boleh dipakai ulang kalau fontnya diganti lagi — ukur ulang.
 */
export const LEBAR_MINIMUM_JUDUL_LAMPIRAN = [21, 0, 38, 40, 37, 37, 51, 47];

/**
 * Lebar minimum agar ISI sel tidak terpotong, bukan hanya judulnya.
 *
 * Diukur pada Bookman Old Style biasa 8pt untuk nilai terpanjang yang wajar:
 * satuan "Responden" (52pt), harga "1.200.000" (48pt), nilai "12.000.000"
 * (53pt). Nol berarti kolomnya boleh turun baris (frasa, bukan satu kata).
 */
export const LEBAR_MINIMUM_ISI_LAMPIRAN = [0, 0, 0, 31, 52, 48, 53, 0];

/**
 * Lebar kolom lampiran. Kolom kedua "*" mengambil sisa lebar halaman, jadi
 * menambah angka di sini otomatis mempersempit kolom Uraian Tugas.
 *
 * Anggaran lebar: A4 (595pt) − margin kiri 60 − margin kanan 50 = 485pt.
 *
 *   NO  Uraian  Jangka  Volume  Satuan  Harga  Nilai  Beban
 */
export const LEBAR_KOLOM_LAMPIRAN: (number | string)[] =
  [ 24,   "*",    52,     42,     54,     52,    58,    58 ];

/**
 * Nomor kolom LOGIS pada baris "(1) … (7)" di bawah judul tabel lampiran.
 *
 * TUJUH nomor untuk DELAPAN kolom fisik: nomor (4) menaungi Volume dan Satuan,
 * mengikuti kepala "Target Pekerjaan" di atasnya — pola yang sama dengan BAST.
 * Daftar ini karena itu SENGAJA lebih pendek dari `LEBAR_KOLOM_LAMPIRAN`;
 * menyamakan panjangnya akan menggeser seluruh tabel satu kolom.
 */
export const NOMOR_KOLOM_LAMPIRAN: number[] = [1, 2, 3, 4, 5, 6, 7];

/**
 * Baris nomor kolom. Menghasilkan DELAPAN sel untuk TUJUH nomor: sel keempat
 * ber-colSpan 2 dan diikuti satu sel penampung kosong, sebagaimana pdfmake
 * mengharapkan sel yang ternaungi colSpan.
 */
export const barisNomorKolomLampiran = (): any[] => [
  selNomorKolom(1), selNomorKolom(2), selNomorKolom(3),
  selNomorKolom(4, { colSpan: 2 }), {},
  selNomorKolom(5), selNomorKolom(6), selNomorKolom(7),
];

export function buatDefinisiKontrak(
  mitra: DataKontrakMitra,
  template: TemplateSurat,
  tanggalSurat: Date,
  /** Nama font terpasang; 'Roboto' bila Bookman gagal dimuat. */
  namaFont = "Roboto",
): any {
  const nomorSurat = mitra.nomorSurat ?? "-";
  const totalHonor = mitra.totalHonor;
  const totalTerbilang = terbilangRupiah(totalHonor);
  const namaBulanSurat = format(tanggalSurat, "MMMM", { locale: localeID });
  const jangkaWaktuKeseluruhan = jangkaWaktuSingkat(mitra.jangkaWaktuMulai, mitra.jangkaWaktuSelesai);

  const barisLampiran = mitra.baris.map((b, i) => [
    { text: String(i + 1), alignment: "center" },
    { text: b.uraianTugas },
    { text: jangkaWaktuSingkat(b.jangkaWaktuMulai, b.jangkaWaktuSelesai), alignment: "center" },
    { text: String(b.volume), alignment: "center" },
    { text: b.satuan, alignment: "center" },
    { text: formatRupiah(b.hargaSatuan), alignment: "right" },
    { text: formatRupiah(b.nilaiPerjanjian), alignment: "right" },
    { text: b.kodeAnggaran || "-", fontSize: 7 },
  ]);

  return {
    pageSize: "A4",
    pageMargins: MARGIN_HALAMAN,
    content: [
      // ---------------- Kepala surat ----------------
      { text: "PERJANJIAN KERJA", bold: true, alignment: "center" },
      { text: `PETUGAS KEGIATAN SURVEI BULAN ${namaBulanSurat.toUpperCase()} TAHUN ${tanggalSurat.getFullYear()}`, bold: true, alignment: "center" },
      { text: `PADA ${template.satker_nama.toUpperCase()}`, bold: true, alignment: "center" },
      { text: `NOMOR: ${nomorSurat}`, bold: true, alignment: "center", margin: [0, 6, 0, 12] },

      P(`Pada hari ini ${tanggalPanjangTerbilang(tanggalSurat)}, bertempat di Kantor ${template.satker_nama}, yang bertanda tangan di bawah ini:`),

      // ---------------- Para pihak ----------------
      {
        columns: [
          { text: "1.", width: 14 },
          { text: template.ppk_nama, width: 130 },
          { text: ":", width: 10 },
          {
            width: "*",
            alignment: "justify",
            text: [
              `${template.ppk_jabatan} ${template.satker_nama}`,
              template.satker_alamat ? `, berkedudukan di ${template.satker_alamat}` : "",
              `, bertindak untuk dan atas nama ${template.satker_nama}, selanjutnya disebut sebagai `,
              { text: "PIHAK PERTAMA", bold: true },
            ],
          },
        ],
        margin: [0, 0, 0, 8],
      },
      {
        columns: [
          { text: "2.", width: 14 },
          { text: mitra.nama, width: 130 },
          { text: ":", width: 10 },
          {
            width: "*",
            alignment: "justify",
            text: [
              "Mitra BPS",
              mitra.alamat ? `, berkedudukan di ${mitra.alamat}` : "",
              ", bertindak untuk dan atas nama diri sendiri, selanjutnya disebut ",
              { text: "PIHAK KEDUA", bold: true },
            ],
          },
        ],
        margin: [0, 0, 0, 10],
      },

      P([
        "Bahwa ", { text: "PIHAK PERTAMA", bold: true }, " dan ", { text: "PIHAK KEDUA", bold: true },
        " yang secara bersama-sama disebut ", { text: "PARA PIHAK", bold: true },
        `, sepakat untuk mengikatkan diri dalam Perjanjian Kerja Petugas Kegiatan Survei Bulan ${namaBulanSurat} Tahun ${tanggalSurat.getFullYear()} pada ${template.satker_nama}, yang selanjutnya disebut Perjanjian, dengan ketentuan-ketentuan sebagai berikut:`,
      ]),

      // ---------------- Pasal 1-12 ----------------
      JUDUL_PASAL("Pasal 1"),
      P([
        { text: "PIHAK PERTAMA", bold: true }, " memberikan pekerjaan kepada ", { text: "PIHAK KEDUA", bold: true },
        " dan ", { text: "PIHAK KEDUA", bold: true }, " menerima pekerjaan dari ", { text: "PIHAK PERTAMA", bold: true },
        ` sebagai Petugas Kegiatan Survei Bulan ${namaBulanSurat} pada ${template.satker_nama}, dengan lingkup pekerjaan yang ditetapkan oleh `,
        { text: "PIHAK PERTAMA", bold: true }, ".",
      ]),

      JUDUL_PASAL("Pasal 2"),
      P([
        `Ruang lingkup pekerjaan dalam Perjanjian ini mengacu pada wilayah kerja dan beban kerja sebagaimana tertuang dalam lampiran Perjanjian. Pedoman Petugas Kegiatan Survei Bulan ${namaBulanSurat} Tahun ${tanggalSurat.getFullYear()} pada ${template.satker_nama}, dan ketentuan-ketentuan yang ditetapkan oleh `,
        { text: "PIHAK PERTAMA", bold: true }, ".",
      ]),

      JUDUL_PASAL("Pasal 3"),
      P(`Jangka Waktu Perjanjian terhitung sejak tanggal ${jangkaWaktuKeseluruhan}`),

      JUDUL_PASAL("Pasal 4"),
      P([
        { text: "PIHAK KEDUA", bold: true }, " berkewajiban melaksanakan seluruh pekerjaan yang diberikan oleh ",
        { text: "PIHAK PERTAMA", bold: true }, " sampai selesai, sesuai ruang lingkup pekerjaan sebagaimana dimaksud dalam Pasal 2.",
      ]),

      JUDUL_PASAL("Pasal 5"),
      AYAT("(1)", [
        { text: "PIHAK KEDUA", bold: true }, " berhak untuk mendapatkan honorarium petugas dari ", { text: "PIHAK PERTAMA", bold: true },
        ` sebesar ${formatRupiah(totalHonor)} (${totalTerbilang}) sebagaimana dimaksud dalam Pasal 2, termasuk biaya pajak, bea materai, pulsa dan kuota internet untuk komunikasi, dan jasa pelayanan keuangan.`,
      ]),
      AYAT("(2)", [
        { text: "PIHAK KEDUA", bold: true },
        " tidak diberikan honorarium tambahan apabila melakukan kunjungan di luar jadwal atau terdapat tambahan waktu pelaksanaan pekerjaan lapangan.",
      ]),

      JUDUL_PASAL("Pasal 6"),
      AYAT("(1)", [
        "Pembayaran honorarium sebagaimana dimaksud dalam Pasal 5 dilakukan setelah ", { text: "PIHAK KEDUA", bold: true },
        " menyelesaikan dan menyerahkan seluruh hasil pekerjaan sebagaimana dimaksud dalam Pasal 2 kepada ", { text: "PIHAK PERTAMA", bold: true }, ".",
      ]),
      AYAT("(2)", [
        "Pembayaran sebagaimana dimaksud pada ayat (1) dilakukan oleh ", { text: "PIHAK PERTAMA", bold: true },
        " kepada ", { text: "PIHAK KEDUA", bold: true }, " sesuai dengan ketentuan peraturan perundang-undangan.",
      ]),

      JUDUL_PASAL("Pasal 7"),
      P("Penyerahan hasil pekerjaan sebagaimana dimaksud dalam Pasal 2 dilakukan secara bertahap dan selambat-lambatnya seluruh hasil pekerjaan pengolahan diserahkan sesuai jadwal yang tercantum dalam Lampiran, yang dinyatakan dalam Berita Acara Serah Terima Hasil Pekerjaan yang ditandatangani oleh PARA PIHAK."),

      JUDUL_PASAL("Pasal 8"),
      P([
        { text: "PIHAK PERTAMA", bold: true }, " dapat memutuskan Perjanjian ini secara sepihak sewaktu-waktu dalam hal ",
        { text: "PIHAK KEDUA", bold: true }, " tidak dapat melaksanakan kewajibannya sebagaimana dimaksud dalam Pasal 4, dengan menerbitkan Surat Pemutusan Perjanjian Kerja.",
      ]),

      JUDUL_PASAL("Pasal 9"),
      AYAT("(1)", [
        "Apabila ", { text: "PIHAK KEDUA", bold: true },
        ` mengundurkan diri pada saat/setelah pelaksanaan pekerjaan pengolahan dengan tidak menyelesaikan pekerjaan yang menjadi tanggung jawabnya, maka wajib membayar ganti rugi kepada `,
        { text: "PIHAK PERTAMA", bold: true }, ` sebesar ${formatRupiah(totalHonor)} (${totalTerbilang})`,
      ]),
      AYAT("(2)", [
        "Dikecualikan tidak membayar ganti rugi sebagaimana dimaksud pada ayat (1) kepada ", { text: "PIHAK PERTAMA", bold: true },
        ", apabila ", { text: "PIHAK KEDUA", bold: true },
        " meninggal dunia, mengundurkan diri karena sakit dengan keterangan rawat inap, terindikasi terinfeksi virus Covid-19, kecelakaan dengan keterangan kepolisian, dan/atau telah diberikan Surat Pemutusan Perjanjian Kerja dari ",
        { text: "PIHAK PERTAMA", bold: true }, ".",
      ]),
      AYAT("(3)", [
        "Dalam hal terjadi peristiwa sebagaimana dimaksud pada ayat (2), ", { text: "PIHAK PERTAMA", bold: true },
        " membayarkan honorarium kepada ", { text: "PIHAK KEDUA", bold: true }, " secara proporsional sesuai pekerjaan yang telah dilaksanakan.",
      ]),

      JUDUL_PASAL("Pasal 10"),
      AYAT("(1)", [
        "Apabila terjadi Keadaan Kahar, yang meliputi bencana alam dan bencana sosial, ", { text: "PIHAK KEDUA", bold: true },
        " memberitahukan kepada ", { text: "PIHAK PERTAMA", bold: true },
        " dalam waktu paling lambat 7 (tujuh) hari sejak mengetahui atas kejadian Keadaan Kahar dengan menyertakan bukti.",
      ]),
      AYAT("(2)", [
        "Pada saat terjadi Keadaan Kahar, pelaksanaan pekerjaan oleh ", { text: "PIHAK KEDUA", bold: true },
        " dihentikan sementara dan dilanjutkan kembali setelah Keadaan Kahar berakhir, namun apabila akibat Keadaan Kahar tidak memungkinkan dilanjutkan/diselesaikannya pelaksanaan pekerjaan, ",
        { text: "PIHAK KEDUA", bold: true }, " berhak menerima honorarium secara proporsional sesuai pekerjaan yang telah dilaksanakan.",
      ]),

      JUDUL_PASAL("Pasal 11"),
      P("Segala sesuatu yang belum atau tidak cukup diatur dalam Perjanjian ini, dituangkan dalam perjanjian tambahan/addendum dan merupakan bagian tidak terpisahkan dari perjanjian ini."),

      JUDUL_PASAL("Pasal 12"),
      AYAT("(1)", "Segala perselisihan atau perbedaan pendapat yang timbul sebagai akibat adanya Perjanjian ini akan diselesaikan secara musyawarah untuk mufakat."),
      AYAT("(2)", [
        "Apabila perselisihan tidak dapat diselesaikan sebagaimana dimaksud pada ayat (1), ", { text: "PARA PIHAK", bold: true },
        ` sepakat menyelesaikan perselisihan dengan memilih kedudukan/domisili hukum di ${template.pengadilan_negeri || "-"}.`,
      ]),

      P([
        "Demikian Perjanjian ini dibuat dan ditandatangani oleh ", { text: "PARA PIHAK", bold: true },
        " dalam 2 (dua) rangkap asli bermeterai cukup, tanpa paksaan dari ", { text: "PIHAK", bold: true },
        " manapun dan untuk dilaksanakan oleh ", { text: "PARA PIHAK", bold: true }, ".",
      ], { margin: [0, 10, 0, 20] }),

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
      { text: `PERJANJIAN KERJA PETUGAS KEGIATAN SURVEI BULAN ${namaBulanSurat.toUpperCase()} TAHUN ${tanggalSurat.getFullYear()}`, alignment: "center" },
      { text: `PADA ${template.satker_nama.toUpperCase()}`, alignment: "center" },
      { text: `NOMOR: ${nomorSurat}`, alignment: "center", margin: [0, 0, 0, 14] },
      { text: "DAFTAR URAIAN TUGAS, JANGKA WAKTU, NILAI PERJANJIAN, DAN BEBAN ANGGARAN", bold: true, alignment: "center", margin: [0, 0, 0, 10] },
      {
        table: {
          // 3 baris kepala: judul (2 baris karena rowSpan) + nomor kolom.
          headerRows: 3,
          widths: LEBAR_KOLOM_LAMPIRAN,
          body: [
            [
              selJudulKolom("NO", { rowSpan: 2 }),
              selJudulKolom("Uraian Tugas", { rowSpan: 2 }),
              selJudulKolom("Jangka Waktu", { rowSpan: 2 }),
              selJudulKolom("Target Pekerjaan", { colSpan: 2 }), {},
              selJudulKolom("Harga Satuan", { rowSpan: 2 }),
              selJudulKolom("Nilai Perjanjian", { rowSpan: 2 }),
              selJudulKolom("Beban Anggaran", { rowSpan: 2 }),
            ],
            [{}, {}, {}, selJudulKolom("Volume"), selJudulKolom("Satuan"), {}, {}, {}],
            // Baris nomor kolom (1)(2)(3)... — lazim pada tabel lampiran surat
            // dinas, dipakai sebagai rujukan saat menerangkan isi kolom.
            // Ikut `headerRows` sehingga terulang bila tabelnya berlanjut ke
            // halaman berikutnya.
            barisNomorKolomLampiran(),
            ...barisLampiran,
            [
              { text: `Terbilang: ${totalTerbilang}`, colSpan: 6, italics: true, bold: true }, {}, {}, {}, {}, {},
              { text: formatRupiah(totalHonor), alignment: "right", bold: true, italics: true },
              {},
            ],
          ],
        },
        fontSize: FONT_TABEL_LAMPIRAN,
      },
    ],
    defaultStyle: { font: namaFont, fontSize: 10, lineHeight: 1.15 },
  };
}

/** Nama berkas PDF untuk satu mitra, aman dipakai di sistem berkas mana pun. */
export const namaBerkasKontrak = (mitra: DataKontrakMitra): string =>
  namaBerkasSurat("SPK", mitra.nomorSurat, mitra.nama);

/** Mengunduh Surat PK satu mitra sebagai berkas PDF. */
export async function unduhKontrak(mitra: DataKontrakMitra, template: TemplateSurat, tanggalSurat: Date): Promise<void> {
  const pdfMake = await muatPdfMake();
  const font = namaFontKontrak(await pastikanFontKontrak(pdfMake));
  pdfMake.createPdf(buatDefinisiKontrak(mitra, template, tanggalSurat, font)).download(namaBerkasKontrak(mitra));
}

/** Menghasilkan PDF satu mitra sebagai Blob, dipakai saat membungkus banyak surat ke ZIP. */
export async function kontrakKeBlob(mitra: DataKontrakMitra, template: TemplateSurat, tanggalSurat: Date): Promise<Blob> {
  const pdfMake = await muatPdfMake();
  const font = namaFontKontrak(await pastikanFontKontrak(pdfMake));
  return pdfKeBlob(pdfMake.createPdf(buatDefinisiKontrak(mitra, template, tanggalSurat, font)));
}
