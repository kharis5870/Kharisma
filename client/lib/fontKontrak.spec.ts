import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { berkasFontSah, namaFontKontrak } from "./fontKontrak";

const dariTeks = (teks: string): ArrayBuffer => {
  const buf = new Uint8Array(teks.length);
  for (let i = 0; i < teks.length; i++) buf[i] = teks.charCodeAt(i);
  return buf.buffer;
};

const dariByte = (...byte: number[]): ArrayBuffer => new Uint8Array(byte).buffer;

describe("berkasFontSah", () => {
  // Berkas Bookman yang sungguhan, bukan tiruan — kalau suatu saat berkasnya
  // rusak atau tertukar, tes ini yang memberi tahu.
  it("menerima keempat berkas Bookman Old Style di public/fonts", () => {
    const varian = ["Regular", "Bold", "Italic", "BoldItalic"];
    for (const v of varian) {
      const jalur = resolve(__dirname, `../../public/fonts/BookmanOldStyle-${v}.ttf`);
      const isi = readFileSync(jalur);
      const buffer = isi.buffer.slice(isi.byteOffset, isi.byteOffset + isi.byteLength);
      expect(berkasFontSah(buffer as ArrayBuffer), `BookmanOldStyle-${v}.ttf`).toBe(true);
    }
  });

  it("menerima tanda tangan font lain yang sah", () => {
    expect(berkasFontSah(dariByte(0x00, 0x01, 0x00, 0x00))).toBe(true); // TrueType
    expect(berkasFontSah(dariTeks("OTTO"))).toBe(true); // OpenType/CFF
    expect(berkasFontSah(dariTeks("true"))).toBe(true); // TrueType Mac
    expect(berkasFontSah(dariTeks("ttcf"))).toBe(true); // koleksi TrueType
  });

  // Inti perlindungannya: path yang meleset membuat server SPA membalas
  // index.html dengan status 200, sehingga `res.ok` saja tidak cukup.
  it("menolak halaman HTML yang dibalas server SPA", () => {
    expect(berkasFontSah(dariTeks("<!doctype html>\n<html lang=\"id\">"))).toBe(false);
    expect(berkasFontSah(dariTeks("<html>"))).toBe(false);
  });

  it("menolak balasan kosong atau terpotong", () => {
    expect(berkasFontSah(new ArrayBuffer(0))).toBe(false);
    expect(berkasFontSah(dariByte(0x00, 0x01))).toBe(false);
  });
});

describe("namaFontKontrak", () => {
  // Surat harus tetap jadi walau fontnya gagal dimuat; Roboto lebih baik
  // daripada gagal total.
  it("jatuh ke Roboto bila pemuatan gagal", () => {
    expect(namaFontKontrak(true)).toBe("BookmanOldStyle");
    expect(namaFontKontrak(false)).toBe("Roboto");
  });
});
