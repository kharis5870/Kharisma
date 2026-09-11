/**
 * Font Bookman Old Style untuk Surat Perjanjian Kerja.
 *
 * Surat PK adalah surat dinas resmi, jadi hurufnya mengikuti tata naskah —
 * bukan Roboto bawaan pdfmake.
 *
 * Fontnya TIDAK ditanam ke bundel JavaScript. Keempat varian totalnya ~636 KB
 * (menjadi ~850 KB setelah base64), dan hanya dibutuhkan oleh segelintir orang
 * yang membuat kontrak. Berkasnya disajikan sebagai aset statis di
 * `public/fonts/` lalu diambil saat pertama kali surat dibuat, sesudah itu
 * disimpan di cache peramban.
 */

const NAMA_FONT = "BookmanOldStyle";

/** Nama berkas di dalam vfs pdfmake -> berkas di public/fonts. */
const BERKAS_FONT: Record<string, string> = {
  "BookmanOldStyle-Regular.ttf": "BookmanOldStyle-Regular.ttf",
  "BookmanOldStyle-Bold.ttf": "BookmanOldStyle-Bold.ttf",
  "BookmanOldStyle-Italic.ttf": "BookmanOldStyle-Italic.ttf",
  "BookmanOldStyle-BoldItalic.ttf": "BookmanOldStyle-BoldItalic.ttf",
};

/**
 * ArrayBuffer -> base64.
 *
 * Dipotong per blok: `String.fromCharCode(...array)` pada berkas 158 KB akan
 * melampaui batas argumen dan melempar RangeError.
 */
const keBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  const BLOK = 0x8000;
  let biner = "";
  for (let i = 0; i < bytes.length; i += BLOK) {
    biner += String.fromCharCode(...bytes.subarray(i, i + BLOK));
  }
  return btoa(biner);
};

/**
 * Memastikan yang terunduh benar-benar berkas font, bukan halaman HTML.
 *
 * Bila path-nya meleset, server SPA membalas `index.html` dengan status **200**
 * — jadi `res.ok` saja tidak cukup. Tanpa pemeriksaan ini HTML tersebut ikut
 * didaftarkan sebagai TTF, dan pdfmake baru gagal jauh kemudian dengan pesan
 * yang membingungkan saat surat dibuat.
 *
 * Empat byte pertama berkas font: 0x00010000 (TrueType), "true"/"ttcf" (Mac),
 * atau "OTTO" (OpenType/CFF).
 */
export const berkasFontSah = (buffer: ArrayBuffer): boolean => {
  if (buffer.byteLength < 4) return false;
  const b = new Uint8Array(buffer, 0, 4);
  const tanda = String.fromCharCode(...b);
  if (tanda === "true" || tanda === "ttcf" || tanda === "OTTO") return true;
  return b[0] === 0x00 && b[1] === 0x01 && b[2] === 0x00 && b[3] === 0x00;
};

/** Hanya sekali per sesi, berapa kali pun surat dibuat. */
let pemuatan: Promise<boolean> | null = null;

/**
 * Mendaftarkan Bookman Old Style ke pdfmake.
 *
 * Mengembalikan `true` bila berhasil. Bila gagal — berkas tidak ada, jaringan
 * bermasalah — mengembalikan `false` dan TIDAK melempar: pembuatan surat harus
 * tetap jalan dengan Roboto daripada gagal total hanya karena fontnya.
 */
export const pastikanFontKontrak = async (pdfMake: any): Promise<boolean> => {
  if (!pemuatan) {
    pemuatan = (async () => {
      try {
        const basis = import.meta.env.BASE_URL || "/";
        const isiVfs: Record<string, string> = {};

        await Promise.all(
          Object.entries(BERKAS_FONT).map(async ([namaVfs, namaBerkas]) => {
            const res = await fetch(`${basis}fonts/${namaBerkas}`);
            if (!res.ok) throw new Error(`Font ${namaBerkas} tidak ditemukan (${res.status})`);
            const isi = await res.arrayBuffer();
            if (!berkasFontSah(isi)) {
              throw new Error(
                `${namaBerkas} bukan berkas font (kemungkinan halaman SPA; ${isi.byteLength} byte)`,
              );
            }
            isiVfs[namaVfs] = keBase64(isi);
          }),
        );

        pdfMake.addVirtualFileSystem(isiVfs);
        pdfMake.addFonts({
          [NAMA_FONT]: {
            normal: "BookmanOldStyle-Regular.ttf",
            bold: "BookmanOldStyle-Bold.ttf",
            italics: "BookmanOldStyle-Italic.ttf",
            bolditalics: "BookmanOldStyle-BoldItalic.ttf",
          },
        });
        return true;
      } catch (error) {
        console.error("Gagal memuat font Bookman Old Style, memakai Roboto:", error);
        // Percobaan berikutnya boleh mencoba lagi.
        pemuatan = null;
        return false;
      }
    })();
  }
  return pemuatan;
};

/** Nama font yang benar-benar terpasang; jatuh ke Roboto bila gagal. */
export const namaFontKontrak = (berhasil: boolean): string =>
  berhasil ? NAMA_FONT : "Roboto";
