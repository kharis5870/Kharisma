import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { opsiTim, samakanNamaTim } from "./daftarTim";
import { DAFTAR_TIM } from "@shared/api";

/**
 * Pilihan tim pada modal Ketua Tim.
 *
 * Sebelum ini pilihannya adalah daftar tetap enam nilai di `shared/api.ts`:
 * tim baru seperti "Pertanian" mustahil dipilih tanpa menyunting kode dan
 * deploy ulang. Yang dikunci di sini adalah kebalikannya — daftar tumbuh
 * mengikuti data — berikut penjaga agar kelonggaran itu tidak melahirkan tim
 * kembar yang hanya beda huruf besar atau spasi.
 */

describe("opsiTim", () => {
  it("daftar bawaan dipakai saat belum ada kepengurusan sama sekali", () => {
    const hasil = opsiTim([]);
    for (const t of DAFTAR_TIM) expect(hasil).toContain(t);
  });

  it("tim bawaan yang tidak dipakai siapa pun TIDAK muncul", () => {
    // Inilah yang dulu membuat pilihan kembar: mengganti nama sebuah tim
    // menghasilkan nama baru dari data sekaligus nama lama dari konstanta.
    const hasil = opsiTim(["Produksi"]);
    expect(hasil).toEqual(["Produksi"]);
    expect(hasil).not.toContain("IPDS");
  });

  it("mengganti nama tim tidak menyisakan nama lamanya", () => {
    const sesudahGantiNama = ["IPDTI & Analisis", "Produksi", "Sosial"];
    const hasil = opsiTim(sesudahGantiNama);
    expect(hasil).toContain("IPDTI & Analisis");
    expect(hasil).not.toContain("IPDS");
  });

  it("nama lama tetap muncul bila masih dipakai tahun lain", () => {
    // Penggantian nama untuk satu tahun saja: kepengurusan tahun sebelumnya
    // memang masih memakai nama lamanya, dan itu bukan kekembaran.
    const hasil = opsiTim(["IPDTI & Analisis", "IPDS"]);
    expect(hasil).toContain("IPDTI & Analisis");
    expect(hasil).toContain("IPDS");
  });

  it("tim baru dari data ikut menjadi pilihan", () => {
    expect(opsiTim(["Pertanian"])).toContain("Pertanian");
  });

  it("tidak menghasilkan pilihan kembar", () => {
    const hasil = opsiTim(["Produksi", "Pertanian", "Pertanian"]);
    expect(hasil.filter(t => t === "Produksi")).toHaveLength(1);
    expect(hasil.filter(t => t === "Pertanian")).toHaveLength(1);
  });

  it("ejaan bawaan menang atas variasi yang terlanjur tersimpan", () => {
    const hasil = opsiTim(["umum / tu", "PRODUKSI"]);
    expect(hasil).toContain("Umum / TU");
    expect(hasil).toContain("Produksi");
    expect(hasil).not.toContain("umum / tu");
    expect(hasil).not.toContain("PRODUKSI");
  });

  it("nilai kosong dan spasi diabaikan", () => {
    const hasil = opsiTim([null, undefined, "", "   "]);
    expect(hasil).toHaveLength(DAFTAR_TIM.length);
  });

  it("urut menurut abjad supaya mudah dicari", () => {
    const hasil = opsiTim(["Pertanian"]);
    expect([...hasil]).toEqual([...hasil].sort((a, b) => a.localeCompare(b, "id")));
  });
});

describe("samakanNamaTim", () => {
  const opsi = opsiTim(["Pertanian"]);

  it("spasi berlebih dirapikan", () => {
    expect(samakanNamaTim("  Kehutanan   Rakyat  ", opsi)).toBe("Kehutanan Rakyat");
  });

  it("memakai ejaan yang sudah ada bila hanya beda huruf besar-kecil", () => {
    // Tanpa ini "pertanian" menjadi tim KEDUA di grafik dan di filter Dashboard.
    expect(samakanNamaTim("pertanian", opsi)).toBe("Pertanian");
    expect(samakanNamaTim("  PERTANIAN ", opsi)).toBe("Pertanian");
  });

  it("nama yang benar-benar baru dipakai apa adanya", () => {
    expect(samakanNamaTim("Kehutanan", opsi)).toBe("Kehutanan");
  });

  it("kosong berarti tanpa tim, bukan teks kosong", () => {
    // Kolomnya nullable; menyimpan '' membuat filter Dashboard menampilkan
    // pilihan tim yang tak bernama.
    expect(samakanNamaTim("", opsi)).toBeNull();
    expect(samakanNamaTim("   ", opsi)).toBeNull();
    expect(samakanNamaTim(null, opsi)).toBeNull();
  });
});

const baca = (jalur: string): string =>
  readFileSync(new URL(jalur, import.meta.url), "utf-8");

describe("modal Ketua Tim", () => {
  const layar = baca("../pages/ManajemenAdmin.tsx");

  it("tidak lagi memakai daftar tetap sebagai isi dropdown", () => {
    // Inilah yang dulu mengunci: DAFTAR_TIM dipetakan langsung menjadi
    // SelectItem, sehingga tim baru mustahil dipilih tanpa menyunting kode.
    expect(layar).not.toContain("DAFTAR_TIM.map");
  });

  it("kedua modal memakai pemilih yang sama", () => {
    expect(layar).toContain('<PilihTim id="newKetuaTimTim"');
    expect(layar).toContain('id="editKtTim"');
  });

  it("nama tim dirapikan saat disimpan, bukan disimpan mentah", () => {
    const simpan = layar.split("\n").filter(b =>
      b.includes("addKetuaTim({") || b.includes("updateKetuaTim(editKetuaTimData.id"));
    expect(simpan).toHaveLength(2);

    const blokSimpan = layar.slice(layar.indexOf("const handleAddKetuaTim"),
      layar.indexOf("const openAddKetuaTimModal"));
    expect(blokSimpan.match(/samakanNamaTim\(/g) ?? []).toHaveLength(2);
  });

  it("pemilih di modal Edit dipasang ulang per ketua tim", () => {
    // Modal Edit tidak dilepas dari DOM saat ditutup; tanpa key, mode "ketik
    // nama baru" terbawa ke ketua tim yang dibuka berikutnya.
    expect(layar).toContain("<PilihTim key={editKetuaTimData.id}");
  });
});
