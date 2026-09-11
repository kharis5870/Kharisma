/**
 * Penanganan id ketua tim pada kegiatan.
 *
 * Kolom `kegiatan.ketua_tim_id` punya foreign key ke `ketua_tim(id)`. Nilai
 * yang bukan id sah — string kosong, atau id yang ketua timnya sudah dihapus —
 * membuat MySQL menolak seluruh penyimpanan dengan pesan foreign key yang tidak
 * bisa dibaca pengguna.
 *
 * Ini bukan kasus teoretis: `ketua_tim` punya lubang penomoran (KT001 dan KT006
 * tidak ada), sementara `client/lib/idOtomatis.ts` sengaja mengisi ulang lubang
 * ID, dan foreign key-nya `ON DELETE SET NULL` sehingga kegiatan bisa kehilangan
 * ketua timnya tanpa pemberitahuan apa pun ke layar yang sedang terbuka.
 *
 * Modul ini dipakai klien DAN server, jadi harus murni.
 *
 * PENTING untuk kode server: impor lewat jalur relatif
 * (`../../shared/ketuaTim`), BUKAN `@shared/...`.
 */

/**
 * Menormalkan id ketua tim menjadi string bersih atau `null`.
 *
 * `'undefined'` dan `'null'` ikut ditangani karena pemilih di layar merender
 * `String(formData.ketua_tim_id)`, yang mengubah nilai kosong menjadi kedua
 * teks itu dan mengirimkannya apa adanya ke server.
 *
 * Kolomnya nullable, jadi `null` aman disimpan — artinya kegiatan belum punya
 * ketua tim, bukan galat.
 */
export const normalkanKetuaTimId = (nilai: unknown): string | null => {
  if (nilai === null || nilai === undefined) return null;
  const teks = String(nilai).trim();
  if (teks === '' || teks === 'undefined' || teks === 'null') return null;
  return teks;
};

/**
 * Apakah id ada di daftar ketua tim?
 *
 * Dibandingkan lewat `String` karena id di database bertipe VARCHAR ('KT005')
 * sementara sebagian jalur klien bisa membawanya sebagai angka.
 *
 * Daftar kosong selalu menghasilkan `false`. Pemanggil di layar WAJIB menunggu
 * daftarnya termuat sebelum memakai hasil ini untuk memberi peringatan — kalau
 * tidak, peringatan "tidak dikenal" akan berkedip saat halaman baru dibuka.
 */
export const idKetuaTimDikenal = (
  daftar: { id: string | number }[],
  id: unknown,
): boolean => {
  const dicari = normalkanKetuaTimId(id);
  if (dicari === null) return false;
  return daftar.some(k => String(k.id) === dicari);
};

/** Pesan yang sama dipakai server dan layar, supaya tidak saling menyimpang. */
export const pesanKetuaTimTidakDikenal = (id: string): string =>
  `Ketua tim "${id}" sudah tidak ada di daftar. Pilih ketua tim yang masih aktif sebelum menyimpan.`;
