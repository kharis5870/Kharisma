import { describe, it, expect } from "vitest";
import { halamanAman } from "./useHalamanAman";

describe("halamanAman — penomoran mulai dari 1", () => {
  it("membiarkan halaman yang masih sah", () => {
    expect(halamanAman(1, 5)).toBe(1);
    expect(halamanAman(3, 5)).toBe(3);
    expect(halamanAman(5, 5)).toBe(5);
  });

  // Kasus yang dilaporkan: di halaman 3, filter menyisakan 1 halaman.
  it("memundurkan ke halaman terakhir saat data menyusut", () => {
    expect(halamanAman(3, 1)).toBe(1);
    expect(halamanAman(7, 4)).toBe(4);
  });

  it("kembali ke halaman 1 saat tidak ada data sama sekali", () => {
    expect(halamanAman(3, 0)).toBe(1);
    expect(halamanAman(1, 0)).toBe(1);
  });

  it("menaikkan nomor halaman yang di bawah batas", () => {
    expect(halamanAman(0, 5)).toBe(1);
    expect(halamanAman(-2, 5)).toBe(1);
  });
});

describe("halamanAman — penomoran berbasis indeks (mulai 0)", () => {
  it("membiarkan indeks yang masih sah", () => {
    expect(halamanAman(0, 5, 0)).toBe(0);
    expect(halamanAman(4, 5, 0)).toBe(4);
  });

  it("memundurkan ke indeks terakhir saat data menyusut", () => {
    // 5 halaman -> indeks sah 0..4; indeks 4 saat tinggal 2 halaman jadi 1.
    expect(halamanAman(4, 2, 0)).toBe(1);
    expect(halamanAman(2, 1, 0)).toBe(0);
  });

  it("kembali ke indeks 0 saat tidak ada data", () => {
    expect(halamanAman(3, 0, 0)).toBe(0);
  });

  it("tidak pernah menghasilkan indeks negatif", () => {
    // Salah hitung di sini akan membuat slice() memotong dari belakang.
    expect(halamanAman(0, 0, 0)).toBe(0);
    expect(halamanAman(-1, 0, 0)).toBe(0);
  });
});
