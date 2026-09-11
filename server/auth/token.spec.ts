import { describe, it, expect } from "vitest";
import { buatToken, verifikasiToken, UMUR_TOKEN_DETIK } from "./token";

const RAHASIA = "rahasia-uji-yang-cukup-panjang";
const SEKARANG = 1_800_000_000;

describe("buatToken & verifikasiToken", () => {
  it("token yang baru dibuat bisa diverifikasi", () => {
    const token = buatToken("USR011", RAHASIA, UMUR_TOKEN_DETIK, SEKARANG);
    const isi = verifikasiToken(token, RAHASIA, SEKARANG);
    expect(isi?.sub).toBe("USR011");
    expect(isi?.exp).toBe(SEKARANG + UMUR_TOKEN_DETIK);
  });

  // Inti keamanannya: tanpa rahasia yang benar, token tidak bisa dipalsukan.
  it("menolak token yang ditandatangani rahasia lain", () => {
    const token = buatToken("USR011", "rahasia-orang-lain-yang-panjang", UMUR_TOKEN_DETIK, SEKARANG);
    expect(verifikasiToken(token, RAHASIA, SEKARANG)).toBeNull();
  });

  it("menolak token yang muatannya diubah", () => {
    const token = buatToken("USR011", RAHASIA, UMUR_TOKEN_DETIK, SEKARANG);
    const [, tanda] = token.split(".");
    // Berpura-pura jadi admin dengan mengganti muatannya saja.
    const muatanPalsu = Buffer.from(JSON.stringify({ sub: "USR001", exp: SEKARANG + 999 }), "utf8")
      .toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    expect(verifikasiToken(`${muatanPalsu}.${tanda}`, RAHASIA, SEKARANG)).toBeNull();
  });

  it("menolak token kedaluwarsa", () => {
    const token = buatToken("USR011", RAHASIA, 60, SEKARANG);
    expect(verifikasiToken(token, RAHASIA, SEKARANG + 30)).not.toBeNull();
    expect(verifikasiToken(token, RAHASIA, SEKARANG + 61)).toBeNull();
  });

  it("menolak token pada detik kedaluwarsanya", () => {
    const token = buatToken("USR011", RAHASIA, 60, SEKARANG);
    expect(verifikasiToken(token, RAHASIA, SEKARANG + 60)).toBeNull();
  });

  // Tidak boleh melempar: token tak sah adalah keadaan wajar, bukan kerusakan.
  it("menolak bentuk yang rusak tanpa melempar", () => {
    for (const jahat of [
      "", "bukan-token", "a.b.c", ".", "a.", ".b",
      null, undefined, 123, {}, [],
    ]) {
      expect(() => verifikasiToken(jahat as any, RAHASIA, SEKARANG)).not.toThrow();
      expect(verifikasiToken(jahat as any, RAHASIA, SEKARANG), String(jahat)).toBeNull();
    }
  });

  it("menolak muatan yang bukan JSON walau tanda tangannya cocok", () => {
    // Ditandatangani dengan rahasia yang benar, tapi isinya bukan JSON.
    const muatan = Buffer.from("bukan json", "utf8")
      .toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    const token = buatToken("x", RAHASIA, 60, SEKARANG);
    // Ambil tanda tangan yang sah untuk muatan itu lewat jalur yang sama.
    const palsu = `${muatan}.${token.split(".")[1]}`;
    expect(verifikasiToken(palsu, RAHASIA, SEKARANG)).toBeNull();
  });

  it("token berbeda untuk pengguna berbeda", () => {
    const a = buatToken("USR001", RAHASIA, UMUR_TOKEN_DETIK, SEKARANG);
    const b = buatToken("USR002", RAHASIA, UMUR_TOKEN_DETIK, SEKARANG);
    expect(a).not.toBe(b);
    expect(verifikasiToken(a, RAHASIA, SEKARANG)?.sub).toBe("USR001");
    expect(verifikasiToken(b, RAHASIA, SEKARANG)?.sub).toBe("USR002");
  });

  /**
   * Peran SENGAJA tidak disimpan di dalam token — middleware membacanya dari
   * database tiap permintaan, supaya pencabutan hak langsung berlaku.
   */
  it("token tidak memuat peran maupun nama pengguna", () => {
    const token = buatToken("USR011", RAHASIA, UMUR_TOKEN_DETIK, SEKARANG);
    const isi = verifikasiToken(token, RAHASIA, SEKARANG)!;
    expect(Object.keys(isi).sort()).toEqual(["exp", "sub"]);
  });
});
