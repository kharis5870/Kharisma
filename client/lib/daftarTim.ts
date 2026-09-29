/**
 * Daftar pilihan tim untuk seorang ketua tim.
 *
 * Tim BPS tidak tetap: bisa muncul tim baru (mis. "Pertanian"), dan tim lama
 * bisa berganti nama, tanpa ada yang menyunting kode. Karena itu pilihannya
 * disusun dari tim yang SUDAH TERCATAT di data — bukan dari daftar tetap, dan
 * bukan pula gabungan keduanya.
 *
 * Sisa aplikasi memang sudah bekerja begitu: filter Tim di Dashboard dan
 * grafik komposisi kegiatan per tim keduanya menyusun daftarnya dari data yang
 * ada, bukan dari konstanta. Modal admin dulu satu-satunya yang terkunci.
 *
 * Kolom `ketua_tim.tim` adalah VARCHAR yang boleh kosong, jadi tidak ada
 * perubahan skema untuk ini.
 */

import { DAFTAR_TIM } from "@shared/api";

/** Spasi ganda dan spasi di tepi dirapikan; itu sumber "tim kembar" tersering. */
const rapikan = (teks: unknown): string =>
  String(teks ?? "").replace(/\s+/g, " ").trim();

const kunci = (teks: unknown): string => rapikan(teks).toLocaleLowerCase("id");

/** Ejaan resmi tiap tim bawaan, dicari dari bentuk ternormalkannya. */
const EJAAN_BAWAAN = new Map(DAFTAR_TIM.map(t => [kunci(t), t as string]));

/**
 * Pilihan tim, disusun dari tim yang BENAR-BENAR ADA di data.
 *
 * DAFTAR BAWAAN BUKAN BAGIAN DARI PILIHAN, melainkan hanya benih untuk
 * database yang belum punya satu pun kepengurusan. Versi sebelumnya
 * menggabungkan keduanya, dan akibatnya mengganti nama sebuah tim melahirkan
 * dua pilihan: nama barunya datang dari data, sedangkan nama lamanya hidup
 * kembali dari konstanta di kode. Tidak ada cara menghilangkannya lewat layar,
 * karena yang memunculkannya bukan data.
 *
 * Nama yang cocok dengan tim bawaan tetap ditampilkan memakai ejaan resminya,
 * jadi "umum / tu" yang terlanjur tersimpan tampil sebagai "Umum / TU". Yang
 * hilang hanyalah kemampuan konstanta memunculkan tim yang tidak dipakai
 * siapa pun.
 *
 * Tim yang benar-benar baru tetap bisa ditambahkan lewat "+ Tim lainnya…" di
 * `PilihTim`, jadi daftar ini tidak pernah menjadi penghalang.
 */
export const opsiTim = (timTersimpan: readonly (string | null | undefined)[]): string[] => {
  const urut = (daftar: string[]) => daftar.sort((a, b) => a.localeCompare(b, "id"));

  const hasil = new Map<string, string>();
  for (const t of timTersimpan) {
    const bersih = rapikan(t);
    if (bersih === "") continue;
    const k = kunci(bersih);
    if (!hasil.has(k)) hasil.set(k, EJAAN_BAWAAN.get(k) ?? bersih);
  }

  if (hasil.size === 0) return urut([...DAFTAR_TIM]);
  return urut([...hasil.values()]);
};

/**
 * Merapikan tim yang baru diketik, dan memakai ejaan yang sudah ada bila sama.
 *
 * Tanpa ini "Pertanian", "pertanian", dan "Pertanian " menjadi TIGA tim
 * berbeda — masing-masing potongan sendiri di grafik dan baris sendiri di
 * filter Dashboard, tanpa satu pun galat yang memberi tahu.
 */
export const samakanNamaTim = (
  masukan: string | null | undefined,
  opsi: readonly string[],
): string | null => {
  const bersih = rapikan(masukan);
  if (bersih === "") return null;
  return opsi.find(o => kunci(o) === kunci(bersih)) ?? bersih;
};
