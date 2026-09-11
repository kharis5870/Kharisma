/**
 * Menentukan nomor urut surat pertama yang akan dipakai.
 *
 * Logika yang sama diterapkan di server (`pesanNomorKontrak`); dipisah ke sini
 * supaya bisa diuji dan supaya layar bisa menjelaskan hasilnya lebih dulu
 * kepada pengguna, sebelum nomor benar-benar dipesan — pemesanan nomor bersifat
 * permanen dan tidak bisa dibatalkan.
 */

/**
 * @param maksTerpakai nomor tertinggi yang sudah dipakai pada tahun surat
 * @param nomorMulai   nomor awal yang diminta pengguna (opsional)
 * @returns nomor urut yang akan dipakai untuk surat PERTAMA
 */
export const nomorPertama = (maksTerpakai: number, nomorMulai?: number | string | null): number => {
  const maks = Number.isFinite(Number(maksTerpakai)) ? Math.max(0, Number(maksTerpakai)) : 0;
  const diminta = Number(nomorMulai);

  // Permintaan diabaikan bila kosong, bukan angka, nol/negatif, atau
  // MEMUNDURKAN penomoran — memakai nomor yang sudah terbit akan menghasilkan
  // dua surat resmi bernomor sama.
  const sah = Number.isFinite(diminta) && diminta > 0 && diminta > maks;
  return sah ? Math.floor(diminta) : maks + 1;
};

/** Apakah nomor yang diminta pengguna diabaikan karena sudah terlewati? */
export const nomorDiabaikan = (maksTerpakai: number, nomorMulai?: number | string | null): boolean => {
  const diminta = Number(nomorMulai);
  if (!Number.isFinite(diminta) || diminta <= 0) return false;
  return diminta <= Math.max(0, Number(maksTerpakai) || 0);
};
