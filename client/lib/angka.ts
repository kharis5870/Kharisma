/**
 * Helper angka bersama.
 *
 * Sebelumnya `formatHonor`/`parseHonor` disalin di tiga tempat dengan tanda
 * tangan yang tidak sama — InputKegiatan.tsx, EditActivity.tsx (identik), dan
 * useInputKegiatanStore.ts (mengembalikan number). Perbedaan itu pernah
 * menyebabkan `hargaSatuan` tersimpan rusak. Semua disatukan di sini.
 */

/** Menampilkan angka dengan pemisah ribuan gaya Indonesia: 24000 -> "24.000". */
export const formatHonor = (value: string | number): string => {
  if (value === '' || value === null || value === undefined) return '';
  const numString = String(value).replace(/[^0-9]/g, '');
  if (numString === '') return '';
  const num = Number(numString);
  if (isNaN(num)) return '';
  return num.toLocaleString('id-ID');
};

/** Membuang titik ribuan, tetap mengembalikan string: "24.000" -> "24000". */
export const parseHonor = (value: string | number): string => {
  if (value === '' || value === null || value === undefined) return '';
  return String(value).replace(/\./g, '');
};

/** Versi angka dari `parseHonor`, untuk perhitungan. Selalu aman, 0 bila gagal. */
export const parseHonorNumber = (value: string | number): number => {
  return parseInt(String(value ?? '').replace(/\./g, ''), 10) || 0;
};

/**
 * Membersihkan isian jumlah (beban kerja, volume) sambil pengguna mengetik.
 *
 * Aturannya: hanya digit, tidak boleh diawali `0`, dan tidak boleh negatif.
 * `type="number"` saja tidak cukup — tanpa `min`, peramban tetap menerima
 * `-5` dan `007`, dan nilai itu langsung masuk ke store lalu ke database.
 *
 *   sanitizeJumlah("007")  -> "7"
 *   sanitizeJumlah("-5")   -> "5"
 *   sanitizeJumlah("0")    -> ""
 *   sanitizeJumlah("12a3") -> "123"
 */
export const sanitizeJumlah = (value: string | number): string => {
  const digits = String(value ?? '').replace(/[^0-9]/g, '');
  const tanpaNolDepan = digits.replace(/^0+/, '');
  return tanpaNolDepan;
};
