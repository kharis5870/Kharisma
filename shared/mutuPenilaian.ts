/**
 * Skala dan ambang mutu penilaian mitra.
 *
 * Ambang 8 dan 6 sebelumnya tersalin di beberapa tempat: `getRatingColor` di
 * modal Penilaian Mitra dan Badge rata-rata di tabelnya. Dikumpulkan di sini
 * supaya angka yang sama tidak menyimpang antar-layar.
 *
 * Modul ini dipakai klien DAN server, jadi harus murni — hanya angka dan
 * string, tanpa impor apa pun.
 *
 * PENTING untuk kode server: impor lewat jalur relatif
 * (`../../shared/mutuPenilaian`), BUKAN `@shared/...`.
 */

/** Nilai yang boleh dipilih. Kolomnya `int(2)` di database. */
export const SKALA_NILAI: readonly number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export const NILAI_MINIMUM = 1;
export const NILAI_MAKSIMUM = 10;

export type TingkatMutu = 'baik' | 'cukup' | 'kurang';

/**
 * Tingkat mutu sebuah nilai. `null` bila bukan angka — dipakai untuk keadaan
 * "belum dinilai", yang berbeda dari "nilainya rendah".
 *
 * Menerima pecahan karena juga dipakai untuk rata-rata tiga aspek.
 */
export const tingkatMutu = (nilai: number | string | null | undefined): TingkatMutu | null => {
  if (nilai === null || nilai === undefined || nilai === '') return null;
  const n = Number(nilai);
  if (!Number.isFinite(n)) return null;
  if (n >= 8) return 'baik';
  if (n >= 6) return 'cukup';
  return 'kurang';
};

/**
 * Nilai yang sah untuk disimpan: bilangan BULAT 1–10.
 *
 * Sampai sekarang tidak ada pemeriksaan rentang di server sama sekali, padahal
 * kolomnya `int(2)` — klien mana pun bisa mengirim 99 dan ia tersimpan apa
 * adanya, lalu merusak rata-rata mitra tersebut.
 */
export const nilaiPenilaianSah = (nilai: unknown): boolean => {
  const n = Number(nilai);
  return typeof nilai === 'number'
    && Number.isInteger(n)
    && n >= NILAI_MINIMUM
    && n <= NILAI_MAKSIMUM;
};

/** Rata-rata tiga aspek, dibulatkan dua desimal seperti kolom `rata_rata`. */
export const rataRataPenilaian = (a: number, b: number, c: number): number =>
  Math.round(((a + b + c) / 3) * 100) / 100;
