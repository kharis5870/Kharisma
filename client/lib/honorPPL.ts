/**
 * Perhitungan honor satu alokasi PPL.
 *
 * KENAPA MODUL SENDIRI: honor PPL adalah hasil kali `bebanKerja × hargaSatuan`,
 * tetapi selama ini ia diperlakukan sebagai nilai TERSIMPAN — `besaranHonor`
 * hanya dihitung ulang di dalam `handleBebanKerjaBlur`. Akibatnya mengubah
 * harga satuan tidak mengubah apa pun sampai beban kerja ikut disentuh, dan
 * yang terkirim ke server (termasuk angka yang dipakai pemeriksaan batas honor)
 * adalah hasil kali harga satuan yang LAMA.
 *
 * Dengan menghitungnya di satu tempat lalu memakainya baik saat menampilkan
 * maupun saat menyimpan, honor tidak bisa lagi menyimpang dari kedua faktornya.
 * Ini juga yang membuat "Batalkan Perubahan" bekerja tanpa kode tambahan:
 * angkanya tidak pernah disimpan sebagai state tersendiri, jadi begitu
 * `honorariumSettings` kembali ke isi server, honornya ikut kembali.
 *
 * Pemetaan jenis pekerjaan → kunci pengaturan dulu ditulis ulang di tiga
 * tempat dengan rantai if/else yang sama persis. Sekarang satu tabel.
 */

import type { HonorariumSettingsMap } from "@shared/api";
import { parseHonorNumber } from "./angka";

/**
 * Jenis pekerjaan pada baris honorarium.
 *
 * Perhatikan: ini BUKAN nilai `tahap` pada alokasi PPL. Tahap
 * 'pengolahan-analisis' menghasilkan jenis pekerjaan 'pengolahan'.
 */
export type JenisPekerjaan = "listing" | "pencacahan" | "pengolahan";

/** Jenis pekerjaan → kunci di `honorariumSettings`. */
export const KUNCI_HARGA_SATUAN: Record<JenisPekerjaan, keyof HonorariumSettingsMap> = {
  listing: "pengumpulan-data-listing",
  pencacahan: "pengumpulan-data-pencacahan",
  pengolahan: "pengolahan-analisis",
};

/**
 * Harga satuan untuk satu jenis pekerjaan, sebagai angka.
 *
 * Selalu aman: pengaturan yang belum dimuat, kunci yang tidak dikenal, dan
 * isian kosong sama-sama menghasilkan 0 — bukan NaN. Honor NaN akan tampil
 * sebagai "Rp NaN" di layar dan tersimpan sebagai NULL di database.
 */
export const hargaSatuanUntuk = (
  jenis: string | undefined,
  pengaturan: Partial<HonorariumSettingsMap> | undefined,
): number => {
  const kunci = KUNCI_HARGA_SATUAN[jenis as JenisPekerjaan];
  if (!kunci) return 0;
  return parseHonorNumber(pengaturan?.[kunci]?.hargaSatuan ?? 0);
};

/** Honor satu baris pekerjaan: beban kerja × harga satuan. */
export const hitungBesaranHonor = (
  bebanKerja: string | number | undefined,
  jenis: string | undefined,
  pengaturan: Partial<HonorariumSettingsMap> | undefined,
): number => parseHonorNumber(bebanKerja ?? 0) * hargaSatuanUntuk(jenis, pengaturan);

/** Satu baris honorarium, seperti yang dipegang form dan dikirim ke server. */
export interface BarisHonor {
  jenis_pekerjaan?: string;
  bebanKerja?: string | number;
  besaranHonor?: string | number;
}

/**
 * Total honor satu alokasi PPL.
 *
 * Dihitung dari `bebanKerja` dan pengaturan, BUKAN dijumlahkan dari
 * `besaranHonor` yang tersimpan — nilai tersimpan itulah yang bisa basi.
 */
export const hitungTotalHonorPPL = (
  honorarium: BarisHonor[] | undefined,
  pengaturan: Partial<HonorariumSettingsMap> | undefined,
): number =>
  (honorarium ?? []).reduce(
    (jumlah, h) => jumlah + hitungBesaranHonor(h.bebanKerja, h.jenis_pekerjaan, pengaturan),
    0,
  );
