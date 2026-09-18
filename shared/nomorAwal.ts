/**
 * Menentukan nomor urut surat pertama yang akan dipakai.
 *
 * Logika yang sama diterapkan di server (`pesanNomorKontrak`); dipisah ke sini
 * supaya bisa diuji. Pemesanan nomor bersifat permanen, jadi aturannya harus
 * pasti.
 *
 * Dulu fungsi ini juga menerima "nomor mulai" dari isian "Mulai dari Nomor".
 * Isian itu sudah dihapus dari layar (penomoran kini diatur lewat Riwayat
 * Penyuratan), sehingga parameternya ikut dihapus.
 */

/**
 * @param maksTerpakai nomor tertinggi yang sudah dipakai pada tahun surat
 * @returns nomor urut yang akan dipakai untuk surat PERTAMA
 */
export const nomorPertama = (maksTerpakai: number): number => {
  const maks = Number.isFinite(Number(maksTerpakai)) ? Math.max(0, Number(maksTerpakai)) : 0;
  return maks + 1;
};
