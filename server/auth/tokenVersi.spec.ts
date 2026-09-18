import { describe, it, expect } from "vitest";
import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buatToken, verifikasiToken, UMUR_TOKEN_DETIK } from "./token";

/**
 * Pencabutan sesi lewat versi token.
 *
 * Yang dikunci: (1) token lama tanpa versi tetap sah — kalau tidak, semua
 * orang terlempar keluar saat fitur ini dipasang; (2) versi yang dibawa token
 * benar-benar DIBANDINGKAN dengan database oleh middleware.
 */

const RAHASIA = "rahasia-uji-yang-cukup-panjang";
const SEKARANG = 1_800_000_000;

/** Menandatangani muatan sembarang dengan cara yang sama seperti token.ts. */
const tandatangani = (isi: object): string => {
  const muatan = Buffer.from(JSON.stringify(isi), "utf8").toString("base64url");
  const tanda = createHmac("sha256", RAHASIA).update(muatan).digest("base64url");
  return `${muatan}.${tanda}`;
};

describe("versi token", () => {
  it("token versi 0 berbentuk sama dengan token lama (tanpa v)", () => {
    const isi = verifikasiToken(buatToken("USR001", RAHASIA, UMUR_TOKEN_DETIK, SEKARANG), RAHASIA, SEKARANG);
    expect(isi).not.toBeNull();
    expect(isi?.v).toBeUndefined();
    expect(Object.keys(isi!).sort()).toEqual(["exp", "sub"]);
  });

  it("versi yang bukan 0 ikut dibawa token", () => {
    const isi = verifikasiToken(buatToken("USR001", RAHASIA, UMUR_TOKEN_DETIK, SEKARANG, 3), RAHASIA, SEKARANG);
    expect(isi?.v).toBe(3);
  });

  it("token lama yang terbit sebelum fitur ini tetap diterima", () => {
    const lama = tandatangani({ sub: "USR001", exp: SEKARANG + 60 });
    expect(verifikasiToken(lama, RAHASIA, SEKARANG)?.sub).toBe("USR001");
  });

  it("versi yang bentuknya tidak sah ditolak walau tanda tangannya benar", () => {
    expect(verifikasiToken(tandatangani({ sub: "USR001", exp: SEKARANG + 60, v: -1 }), RAHASIA, SEKARANG)).toBeNull();
    expect(verifikasiToken(tandatangani({ sub: "USR001", exp: SEKARANG + 60, v: 1.5 }), RAHASIA, SEKARANG)).toBeNull();
    expect(verifikasiToken(tandatangani({ sub: "USR001", exp: SEKARANG + 60, v: "2" }), RAHASIA, SEKARANG)).toBeNull();
  });
});

describe("middleware membandingkan versi token dengan database", () => {
  const sumber = readFileSync(join(__dirname, "middleware.ts"), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "");

  it("kueri pengguna membaca tokenVersi", () => {
    expect(sumber).toMatch(/SELECT[^']*tokenVersi[^']*FROM users/);
  });

  it("versi yang berbeda dibalas 401", () => {
    expect(sumber).toMatch(/\(isi\.v \?\? 0\) !== hasil\.tokenVersi/);
  });
});
