import { describe, it, expect } from "vitest";
import { nextId, nomorDariId } from "./idOtomatis";

describe("nomorDariId", () => {
  it("mengambil angka dari ID berprefiks", () => {
    expect(nomorDariId("USR012", "USR")).toBe(12);
    expect(nomorDariId("USR001", "USR")).toBe(1);
    expect(nomorDariId("KT007", "KT")).toBe(7);
  });

  it("mengabaikan ID yang tidak sesuai pola", () => {
    expect(nomorDariId("ADMIN", "USR")).toBeNull();
    expect(nomorDariId("USR", "USR")).toBeNull();
    expect(nomorDariId("USRABC", "USR")).toBeNull();
    expect(nomorDariId("", "USR")).toBeNull();
    // Prefiks lain tidak boleh ikut terhitung.
    expect(nomorDariId("KT005", "USR")).toBeNull();
  });

  it("menolak nomor nol", () => {
    // USR000 tidak pernah dipakai; kalau ada, jangan sampai membuat
    // kandidat berikutnya salah hitung.
    expect(nomorDariId("USR000", "USR")).toBeNull();
  });
});

describe("nextId", () => {
  it("mulai dari 001 saat belum ada data", () => {
    expect(nextId([], "USR")).toBe("USR001");
  });

  it("melanjutkan dari nomor tertinggi saat tidak ada lubang", () => {
    expect(nextId(["USR001", "USR002", "USR003"], "USR")).toBe("USR004");
  });

  // Inti permintaan: nomor bekas penghapusan dipakai ulang.
  it("mengisi lubang di tengah lebih dulu", () => {
    expect(nextId(["USR001", "USR003", "USR004"], "USR")).toBe("USR002");
  });

  it("mengisi lubang paling awal bila ada beberapa", () => {
    expect(nextId(["USR003", "USR005"], "USR")).toBe("USR001");
  });

  it("mengisi lubang berurutan satu per satu", () => {
    const ada = ["USR001", "USR004"];
    const pertama = nextId(ada, "USR");
    expect(pertama).toBe("USR002");
    expect(nextId([...ada, pertama], "USR")).toBe("USR003");
    expect(nextId([...ada, pertama, "USR003"], "USR")).toBe("USR005");
  });

  it("tidak terganggu urutan daftar maupun ID berformat lain", () => {
    expect(nextId(["USR009", "admin", "USR001", "KT002", "USR002"], "USR")).toBe("USR003");
  });

  it("bekerja untuk prefiks lain", () => {
    expect(nextId(["KT002", "KT003"], "KT")).toBe("KT001");
    expect(nextId(["PPL001", "PPL002"], "PPL")).toBe("PPL003");
  });

  it("memanjang, bukan terpotong, saat melewati lebar digit", () => {
    const seribu = Array.from({ length: 999 }, (_, i) => `USR${String(i + 1).padStart(3, '0')}`);
    expect(nextId(seribu, "USR")).toBe("USR1000");
  });

  it("tahan terhadap nol di depan yang tidak konsisten", () => {
    // "USR2" dan "USR002" adalah nomor yang sama, jangan sampai 2 dianggap kosong.
    expect(nextId(["USR001", "USR2"], "USR")).toBe("USR003");
  });
});
