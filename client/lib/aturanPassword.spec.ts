import { describe, it, expect } from "vitest";
import { periksaPassword, PANJANG_MIN_PASSWORD } from "@shared/aturanPassword";

/**
 * Aturan password dipakai layar DAN server. Kalau keduanya berbeda, pengguna
 * lolos di form lalu ditolak server dengan pesan yang tidak ia pahami — atau
 * sebaliknya, form menolak password yang sebenarnya boleh.
 */
describe("periksaPassword", () => {
  it("minimal 8 karakter", () => {
    expect(PANJANG_MIN_PASSWORD).toBe(8);
    expect(periksaPassword("1234567")).toContain("minimal 8");
    expect(periksaPassword("12345678")).toBeNull();
  });

  it("kosong atau hanya spasi ditolak", () => {
    expect(periksaPassword("")).not.toBeNull();
    expect(periksaPassword("          ")).not.toBeNull();
    expect(periksaPassword(undefined)).not.toBeNull();
  });

  it("sama dengan username ditolak, tanpa peduli huruf besar-kecil", () => {
    expect(periksaPassword("Supervisor1", "supervisor1")).toContain("username");
    expect(periksaPassword("Supervisor1", "admin")).toBeNull();
  });

  it("lebih dari 72 byte ditolak, karena bcrypt mengabaikan sisanya", () => {
    expect(periksaPassword("a".repeat(72))).toBeNull();
    expect(periksaPassword("a".repeat(73))).toContain("maksimal");
    // Huruf non-ASCII dihitung per byte, sama seperti bcrypt.
    expect(periksaPassword("é".repeat(37))).toContain("maksimal");
  });
});
