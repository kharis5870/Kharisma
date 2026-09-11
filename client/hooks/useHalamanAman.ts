import { useEffect } from 'react';

/**
 * Menjaga nomor halaman tetap berada di dalam jumlah halaman yang tersedia.
 *
 * Masalah yang diatasi: pengguna berada di halaman 3, lalu mengetik di kotak
 * pencarian atau memasang filter sehingga hasilnya menyusut jadi 1 halaman.
 * Nomor halaman tidak ikut mundur, jadi tabel tampil KOSONG padahal datanya
 * ada — hanya di halaman sebelumnya. Pengguna mengira datanya hilang.
 *
 * Sebagian halaman sudah memanggil `setCurrentPage(1)` saat jumlah baris per
 * halaman diubah, tapi tidak ada satu pun yang melakukannya untuk pencarian
 * dan filter. Menambahkan reset di setiap kontrol satu per satu mudah
 * terlewat; menjaga batasnya di satu tempat berlaku untuk semua penyebab,
 * termasuk data yang berkurang karena dihapus atau selesai dimuat ulang.
 */

/**
 * Nomor halaman yang sudah dijamin valid.
 *
 * @param halaman        nomor halaman saat ini
 * @param totalHalaman   jumlah halaman yang tersedia
 * @param halamanPertama 1 bila penomoran mulai dari 1, 0 bila berbasis indeks
 */
export const halamanAman = (
  halaman: number,
  totalHalaman: number,
  halamanPertama: 0 | 1 = 1,
): number => {
  // Tanpa data sama sekali, halaman yang sah hanya yang pertama.
  const maksimum = Math.max(halamanPertama, totalHalaman - 1 + halamanPertama);
  if (halaman > maksimum) return maksimum;
  if (halaman < halamanPertama) return halamanPertama;
  return halaman;
};

export function useHalamanAman(
  halaman: number,
  totalHalaman: number,
  setHalaman: (n: number) => void,
  halamanPertama: 0 | 1 = 1,
) {
  useEffect(() => {
    const aman = halamanAman(halaman, totalHalaman, halamanPertama);
    if (aman !== halaman) setHalaman(aman);
    // setHalaman sengaja tidak diikutkan: sebagian pemanggil mengoper fungsi
    // anonim yang identitasnya berubah tiap render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [halaman, totalHalaman, halamanPertama]);
}
