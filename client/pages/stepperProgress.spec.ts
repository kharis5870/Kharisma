import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

/**
 * Dua cara mengubah progres mitra, dan keduanya SENGAJA berbeda waktunya.
 *
 * - Tombol tambah/kurang satu: tersimpan SEKETIKA. Menambah satu lalu menunggu
 *   angka tetangganya berkurang adalah inti dari kendali ini; kalau harus
 *   keluar kotak dulu, ia tidak terasa seperti tombol sama sekali.
 *
 * - Angka yang DIKETIK: tersimpan saat fokus meninggalkan kotak. Menyimpan
 *   setiap ketikan berarti mengetik "12" tersimpan dulu sebagai "1", dan
 *   validasi perpindahan progres akan menolaknya di tengah jalan.
 *
 * Panah bawaan `<input type="number">` tidak bisa memenuhi keduanya: klik panah
 * dan ketikan memicu event `onChange` yang sama, tanpa pembeda yang andal di
 * semua peramban. Karena itu panahnya disembunyikan dan diganti tombol sendiri.
 *
 * Repo ini tidak merender komponen dalam pengujian, jadi yang diperiksa adalah
 * teks sumbernya setelah komentar dibuang, supaya penjelasan di atas tidak ikut
 * terhitung sebagai bukti.
 */

const sumber = (() => {
  const mentah = readFileSync(new URL("./Dashboard.tsx", import.meta.url), "utf-8");
  return mentah
    .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .filter(baris => !baris.trim().startsWith("//"))
    .join("\n");
})();

describe("tombol tambah/kurang satu", () => {
  it("menyimpan seketika lewat handleUpdatePPL, bukan menunggu blur", () => {
    expect(sumber).toContain("const ubahSatu");
    expect(sumber).toMatch(/ubahSatu[\s\S]{0,400}handleUpdatePPL\(ppl\.id!, field, String\(baru\)\)/);
  });

  it("dipasang pada kedua tombol dengan arah yang benar", () => {
    expect(sumber).toContain("ubahSatu(field, -1)");
    expect(sumber).toContain("ubahSatu(field, 1)");
  });

  it("tidak bisa turun di bawah nol", () => {
    expect(sumber).toContain("Math.max(0, sekarang + delta)");
    expect(sumber).toContain("nilai <= 0");
  });

  it("mengirim nilai barunya langsung, tidak lewat state lokal dulu", () => {
    // setState tidak berlaku seketika; membaca localProgress sesudah setState
    // akan mengirim angka yang lama.
    expect(sumber).toContain("const baru = Math.max(0, sekarang + delta)");
    expect(sumber).not.toMatch(/ubahSatu[\s\S]{0,300}setLocalProgress/);
  });
});

describe("angka yang diketik", () => {
  it("tetap tersimpan saat fokus meninggalkan kotak", () => {
    expect(sumber).toContain("onBlur={() => handleBlur(field)}");
    expect(sumber).toContain("onChange={e => handleLocalChange(field, e.target.value)}");
  });

  it("panah bawaan disembunyikan supaya hanya ada satu cara menambah satu", () => {
    expect(sumber).toContain("[appearance:textfield]");
    expect(sumber).toContain("[&::-webkit-inner-spin-button]:appearance-none");
  });
});

describe("bentuk kotak progres", () => {
  it("masih fungsi yang DIPANGGIL, bukan komponen bersarang", () => {
    // Mendeklarasikannya sebagai komponen di dalam komponen lain membuat
    // identitasnya berubah tiap render: <Input> lama dilepas, fokus hilang di
    // tiap ketikan, dan onBlur tidak pernah menyala sehingga perpindahan
    // progres tidak tersimpan. Ini pernah terjadi di berkas ini.
    expect(sumber).toContain("const kotakProgress = (field: EditableProgressKey, label: string) => {");
    expect(sumber).not.toContain("const KotakProgress");
  });
});
