import { describe, it, expect, beforeEach } from "vitest";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

/**
 * Regresi pendaftaran font pdfmake.
 *
 * Bug aslinya: kode memakai `pdfMake.vfs = peta`, padahal sejak pdfmake 0.3
 * properti itu tidak dibaca siapa pun — penyimpanan sebenarnya `virtualfs.storage`,
 * diisi lewat `addVirtualFileSystem()`. Akibatnya seluruh ekspor PDF gagal dengan
 * "File 'Roboto-Medium.ttf' not found in virtual file system".
 *
 * Kenapa versi lamanya sempat lolos: di Node, `pdfmake.js` adalah bundel UMD yang
 * menyetel `global.pdfMake`, lalu `vfs_fonts.js` mendaftarkan fontnya sendiri
 * sebagai efek samping. Jadi font terpasang BUKAN karena kode kita. Di browser
 * lewat Vite efek samping itu tidak menyala.
 *
 * Tes ini sengaja MEMATIKAN efek samping tersebut supaya benar-benar menguji
 * kode kita, bukan kebetulan lingkungan Node.
 */

const muatPdfMakeBersih = () => {
  delete require.cache[require.resolve("pdfmake/build/pdfmake.js")];
  delete require.cache[require.resolve("pdfmake/build/vfs_fonts.js")];
  const modulPdf = require("pdfmake/build/pdfmake.js");
  const pdfMake: any = modulPdf.default ?? modulPdf;
  // Cabut jalan pintas UMD, tirukan kondisi browser+Vite.
  delete (globalThis as any).pdfMake;
  delete require.cache[require.resolve("pdfmake/build/vfs_fonts.js")];
  const modulFont = require("pdfmake/build/vfs_fonts.js");
  const petaFont: any = modulFont?.vfs ?? modulFont?.pdfMake?.vfs ?? modulFont;
  pdfMake.virtualfs.storage = {};
  return { pdfMake, petaFont };
};

const jumlahBerkas = (pdfMake: any) => Object.keys(pdfMake.virtualfs?.storage ?? {}).length;

describe("pendaftaran font pdfmake", () => {
  let pdfMake: any;
  let petaFont: any;

  beforeEach(() => {
    ({ pdfMake, petaFont } = muatPdfMakeBersih());
  });

  it("peta font membawa keempat berkas Roboto", () => {
    expect(Object.keys(petaFont).sort()).toEqual([
      "Roboto-Italic.ttf",
      "Roboto-Medium.ttf",
      "Roboto-MediumItalic.ttf",
      "Roboto-Regular.ttf",
    ]);
  });

  it("API addVirtualFileSystem tersedia di versi terpasang", () => {
    expect(typeof pdfMake.addVirtualFileSystem).toBe("function");
  });

  // Inti bug-nya.
  it("menugaskan .vfs TIDAK mendaftarkan apa pun", () => {
    pdfMake.vfs = petaFont;
    expect(jumlahBerkas(pdfMake)).toBe(0);
  });

  it("addVirtualFileSystem mendaftarkan keempat font", () => {
    pdfMake.addVirtualFileSystem(petaFont);
    expect(jumlahBerkas(pdfMake)).toBe(4);
    expect(pdfMake.virtualfs.storage).toHaveProperty("Roboto-Medium.ttf");
  });

  // pdfmake 0.3.11 sudah memetakan Roboto sendiri; blok manual tidak perlu.
  it("pemetaan Roboto sudah tersedia secara bawaan", () => {
    expect(pdfMake.fonts?.Roboto).toEqual({
      normal: "Roboto-Regular.ttf",
      bold: "Roboto-Medium.ttf",
      italics: "Roboto-Italic.ttf",
      bolditalics: "Roboto-MediumItalic.ttf",
    });
  });
});
