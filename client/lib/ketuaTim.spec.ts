import { describe, it, expect } from "vitest";
import {
  normalkanKetuaTimId,
  idKetuaTimDikenal,
  pesanKetuaTimTidakDikenal,
} from "@shared/ketuaTim";

/** Daftar yang mencerminkan keadaan nyata: KT001 dan KT006 memang tidak ada. */
const DAFTAR = [
  { id: "KT002" }, { id: "KT003" }, { id: "KT004" },
  { id: "KT005" }, { id: "KT007" }, { id: "KT008" },
];

describe("normalkanKetuaTimId", () => {
  it("meneruskan id yang sah", () => {
    expect(normalkanKetuaTimId("KT005")).toBe("KT005");
    expect(normalkanKetuaTimId("  KT005  ")).toBe("KT005");
  });

  // Kolomnya nullable: tidak punya ketua tim itu keadaan sah, bukan galat.
  it("mengubah nilai kosong menjadi null", () => {
    expect(normalkanKetuaTimId("")).toBeNull();
    expect(normalkanKetuaTimId("   ")).toBeNull();
    expect(normalkanKetuaTimId(null)).toBeNull();
    expect(normalkanKetuaTimId(undefined)).toBeNull();
  });

  // Pemilih di layar merender String(formData.ketua_tim_id), yang mengubah
  // nilai kosong jadi teks "undefined"/"null" lalu mengirimnya ke server.
  it("menangkap hasil String() dari nilai kosong", () => {
    expect(normalkanKetuaTimId("undefined")).toBeNull();
    expect(normalkanKetuaTimId("null")).toBeNull();
  });
});

describe("idKetuaTimDikenal", () => {
  it("mengenali id yang ada", () => {
    expect(idKetuaTimDikenal(DAFTAR, "KT005")).toBe(true);
  });

  // Inti bug foreign key-nya: KT001 pernah ada, lalu terhapus, tapi masih
  // tersimpan di form yang sudah telanjur dimuat.
  it("menolak id yang ketua timnya sudah tidak ada", () => {
    expect(idKetuaTimDikenal(DAFTAR, "KT001")).toBe(false);
    expect(idKetuaTimDikenal(DAFTAR, "KT006")).toBe(false);
  });

  it("menolak nilai kosong", () => {
    expect(idKetuaTimDikenal(DAFTAR, "")).toBe(false);
    expect(idKetuaTimDikenal(DAFTAR, null)).toBe(false);
    expect(idKetuaTimDikenal(DAFTAR, "undefined")).toBe(false);
  });

  // Pemanggil di layar wajib menunggu daftarnya termuat; kalau tidak,
  // peringatan "tidak dikenal" akan berkedip saat halaman baru dibuka.
  it("selalu false bila daftarnya masih kosong", () => {
    expect(idKetuaTimDikenal([], "KT005")).toBe(false);
  });

  it("membandingkan lewat String, bukan tipe aslinya", () => {
    expect(idKetuaTimDikenal([{ id: 12 }], "12")).toBe(true);
    expect(idKetuaTimDikenal([{ id: "12" }], 12)).toBe(true);
  });
});

describe("pesanKetuaTimTidakDikenal", () => {
  it("menyebut id-nya dan mengatakan apa yang harus dilakukan", () => {
    const pesan = pesanKetuaTimTidakDikenal("KT001");
    expect(pesan).toContain("KT001");
    expect(pesan.toLowerCase()).toContain("pilih");
  });
});
