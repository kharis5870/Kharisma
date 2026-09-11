import { describe, it, expect } from "vitest";
import { nomorPertama, nomorDiabaikan } from "@shared/nomorAwal";

describe("nomorPertama", () => {
  it("melanjutkan nomor tertinggi bila tidak diminta apa pun", () => {
    expect(nomorPertama(89)).toBe(90);
    expect(nomorPertama(0)).toBe(1);
    expect(nomorPertama(0, "")).toBe(1);
    expect(nomorPertama(12, null)).toBe(13);
  });

  // Permintaan aslinya: buku agenda manual sudah sampai 89, jadi surat
  // pertama dari aplikasi harus bernomor 90.
  it("memakai nomor awal yang diminta bila belum terlewati", () => {
    expect(nomorPertama(0, 90)).toBe(90);
    expect(nomorPertama(0, "90")).toBe(90);
    expect(nomorPertama(45, 90)).toBe(90);
  });

  // Ini yang paling penting: memundurkan nomor akan membuat dua surat resmi
  // bernomor sama.
  it("menolak nomor yang sudah terpakai dan tetap melanjutkan", () => {
    expect(nomorPertama(120, 90)).toBe(121);
    expect(nomorPertama(90, 90)).toBe(91);
    expect(nomorPertama(90, 1)).toBe(91);
  });

  it("mengabaikan masukan yang tidak masuk akal", () => {
    expect(nomorPertama(50, 0)).toBe(51);
    expect(nomorPertama(50, -5)).toBe(51);
    expect(nomorPertama(50, "abc")).toBe(51);
    expect(nomorPertama(50, undefined)).toBe(51);
  });

  it("membulatkan ke bawah bila diberi pecahan", () => {
    expect(nomorPertama(0, 90.7)).toBe(90);
  });
});

describe("nomorDiabaikan", () => {
  it("menandai saat permintaan pengguna tidak dipakai", () => {
    expect(nomorDiabaikan(120, 90)).toBe(true);
    expect(nomorDiabaikan(90, 90)).toBe(true);
  });

  it("tidak menandai saat permintaan memang dipakai", () => {
    expect(nomorDiabaikan(45, 90)).toBe(false);
    expect(nomorDiabaikan(0, 1)).toBe(false);
  });

  it("tidak menandai saat pengguna tidak meminta apa pun", () => {
    expect(nomorDiabaikan(120, "")).toBe(false);
    expect(nomorDiabaikan(120, null)).toBe(false);
    expect(nomorDiabaikan(120, undefined)).toBe(false);
  });
});
