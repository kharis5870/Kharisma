import { describe, it, expect } from "vitest";
import { bolehMenyuntingKegiatan, bolehMemperbaruiProgress, bolehMenilaiMitra } from "@shared/hakKegiatan";

const admin = { id: "USR001", role: "admin" as const };
const supervisor = { id: "USR002", role: "supervisor" as const };
/** Contoh dari permintaan aslinya: Pasya membuat kegiatan tim Produksi. */
const pasya = { id: "USR008", role: "user" as const };
const ketuaProduksi = { id: "USR015", role: "user" as const };
const orangLain = { id: "USR011", role: "user" as const };

const kegiatanPasya = { ketuaTimUserId: "USR015", createdBy_userId: "USR008" };

describe("bolehMenyuntingKegiatan", () => {
  // Aturan yang diminta: pembuatnya dan ketua tim kegiatan itu.
  it("pembuat kegiatan boleh", () => {
    expect(bolehMenyuntingKegiatan(pasya, kegiatanPasya)).toBe(true);
  });

  it("ketua tim kegiatan itu boleh", () => {
    expect(bolehMenyuntingKegiatan(ketuaProduksi, kegiatanPasya)).toBe(true);
  });

  it("admin selalu boleh", () => {
    expect(bolehMenyuntingKegiatan(admin, kegiatanPasya)).toBe(true);
    expect(bolehMenyuntingKegiatan(admin, null)).toBe(true);
  });

  // Inti penjagaannya: ketua tim lain tidak boleh menyentuh kegiatan ini.
  it("ketua tim LAIN tidak boleh", () => {
    expect(bolehMenyuntingKegiatan(orangLain, kegiatanPasya)).toBe(false);
  });

  /**
   * Supervisor memeriksa dan menyetujui. Memberinya hak menyunting membuat ia
   * bisa memperbaiki sendiri dokumen yang kemudian ia setujui sendiri.
   */
  it("supervisor tidak boleh menyunting", () => {
    expect(bolehMenyuntingKegiatan(supervisor, kegiatanPasya)).toBe(false);
  });

  it("tanpa pengguna atau tanpa kegiatan, selalu tidak boleh", () => {
    expect(bolehMenyuntingKegiatan(null, kegiatanPasya)).toBe(false);
    expect(bolehMenyuntingKegiatan(undefined, kegiatanPasya)).toBe(false);
    expect(bolehMenyuntingKegiatan(pasya, null)).toBe(false);
  });

  // Kegiatan yang ketua timnya sudah dihapus (FK ON DELETE SET NULL) tidak
  // boleh berubah jadi bebas disunting siapa saja.
  it("nilai kosong tidak pernah dianggap cocok", () => {
    expect(bolehMenyuntingKegiatan(pasya, { ketuaTimUserId: null, createdBy_userId: null })).toBe(false);
    expect(bolehMenyuntingKegiatan(pasya, { ketuaTimUserId: "", createdBy_userId: "" })).toBe(false);
    expect(bolehMenyuntingKegiatan({ id: "", role: "user" }, { ketuaTimUserId: "", createdBy_userId: "" })).toBe(false);
  });

  it("membandingkan lewat String, bukan tipe aslinya", () => {
    expect(bolehMenyuntingKegiatan({ id: "12", role: "user" }, { createdBy_userId: 12 as any })).toBe(true);
  });
});

describe("bolehMemperbaruiProgress", () => {
  it("PML yang mengawasi mitra itu boleh", () => {
    expect(bolehMemperbaruiProgress(ketuaProduksi, { pml_id: "USR015" })).toBe(true);
  });

  it("admin selalu boleh", () => {
    expect(bolehMemperbaruiProgress(admin, { pml_id: "USR015" })).toBe(true);
  });

  // Angka progres dipercaya justru karena pengawas lapangannya sendiri yang
  // melaporkannya.
  it("PML lain dan ketua tim lain tidak boleh", () => {
    expect(bolehMemperbaruiProgress(orangLain, { pml_id: "USR015" })).toBe(false);
    expect(bolehMemperbaruiProgress(supervisor, { pml_id: "USR015" })).toBe(false);
  });

  it("mitra tanpa PML tidak bisa disentuh selain admin", () => {
    expect(bolehMemperbaruiProgress(orangLain, { pml_id: null })).toBe(false);
    expect(bolehMemperbaruiProgress(admin, { pml_id: null })).toBe(true);
  });
});

describe("bolehMenilaiMitra", () => {
  it("PML yang mengawasi mitra itu boleh", () => {
    expect(bolehMenilaiMitra(ketuaProduksi, { pml_id: "USR015" })).toBe(true);
  });

  it("admin selalu boleh", () => {
    expect(bolehMenilaiMitra(admin, { pml_id: "USR015" })).toBe(true);
    expect(bolehMenilaiMitra(admin, { pml_id: null })).toBe(true);
  });

  // Skenario horizontal privilege escalation: sesama pengguna biasa yang
  // bukan PML mitra itu tidak boleh menilainya.
  it("PML lain tidak boleh", () => {
    expect(bolehMenilaiMitra(orangLain, { pml_id: "USR015" })).toBe(false);
  });

  // Tim keuangan memeriksa dokumen, bukan menilai kinerja lapangan.
  it("supervisor tidak boleh", () => {
    expect(bolehMenilaiMitra(supervisor, { pml_id: "USR015" })).toBe(false);
  });

  it("mitra tanpa PML atau tanpa pengguna tidak bisa dinilai selain admin", () => {
    expect(bolehMenilaiMitra(orangLain, { pml_id: null })).toBe(false);
    expect(bolehMenilaiMitra(orangLain, { pml_id: "" })).toBe(false);
    expect(bolehMenilaiMitra(null, { pml_id: "USR015" })).toBe(false);
  });
});
