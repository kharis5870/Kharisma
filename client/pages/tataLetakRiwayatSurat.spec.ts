import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

/**
 * Tata letak tabel Riwayat Penyuratan, sesuai keputusan yang diambil setelah
 * halaman ini dipakai sungguhan.
 *
 * Semuanya berpangkal pada satu masalah yang sama: kolomnya sempit dan isinya
 * panjang. Solusinya bukan memperlebar tabel, melainkan memindahkan teks
 * panjang ke balik ikon dan tooltip, serta membuang bagian yang sudah jelas
 * dari konteks. Keputusan semacam ini gampang sekali "dirapikan" kembali oleh
 * orang berikutnya yang tidak tahu kenapa begitu — karena itu dikunci di sini.
 *
 * Repo ini tidak merender komponen dalam pengujian, jadi yang diperiksa adalah
 * teks sumbernya setelah komentar dibuang, supaya penjelasan seperti paragraf
 * ini tidak ikut terhitung sebagai bukti.
 */

const sumber = (() => {
  const mentah = readFileSync(new URL("./RiwayatSurat.tsx", import.meta.url), "utf-8");
  return mentah
    .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .filter(baris => !baris.trim().startsWith("//"))
    .join("\n");
})();

describe("kolom periode", () => {
  it("memakai label ringkas tanpa tahun", () => {
    // Tahun sudah ditentukan filter tahun di atas tabel; mengulanginya pada
    // setiap baris hanya memakan lebar kolom.
    expect(sumber).toContain("labelRentangSingkat(item.periodeMulai, item.periodeSelesai)");
  });
});

describe("kolom nomor surat", () => {
  it("dipotong dan dilengkapi tooltip berisi nomor utuh", () => {
    expect(sumber).toContain("truncate");
    // Nomor utuh harus tetap bisa dibaca, kalau tidak pemotongan itu
    // menghilangkan informasi, bukan merapikan.
    expect(sumber).toMatch(/TooltipContent>\{item\.nomorSurat\}/);
    expect(sumber).toMatch(/TooltipContent>\{item\.nomorBast\}/);
  });
});

describe("kolom status", () => {
  it("punya tiga keadaan, termasuk Butuh Konfirmasi", () => {
    expect(sumber).toContain("Butuh Konfirmasi");
    expect(sumber).toContain("Berlaku");
    expect(sumber).toContain("Batal");
  });

  it("Butuh Konfirmasi ditentukan oleh adanya perubahan isi", () => {
    expect(sumber).toContain("const isiBerubah = (item.perubahan?.length ?? 0) > 0");
    expect(sumber).toContain(") : isiBerubah ? (");
  });

  it("catatan pembatalan TIDAK lagi dicetak di dalam kolom status", () => {
    // Inilah keluhan aslinya: teks panjang dijejalkan ke kolom sempit.
    expect(sumber).not.toContain('max-w-xs">{item.catatan}');
  });
});

describe("kolom kegiatan", () => {
  it("menampilkan jumlah baris surat dan bisa diklik untuk rinciannya", () => {
    expect(sumber).toContain("{item.baris.length}");
    expect(sumber).toContain("setDialogRincian(item)");
  });

  it("rinciannya memuat muatan, harga satuan, dan honor per kegiatan", () => {
    expect(sumber).toContain("{b.volume} {b.satuan}");
    expect(sumber).toContain("formatRupiah(b.hargaSatuan)");
    expect(sumber).toContain("formatRupiah(b.nilaiPerjanjian)");
  });
});

describe("kolom aksi", () => {
  it("catatan pembatalan dibuka lewat ikon peringatan", () => {
    expect(sumber).toContain("Lihat alasan pembatalan");
  });

  it("perubahan isi surat juga diperingatkan di sini", () => {
    expect(sumber).toContain("Isi surat berubah sejak terbit");
    expect(sumber).toContain("setDialogPerubahan(item)");
  });

  it("ikon catatan membedakan yang sudah berisi dari yang masih kosong", () => {
    // Perbedaannya harus pada IKONNYA, bukan hanya pada tooltip: tooltip
    // menuntut pengguna menyentuh setiap baris satu per satu untuk tahu baris
    // mana yang sudah bercatatan.
    expect(sumber).toMatch(/item\.catatan\s*\?\s*<MessageSquare/);
    expect(sumber).toMatch(/:\s*<Pencil/);
  });
});
