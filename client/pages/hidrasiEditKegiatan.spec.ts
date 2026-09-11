import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

/**
 * Mengunci URUTAN pelepasan penjaga hidrasi di halaman Edit Kegiatan.
 *
 * ATURANNYA: `setIsInitialDataLoaded(false)` hanya boleh dijalankan SETELAH
 * pengambilan ulang data selesai ditunggu (`await queryClient.invalidateQueries`).
 *
 * KENAPA, dan kenapa ini pantas dikunci dengan tes:
 *
 * Halaman Edit Kegiatan menyalin data server ke state form SEKALI saja, lalu
 * `isInitialDataLoaded` menutup pintunya — kalau tidak, refetch latar belakang
 * akan menimpa apa pun yang sedang diketik pengguna. Melepas penjaga itu berarti
 * "isi ulang form dari data server".
 *
 * Masalahnya, `invalidateQueries` mengembalikan Promise. Bila penjaganya dilepas
 * TANPA menunggu Promise itu, efek hidrasi berjalan lebih dulu atas isi cache
 * yang MASIH LAMA: form seketika kembali ke keadaan sebelum disimpan, penjaganya
 * menutup lagi, dan data baru yang tiba sesaat kemudian tidak pernah disalin.
 *
 * Gejalanya menyesatkan dan sudah pernah terjadi sungguhan: menambah atau
 * menghapus alokasi PPL lalu menekan Simpan Perubahan tampak "tidak berubah",
 * padahal datanya sudah benar di server — dan begitu halaman dibuka ulang dari
 * Dashboard, perubahannya muncul. Orang akan mencarinya di server, bukan di
 * urutan dua baris ini.
 *
 * Repo ini tidak menguji komponen React, jadi yang diperiksa adalah teks
 * sumbernya setelah komentar dibuang — komentar di berkas sumber justru
 * menyebut nama-nama fungsi ini, jadi ia tidak boleh ikut jadi bukti.
 */

const sumber = (() => {
  const isi = readFileSync(
    fileURLToPath(new URL("EditActivity.tsx", import.meta.url)), "utf8");
  return isi
    .replace(/\/\*[\s\S]*?\*\//g, "")   // komentar blok
    .replace(/^\s*\/\/.*$/gm, "");      // komentar baris
})();

/** Memotong satu blok kode dari penanda awal sampai penanda akhir. */
const potong = (awal: string, akhir: string): string => {
  const i = sumber.indexOf(awal);
  expect(i, `penanda "${awal}" tidak ditemukan — nama fungsinya berubah?`).toBeGreaterThan(-1);
  const j = sumber.indexOf(akhir, i);
  expect(j, `penanda akhir "${akhir}" tidak ditemukan`).toBeGreaterThan(i);
  return sumber.slice(i, j);
};

describe("penjaga hidrasi dilepas setelah data baru tiba", () => {
  it("onSuccess simpan: menunggu invalidateQueries sebelum melepas penjaga", () => {
    const blok = potong("const mutation = useMutation({", "onError:");

    const posAwait = blok.indexOf("await queryClient.invalidateQueries");
    const posLepas = blok.indexOf("setIsInitialDataLoaded(false)");

    expect(posAwait, "invalidateQueries wajib di-await di onSuccess").toBeGreaterThan(-1);
    expect(posLepas, "onSuccess wajib melepas penjaga hidrasi").toBeGreaterThan(-1);
    expect(posLepas).toBeGreaterThan(posAwait);
  });

  it("batalkanPerubahan: menunggu invalidateQueries sebelum melepas penjaga", () => {
    const blok = potong("const batalkanPerubahan", "\n    };");

    const posAwait = blok.indexOf("await queryClient.invalidateQueries");
    const posLepas = blok.indexOf("setIsInitialDataLoaded(false)");

    expect(posAwait, "invalidateQueries wajib di-await").toBeGreaterThan(-1);
    expect(posLepas, "batalkanPerubahan wajib melepas penjaga hidrasi").toBeGreaterThan(-1);
    expect(posLepas).toBeGreaterThan(posAwait);
  });

  it("tidak ada pelepasan penjaga di luar kedua tempat itu", () => {
    // Penjaga ini hanya boleh dilepas di dua jalur yang sudah menunggu refetch.
    // Kemunculan ketiga hampir pasti berarti ada jalur baru yang lupa menunggu.
    const kemunculan = sumber.match(/setIsInitialDataLoaded\(false\)/g) ?? [];
    expect(kemunculan).toHaveLength(2);
  });
});
