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

/**
 * Nilai dalam skala 1–5, untuk dilaporkan ke SOBAT.
 *
 * Penilaian di aplikasi ini memakai skala 1–10, sedangkan SOBAT memakai 1–5.
 * Konversinya DIBAGI DUA — keputusan pemilik proses — sehingga 10 menjadi 5,0
 * dan 7 menjadi 3,5; pemetaan per rentang sengaja tidak dipakai karena akan
 * membuat dua mitra bernilai berbeda tampak sama.
 *
 * Hanya dipakai saat MENGEKSPOR. Yang tersimpan tetap 1–10, supaya riwayat
 * penilaian lama tidak berubah arti dan peringkatnya tetap sebanding.
 *
 * `nilaiAkhir` di Rekap Penilaian TIDAK dikonversi dengan fungsi ini: angka itu
 * rata-rata ditambah bonus 0,01 per kegiatan sebagai pemecah seri, bukan nilai
 * mutu — membaginya dua akan ikut mengecilkan bonusnya dan hasilnya bukan
 * skala apa pun.
 */
export const keSkalaLima = (nilai: number | null | undefined): number | null => {
  const n = Number(nilai);
  if (nilai === null || nilai === undefined || !Number.isFinite(n)) return null;
  return Math.round((n / 2) * 100) / 100;
};

/** Panjang komentar terpendek yang diterima; diminta SOBAT. */
export const PANJANG_MIN_KOMENTAR = 20;

/**
 * Komentar penilai yang sah: minimal 20 karakter setelah dirapikan.
 *
 * Dihitung setelah spasi berlebih dibuang, supaya dua puluh spasi tidak lolos
 * sebagai komentar. Batas ini datang dari SOBAT, dan gunanya bukan sekadar
 * memenuhi syarat: angka 1-10 tidak menjelaskan apa pun ketika mitra
 * mempertanyakan nilainya, atau ketika mitra yang sama diusulkan lagi tahun
 * depan oleh PML yang berbeda.
 */
export const komentarPenilaianSah = (teks: unknown): boolean =>
  rapikanKomentar(teks).length >= PANJANG_MIN_KOMENTAR;

/** Bentuk komentar yang disimpan: spasi ganda dan spasi tepi dibuang. */
export const rapikanKomentar = (teks: unknown): string =>
  String(teks ?? '').replace(/\s+/g, ' ').trim();

/** Pesan penolakan yang sama dipakai layar dan server. */
export const PESAN_KOMENTAR_PENDEK =
  `Komentar wajib diisi, minimal ${PANJANG_MIN_KOMENTAR} karakter.`;

/** Bintang tertinggi, mengikuti form penilaian SOBAT. */
export const BINTANG_MAKSIMUM = 5;

/**
 * Bintang 1–5 dari rata-rata nilai 1–10.
 *
 * Mengikuti Form Penilaian Petugas yang dipakai BPS Bengkulu Selatan, yang di
 * Excel memakai `=REPT("★", rata/2)` — REPT memotong pecahan, jadi 8,67 ÷ 2 =
 * 4,33 menjadi EMPAT bintang, bukan empat setengah. Tidak ada setengah bintang.
 *
 * SATU PENYIMPANGAN DARI RUMUS ITU, dan disengaja: rumus aslinya menghasilkan
 * NOL bintang untuk rata-rata di bawah 2, sedangkan form yang sudah terisi
 * selalu menampilkan minimal satu bintang untuk nilai serendah apa pun (1;
 * 1,33; 1,67 semuanya satu bintang). Batas bawah 1 itulah yang dipakai di sini,
 * karena kolom bintang menyatakan mutu terendah — bukan "belum dinilai".
 *
 * Diuji terhadap 27 pasangan nilai-bintang dari form yang sudah terisi.
 */
export const bintangPenilaian = (rataRata: number | null | undefined): number | null => {
  const n = Number(rataRata);
  if (rataRata === null || rataRata === undefined || !Number.isFinite(n)) return null;
  return Math.min(BINTANG_MAKSIMUM, Math.max(1, Math.floor(n / 2)));
};

/** Bintang sebagai teks, untuk ditampilkan dan diekspor. */
export const teksBintang = (rataRata: number | null | undefined): string => {
  const bintang = bintangPenilaian(rataRata);
  return bintang === null ? '' : '★'.repeat(bintang);
};
