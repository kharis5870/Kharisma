import { describe, it, expect } from "vitest";
import {
  bacaBaris, cariBarisHeader, kolomWajibHilang, normalkanHeader, normalkanPosisi,
  periksaImpor, petakanKolom, ringkasTemuan, tidakAdaDiBerkas,
  type BarisImpor, type MitraTersimpan,
} from "@shared/imporMitra";

/**
 * Pembacaan berkas mitra dari SOBAT.
 *
 * Yang dikunci di sini adalah hal-hal yang kalau salah TIDAK menimbulkan galat,
 * hanya data yang keliru: kolom yang salah dikenali, dan orang yang salah
 * digabungkan. Dua-duanya baru ketahuan berbulan-bulan kemudian, saat honor
 * seseorang muncul di riwayat orang lain.
 */

describe("pengenalan kolom", () => {
  it("beda penulisan header tetap dikenali sebagai kolom yang sama", () => {
    expect(normalkanHeader("ID SOBAT")).toBe("idsobat");
    expect(normalkanHeader("id_sobat")).toBe("idsobat");
    expect(normalkanHeader("Id. Sobat ")).toBe("idsobat");
  });

  it("kolom dicocokkan lewat nama, bukan urutan", () => {
    // Kolomnya sengaja diacak urutannya dan disisipi kolom asing.
    const peta = petakanKolom(["Catatan", "Nama Mitra", "No. HP", "ID SOBAT", "Kecamatan"]);
    expect(peta.nama).toBe(1);
    expect(peta.telepon).toBe(2);
    expect(peta.sobatId).toBe(3);
    expect(peta.kecamatan).toBe(4);
  });

  it("kolom asing diabaikan, bukan membatalkan pembacaan", () => {
    const peta = petakanKolom(["Nama", "Kolom Aneh Milik Seseorang"]);
    expect(kolomWajibHilang(peta)).toEqual([]);
    expect(peta.alamat).toBeNull();
  });

  it("berkas tanpa kolom nama dilaporkan, bukan dibaca setengah-setengah", () => {
    expect(kolomWajibHilang(petakanKolom(["ID SOBAT", "Alamat"]))).toEqual(["nama"]);
  });
});

describe("mencari baris header", () => {
  it("melewati baris judul dan baris kosong di atas header", () => {
    // Bentuk yang persis dihasilkan ekspor Excel aplikasi ini: judul, subjudul,
    // baris kosong, baru headernya.
    const berkas: unknown[][] = [
      ["Daftar Mitra (PPL)"],
      ["128 mitra sesuai filter yang sedang aktif"],
      [],
      ["ID SOBAT", "Nama", "Posisi", "No HP"],
      ["SB-1", "Budi", "Pendataan", "0812"],
    ];
    expect(cariBarisHeader(berkas)).toBe(3);
  });

  it("header di baris pertama tetap ditemukan", () => {
    expect(cariBarisHeader([["Nama", "Alamat"], ["Budi", "Jl. Mawar"]])).toBe(0);
  });

  it("memilih baris dengan kolom dikenali TERBANYAK", () => {
    const berkas: unknown[][] = [
      ["Nama"],                                   // wajib lengkap, tapi cuma 1
      ["ID SOBAT", "Nama", "Alamat", "Desa"],     // jauh lebih lengkap
    ];
    expect(cariBarisHeader(berkas)).toBe(1);
  });

  it("berkas tanpa header yang bisa dikenali menghasilkan -1", () => {
    // Pemanggilnya lalu menawarkan pemetaan kolom manual, bukan menyerah.
    expect(cariBarisHeader([["Kolom A", "Kolom B"], ["x", "y"]])).toBe(-1);
  });

  it("tidak menelusuri seluruh berkas, hanya beberapa baris pertama", () => {
    const berkas: unknown[][] = Array.from({ length: 50 }, () => ["x"]);
    berkas[20] = ["Nama", "Alamat"];
    expect(cariBarisHeader(berkas)).toBe(-1);
    expect(cariBarisHeader(berkas, 25)).toBe(20);
  });
});

describe("pembacaan baris", () => {
  const peta = petakanKolom(["ID SOBAT", "Nama", "Posisi", "No HP"]);

  it("membaca nilai menurut peta kolom", () => {
    const b = bacaBaris(["SB-77", " Budi Santoso ", "Pendataan", "0812-3456-7890"], peta, 2);
    expect(b.sobatId).toBe("SB-77");
    expect(b.nama).toBe("Budi Santoso");
    expect(b.posisi).toBe("Pendataan");
    expect(b.nomorBaris).toBe(2);
  });

  it("telepon disaring menjadi angka saja", () => {
    // "0812-3456" dan "0812 3456" harus menjadi nilai yang sama.
    expect(bacaBaris(["", "A", "", "0812-3456"], peta, 1).telepon).toBe("08123456");
    expect(bacaBaris(["", "A", "", "0812 3456"], peta, 1).telepon).toBe("08123456");
  });

  it("sel kosong menjadi undefined, bukan string kosong", () => {
    const b = bacaBaris(["", "A", "", ""], peta, 1);
    expect(b.sobatId).toBeUndefined();
    expect(b.telepon).toBeUndefined();
  });
});

describe("normalkanPosisi", () => {
  it("mengenali tulisan yang beragam", () => {
    expect(normalkanPosisi("Pendataan")).toBe("Pendataan");
    expect(normalkanPosisi("PENGOLAHAN")).toBe("Pengolahan");
    expect(normalkanPosisi("Pendataan/Pengolahan")).toBe("Pendataan/Pengolahan");
    expect(normalkanPosisi("pencacah")).toBe("Pendataan");
  });

  it("yang tidak dikenali menghasilkan null, bukan tebakan diam-diam", () => {
    expect(normalkanPosisi("Koordinator")).toBeNull();
    expect(normalkanPosisi("")).toBeNull();
  });
});

describe("penggolongan baris terhadap mitra tersimpan", () => {
  const tersimpan: MitraTersimpan[] = [
    { id: "PPL001", sobatId: "SB-1", nama: "Budi Santoso" },
    { id: "PPL002", sobatId: null, nama: "Siti Aminah" },
    { id: "PPL003", sobatId: null, nama: "Siti Aminah" },
  ];
  const baris = (n: number, nama: string, sobatId?: string): BarisImpor =>
    ({ nomorBaris: n, nama, sobatId });

  it("sobatId yang cocok adalah kepastian, bukan dugaan", () => {
    const [t] = periksaImpor([baris(1, "Budi S. (nama berubah)", "SB-1")], tersimpan);
    expect(t.jenis).toBe("cocok");
    expect(t.mitraId).toBe("PPL001");
  });

  it("nama yang sama hanya DUGAAN yang harus dikonfirmasi", () => {
    const [t] = periksaImpor([baris(1, "budi   santoso")], tersimpan);
    expect(t.jenis).toBe("mirip");
    expect(t.mitraId).toBe("PPL001");
  });

  it("nama kembar di data tersimpan disebutkan jumlahnya", () => {
    const [t] = periksaImpor([baris(1, "Siti Aminah")], tersimpan);
    expect(t.jenis).toBe("mirip");
    expect(t.pesan).toContain("2 mitra bernama sama");
  });

  it("orang yang belum ada menjadi baru", () => {
    expect(periksaImpor([baris(1, "Nama Yang Belum Ada")], tersimpan)[0].jenis).toBe("baru");
  });

  it("sobatId ganda DI DALAM berkas ditangkap sebelum menulis", () => {
    // Kalau lolos, database menolaknya di tengah impor dan sebagian data sudah
    // terlanjur berubah.
    const hasil = periksaImpor(
      [baris(1, "Orang A", "SB-9"), baris(2, "Orang B", "SB-9")], tersimpan);
    expect(hasil.map(t => t.jenis)).toEqual(["ganda", "ganda"]);
  });

  it("baris tanpa nama ditolak", () => {
    expect(periksaImpor([baris(1, "   ")], tersimpan)[0].jenis).toBe("tidak-sah");
  });

  it("ringkasannya menghitung tiap golongan", () => {
    const hasil = periksaImpor(
      [baris(1, "Budi Santoso", "SB-1"), baris(2, "Orang Baru"), baris(3, "Siti Aminah")],
      tersimpan);
    expect(ringkasTemuan(hasil)).toEqual({ baru: 1, cocok: 1, mirip: 1, ganda: 0, tidakSah: 0 });
  });
});

describe("mitra yang tidak ada di berkas", () => {
  const tersimpan: MitraTersimpan[] = [
    { id: "PPL001", sobatId: "SB-1", nama: "Budi Santoso" },
    { id: "PPL002", sobatId: "SB-2", nama: "Siti Aminah" },
  ];

  it("dikembalikan sebagai calon untuk DINONAKTIFKAN, bukan dihapus", () => {
    const sisa = tidakAdaDiBerkas([{ nomorBaris: 1, nama: "Budi Santoso", sobatId: "SB-1" }], tersimpan);
    expect(sisa.map(m => m.id)).toEqual(["PPL002"]);
  });

  it("dikenali lewat sobatId walau namanya berubah", () => {
    const sisa = tidakAdaDiBerkas(
      [{ nomorBaris: 1, nama: "Budi Ganti Nama", sobatId: "SB-1" },
       { nomorBaris: 2, nama: "Siti Aminah", sobatId: "SB-2" }],
      tersimpan);
    expect(sisa).toEqual([]);
  });
});
