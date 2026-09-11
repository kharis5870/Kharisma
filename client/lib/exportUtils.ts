import { format } from "date-fns";
import { id as localeID } from "date-fns/locale";

/**
 * pdfmake dan exceljs berukuran besar (bersama-sama sekitar 3 MB) dan hanya
 * dipakai saat pengguna menekan tombol ekspor. Keduanya dimuat secara dinamis
 * supaya tidak ikut membebani muatan awal aplikasi bagi pengguna yang tidak
 * pernah mengekspor apa pun.
 */
let pdfMakeSiap: Promise<any> | null = null;

export function muatPdfMake(): Promise<any> {
  if (!pdfMakeSiap) {
    pdfMakeSiap = (async () => {
      const [modulPdf, modulFont] = await Promise.all([
        import("pdfmake/build/pdfmake"),
        import("pdfmake/build/vfs_fonts"),
      ]);
      const pdfMake: any = (modulPdf as any).default ?? modulPdf;
      const modul: any = (modulFont as any).default ?? modulFont;

      // Bentuk ekspor vfs_fonts berbeda antar versi: pdfmake 0.3 mengekspor
      // peta font langsung di level teratas, sedangkan 0.2 membungkusnya di
      // `.vfs` atau `.pdfMake.vfs`.
      const petaFont: any = modul?.vfs ?? modul?.pdfMake?.vfs ?? modul;

      // PENTING: pakai addVirtualFileSystem(), BUKAN `pdfMake.vfs = ...`.
      //
      // Sejak 0.3 pdfmake tidak punya properti `vfs` sama sekali — penyimpanan
      // font sebenarnya ada di `virtualfs.storage`. Menugaskan `.vfs` hanya
      // membuat properti liar yang tidak dibaca siapa pun, sehingga createPdf()
      // gagal dengan "File 'Roboto-Medium.ttf' not found in virtual file system".
      //
      // Kenapa ini sempat lolos pengujian: berkas `pdfmake.js` adalah bundel UMD
      // yang di Node menyetel `global.pdfMake`, lalu `vfs_fonts.js` mendeteksinya
      // dan mendaftarkan font sendiri sebagai efek samping. Di browser lewat Vite,
      // import ESM tidak membocorkan global, efek samping itu tidak menyala, dan
      // barulah kekeliruannya terlihat. Jangan verifikasi jalur ini di Node saja.
      if (typeof pdfMake.addVirtualFileSystem === "function") {
        pdfMake.addVirtualFileSystem(petaFont);
      } else {
        // Jalur mundur untuk pdfmake 0.2.
        pdfMake.vfs = petaFont;
      }

      // Pemetaan Roboto TIDAK perlu didaftarkan manual: pdfmake 0.3.11 sudah
      // menyertakannya secara bawaan (terverifikasi pada modul terpasang).
      return pdfMake;
    })();
  }
  return pdfMakeSiap;
}

export interface KolomEkspor<T> {
  /** Judul kolom di berkas hasil ekspor. */
  header: string;
  /** Mengambil nilai sel dari satu baris data. `indeks` berbasis 0. */
  nilai: (baris: T, indeks: number) => string | number;
  /** Lebar relatif kolom di PDF; default '*' (dibagi rata). */
  lebar?: string | number;
  /** Rata kanan untuk angka. */
  rataKanan?: boolean;
}

interface OpsiEkspor<T> {
  judul: string;
  subJudul?: string;
  kolom: KolomEkspor<T>[];
  baris: T[];
  namaFile: string;
  orientasi?: "portrait" | "landscape";
}

const stempelWaktu = () => format(new Date(), "dd MMMM yyyy HH:mm", { locale: localeID });

const namaFileBerstempel = (namaFile: string, ekstensi: string) =>
  `${namaFile}-${format(new Date(), "yyyyMMdd-HHmm")}.${ekstensi}`;

/**
 * Mengekspor tabel ke PDF.
 *
 * `baris` harus berisi SELURUH data hasil filter, bukan hanya halaman yang
 * sedang tampil — yang diekspor adalah hasil penyaringan, bukan potongan
 * paginasi.
 */
export async function exportToPdf<T>({
  judul,
  subJudul,
  kolom,
  baris,
  namaFile,
  orientasi = "portrait",
}: OpsiEkspor<T>): Promise<void> {
  const pdfMake = await muatPdfMake();
  const isiTabel = [
    kolom.map(k => ({ text: k.header, style: "tabelHeader", alignment: k.rataKanan ? "right" : "left" })),
    ...baris.map((b, indeks) =>
      kolom.map(k => ({
        text: String(k.nilai(b, indeks) ?? ""),
        alignment: k.rataKanan ? "right" : "left",
      })),
    ),
  ];

  const docDefinition: any = {
    pageSize: "A4",
    pageOrientation: orientasi,
    pageMargins: [30, 40, 30, 40],
    content: [
      { text: judul, style: "judul" },
      ...(subJudul ? [{ text: subJudul, style: "subJudul" }] : []),
      {
        table: {
          headerRows: 1,
          widths: kolom.map(k => k.lebar ?? "*"),
          body: isiTabel,
        },
        layout: {
          fillColor: (rowIndex: number) =>
            rowIndex === 0 ? "#eef2f7" : rowIndex % 2 === 0 ? "#fafafa" : null,
        },
        margin: [0, 10, 0, 0],
      },
      {
        text: `Total ${baris.length} baris. Dicetak ${stempelWaktu()}.`,
        style: "catatanKaki",
      },
    ],
    styles: {
      judul: { fontSize: 14, bold: true },
      subJudul: { fontSize: 10, color: "#555555", margin: [0, 4, 0, 0] },
      tabelHeader: { bold: true, fontSize: 9 },
      catatanKaki: { fontSize: 8, color: "#777777", margin: [0, 12, 0, 0] },
    },
    defaultStyle: { fontSize: 9 },
    footer: (halamanSaatIni: number, totalHalaman: number) => ({
      text: `${halamanSaatIni} / ${totalHalaman}`,
      alignment: "center",
      fontSize: 8,
      color: "#777777",
      margin: [0, 10, 0, 0],
    }),
  };

  pdfMake.createPdf(docDefinition).download(namaFileBerstempel(namaFile, "pdf"));
}

/** Mengekspor tabel ke berkas Excel (.xlsx). Ketentuan `baris` sama dengan exportToPdf. */
export async function exportToExcel<T>({
  judul,
  subJudul,
  kolom,
  baris,
  namaFile,
}: Omit<OpsiEkspor<T>, "orientasi">): Promise<void> {
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  workbook.created = new Date();
  // Nama sheet Excel dibatasi 31 karakter dan melarang beberapa karakter.
  const sheet = workbook.addWorksheet(judul.replace(/[*?:\\/\[\]]/g, "").slice(0, 31) || "Data");

  const jumlahKolom = kolom.length;

  sheet.mergeCells(1, 1, 1, jumlahKolom);
  const selJudul = sheet.getCell(1, 1);
  selJudul.value = judul;
  selJudul.font = { bold: true, size: 14 };

  if (subJudul) {
    sheet.mergeCells(2, 1, 2, jumlahKolom);
    const selSub = sheet.getCell(2, 1);
    selSub.value = subJudul;
    selSub.font = { size: 10, color: { argb: "FF555555" } };
  }

  const barisHeader = subJudul ? 4 : 3;
  const header = sheet.getRow(barisHeader);
  kolom.forEach((k, i) => {
    const sel = header.getCell(i + 1);
    sel.value = k.header;
    sel.font = { bold: true };
    sel.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEEF2F7" } };
    sel.border = { bottom: { style: "thin", color: { argb: "FFCCCCCC" } } };
  });

  baris.forEach((b, indeksBaris) => {
    const row = sheet.getRow(barisHeader + 1 + indeksBaris);
    kolom.forEach((k, i) => {
      const nilai = k.nilai(b, indeksBaris);
      const sel = row.getCell(i + 1);
      sel.value = nilai;
      // Angka ditulis sebagai angka sungguhan supaya bisa dijumlah di Excel.
      if (typeof nilai === "number") sel.numFmt = "#,##0";
    });
  });

  kolom.forEach((k, i) => {
    const panjangIsi = baris.map((b, idx) => String(k.nilai(b, idx) ?? "").length);
    const lebar = Math.max(k.header.length, ...(panjangIsi.length ? panjangIsi : [0])) + 4;
    sheet.getColumn(i + 1).width = Math.min(Math.max(lebar, 10), 50);
  });

  sheet.autoFilter = {
    from: { row: barisHeader, column: 1 },
    to: { row: barisHeader, column: jumlahKolom },
  };

  const buffer = await workbook.xlsx.writeBuffer();
  unduhBlob(
    new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
    namaFileBerstempel(namaFile, "xlsx"),
  );
}

/** Memicu unduhan sebuah Blob di browser. */
export function unduhBlob(blob: Blob, namaFile: string): void {
  const url = URL.createObjectURL(blob);
  const tautan = document.createElement("a");
  tautan.href = url;
  tautan.download = namaFile;
  document.body.appendChild(tautan);
  tautan.click();
  document.body.removeChild(tautan);
  URL.revokeObjectURL(url);
}
