/**
 * Menerjemahkan kode galat MySQL menjadi kalimat yang bisa dibaca pengguna.
 *
 * Sebelumnya route kegiatan meneruskan `error.sqlMessage` apa adanya ke layar,
 * sehingga pengguna melihat teks seperti:
 *
 *   Cannot add or update a child row: a foreign key constraint fails
 *   (`kharisma_db`.`kegiatan`, CONSTRAINT `fk_kegiatan_ketua_tim` ...)
 *
 * Itu membocorkan nama basis data, nama tabel, dan nama constraint ke siapa pun
 * yang bisa memicu galatnya, sekaligus tidak memberi tahu apa yang harus
 * diperbaiki. Sebaliknya, menelan semuanya jadi "500 galat" juga pernah dicoba
 * dan justru menyembunyikan penyebab dari laporan bug.
 *
 * Jalan tengahnya: pesan teknis tetap dicatat ke log server, sedangkan pengguna
 * menerima kalimat yang bisa ditindaklanjuti — dan kode yang sebenarnya
 * kesalahan MASUKAN dibalas 400, bukan 500.
 *
 * PENTING untuk kode server: impor lewat jalur relatif
 * (`../../shared/pesanGalatSql`), BUKAN `@shared/...`.
 */

/** Kode MySQL yang sebetulnya kesalahan masukan, bukan kerusakan aplikasi. */
const PESAN_PER_KODE: Record<string, string> = {
  // Menunjuk baris yang tidak ada di tabel induk.
  ER_NO_REFERENCED_ROW: 'Ada data pilihan yang sudah tidak tersedia lagi. Muat ulang halaman, lalu pilih kembali.',
  ER_NO_REFERENCED_ROW_2: 'Ada data pilihan yang sudah tidak tersedia lagi. Muat ulang halaman, lalu pilih kembali.',
  // Baris induk masih dipakai baris lain.
  ER_ROW_IS_REFERENCED: 'Data ini masih dipakai di tempat lain, jadi tidak bisa diubah atau dihapus.',
  ER_ROW_IS_REFERENCED_2: 'Data ini masih dipakai di tempat lain, jadi tidak bisa diubah atau dihapus.',
  ER_DUP_ENTRY: 'Data dengan penanda yang sama sudah ada. Periksa lagi isian yang harus unik.',
  ER_BAD_NULL_ERROR: 'Ada isian wajib yang masih kosong.',
  ER_DATA_TOO_LONG: 'Ada isian yang terlalu panjang untuk disimpan.',
};

export const KODE_SALAH_MASUKAN: readonly string[] = Object.keys(PESAN_PER_KODE);

/**
 * Pesan siap tampil. Kode yang tidak dikenal memakai `bawaan` — sengaja, supaya
 * galat tak terduga tidak menyamar jadi kesalahan pengguna.
 */
export const pesanGalatSql = (kode: string | undefined | null, bawaan: string): string =>
  (kode && PESAN_PER_KODE[kode]) || bawaan;

/** 400 untuk kesalahan masukan, 500 untuk sisanya. */
export const statusGalatSql = (kode: string | undefined | null): 400 | 500 =>
  kode && PESAN_PER_KODE[kode] ? 400 : 500;
