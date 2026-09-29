import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

/**
 * Penghapusan ketua tim yang masih memegang kegiatan.
 *
 * Database TIDAK menolaknya: `kegiatan.ketua_tim_id` ber-foreign key
 * ON DELETE SET NULL, jadi penghapusan berhasil dan kegiatannya diam-diam
 * kehilangan ketua tim. Akibatnya tidak terlihat di layar mana pun — seluruh
 * notifikasi ketua tim menyaring lewat JOIN ke `ketua_tim`, sehingga kegiatan
 * itu lenyap dari lonceng siapa pun, dan wewenang menyuntingnya ikut kosong.
 *
 * Karena itu penjaganya ada di kode, bukan di skema.
 */

const baca = (jalur: string): string =>
  readFileSync(new URL(jalur, import.meta.url), "utf-8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n").filter(b => !b.trim().startsWith("//")).join("\n");

const potong = (sumber: string, awal: string, akhir: string): string => {
  const i = sumber.indexOf(awal);
  expect(i, `penanda "${awal}" tidak ditemukan`).toBeGreaterThan(-1);
  const j = sumber.indexOf(akhir, i);
  return j === -1 ? sumber.slice(i) : sumber.slice(i, j);
};

describe("deleteKetuaTim", () => {
  const badan = potong(
    baca("./adminService.ts"), "export const deleteKetuaTim", "\nexport ");

  it("menghitung kegiatan yang dipegang sebelum menghapus", () => {
    expect(badan).toContain("FROM kegiatan k WHERE k.ketua_tim_id = kt.id");
  });

  it("menolak dengan 409, bukan menghapus diam-diam", () => {
    expect(badan).toContain("statusCode: 409");
    expect(badan).toMatch(/Number\(pakai\.kegiatan\) > 0/);
  });

  it("pesannya menyebut nama, jumlah, dan langkah berikutnya", () => {
    expect(badan).toContain("pakai.nama");
    expect(badan).toContain("pakai.kegiatan");
    expect(badan).toContain("Edit Kegiatan");
  });

  it("penghitungan terjadi SEBELUM DELETE dijalankan", () => {
    const iPeriksa = badan.indexOf("statusCode: 409");
    const iHapus = badan.indexOf("DELETE FROM ketua_tim");
    expect(iPeriksa).toBeGreaterThan(-1);
    expect(iHapus).toBeGreaterThan(iPeriksa);
  });
});

describe("layar Manajemen Admin", () => {
  const layar = baca("../../client/pages/ManajemenAdmin.tsx");
  const badan = potong(layar, "const handleDeleteKetuaTim", "const handleAddPPL");

  it("menunggu jawaban server sebelum bilang berhasil", () => {
    // Dulu pesan berhasil muncul seketika, jadi penolakan lewat tanpa terlihat
    // dan barisnya seolah-olah sudah terhapus.
    expect(badan).toContain("onSuccess:");
    expect(badan).toContain("onError:");
  });

  it("pesan penolakan dari server ditampilkan apa adanya", () => {
    expect(badan).toContain("e.message");
    expect(badan).toContain("Ketua Tim Tidak Dihapus");
  });
});
