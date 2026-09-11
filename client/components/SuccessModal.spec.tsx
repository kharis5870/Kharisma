import { describe, it, expect } from "vitest";
import { perluDuaTombol, LABEL_TUTUP } from "@/components/SuccessModal";

/**
 * Diuji lewat fungsi murni, bukan dengan merender komponennya: Radix Dialog
 * memakai Portal sehingga `renderToStaticMarkup` menghasilkan string kosong.
 */
describe("perluDuaTombol", () => {
  // Regresi: modal logout mengoper actionLabel="Tutup" DAN onAction, sementara
  // tombol batal juga bertuliskan "Tutup" — hasilnya dua tombol identik yang
  // mengerjakan hal yang sama.
  it("satu tombol saat actionLabel sama dengan label tutup", () => {
    expect(perluDuaTombol("Tutup", true)).toBe(false);
    expect(perluDuaTombol(LABEL_TUTUP, true)).toBe(false);
  });

  it("tidak peduli huruf besar-kecil dan spasi berlebih", () => {
    expect(perluDuaTombol("  tutup  ", true)).toBe(false);
    expect(perluDuaTombol("TUTUP", true)).toBe(false);
  });

  it("satu tombol untuk 'OK' yang juga cuma menutup", () => {
    expect(perluDuaTombol("OK", true)).toBe(false);
    expect(perluDuaTombol("ok", true)).toBe(false);
  });

  it("satu tombol saat tidak ada onAction", () => {
    expect(perluDuaTombol("Ke Dashboard", false)).toBe(false);
    expect(perluDuaTombol(undefined, false)).toBe(false);
  });

  it("satu tombol saat labelnya kosong", () => {
    expect(perluDuaTombol("", true)).toBe(false);
    expect(perluDuaTombol("   ", true)).toBe(false);
    expect(perluDuaTombol(undefined, true)).toBe(false);
  });

  it("dua tombol saat aksinya benar-benar berbeda", () => {
    expect(perluDuaTombol("Ke Dashboard", true)).toBe(true);
    expect(perluDuaTombol("Ke Input Kegiatan", true)).toBe(true);
    expect(perluDuaTombol("Kembali ke Edit Kegiatan", true)).toBe(true);
  });
});
