// server/services/rentangHonorSql.ts

/**
 * Fragmen SQL "kapan honor sebuah tahap berlaku", dipakai bersama oleh seluruh
 * layanan yang menyaring kegiatan menurut periode.
 *
 * KENAPA SATU TEMPAT
 * Potongan ini sebelumnya disalin di `honorService` dan `kontrakService`, dan
 * sebentar lagi dibutuhkan juga oleh `pplService` dan `pmlService`. Salinan
 * yang menyimpang adalah cara paling sunyi untuk membuat dua layar melaporkan
 * angka berbeda atas data yang sama: keduanya tampak masuk akal, tidak ada yang
 * melempar galat, dan yang keliru baru ketahuan saat angkanya dipakai membayar
 * orang. Karena itu aturannya ditulis sekali di sini.
 *
 * DUA ATURAN YANG TIDAK BOLEH BERUBAH DIAM-DIAM
 *
 * 1. FALLBACK ke kolom `bulanHonor*` yang lama. Kegiatan lama hanya menyimpan
 *    bulan, bukan rentang tanggal. Tanpa fallback ini baris-baris itu lenyap
 *    dari seluruh rekap — bukan tampil salah, melainkan hilang sama sekali.
 *
 * 2. BERIRISAN, bukan termuat seluruhnya. Honor listing 1-15 Januari tetap ikut
 *    terhitung saat difilter 10-31 Januari. Kalau syaratnya diperketat menjadi
 *    "termuat seluruhnya", pekerjaan yang melintasi batas filter akan hilang
 *    dari rekap tanpa jejak.
 *
 * Semua fragmen mengandaikan kueri pemanggilnya memakai alias `p` untuk tabel
 * `ppl` dan `k` untuk tabel `kegiatan`.
 */

export type TahapHonorSql = 'Listing' | 'Pencacahan' | 'Pengolahan';

export interface RentangHonorSql {
  mulai: string;
  selesai: string;
  /** Kolom bulan lama, masih dipakai sebagian kueri sebagai acuan. */
  bulan: string;
}

/** Tanggal mulai/selesai honor sebuah tahap, dengan fallback ke `bulanHonor*`. */
export const rentangHonorSql = (tahap: TahapHonorSql): RentangHonorSql => {
  const bulanKolom = `k.bulanHonor${tahap}`;
  const awalBulan = `STR_TO_DATE(CONCAT('01-', ${bulanKolom}), '%d-%m-%Y')`;
  return {
    mulai: `COALESCE(k.tanggalMulaiHonor${tahap}, ${awalBulan})`,
    selesai: `COALESCE(k.tanggalSelesaiHonor${tahap}, LAST_DAY(${awalBulan}))`,
    bulan: bulanKolom,
  };
};

export const listingRange = rentangHonorSql('Listing');
export const pencacahanRange = rentangHonorSql('Pencacahan');
export const pengolahanRange = rentangHonorSql('Pengolahan');

/**
 * Syarat beririsan untuk SATU tahap. Menyediakan dua penampung, berurutan:
 * tanggal SELESAI filter lebih dulu, baru tanggal MULAI filter.
 */
export const kondisiOverlap = (r: RentangHonorSql): string =>
  `(${r.mulai} <= ? AND ${r.selesai} >= ?)`;

/**
 * Syarat beririsan untuk ketiga tahap sekaligus, dipilih menurut `p.tahap`.
 *
 * Membutuhkan ENAM penampung, dan urutannya ditentukan `paramPeriode` — jangan
 * pernah menyusunnya sendiri di pemanggil.
 */
export const KONDISI_PERIODE = `(
    (p.tahap = 'listing'             AND ${kondisiOverlap(listingRange)}) OR
    (p.tahap = 'pencacahan'          AND ${kondisiOverlap(pencacahanRange)}) OR
    (p.tahap = 'pengolahan-analisis' AND ${kondisiOverlap(pengolahanRange)})
)`;

/**
 * Penampung untuk `KONDISI_PERIODE`, tiga pasang (selesai, mulai).
 *
 * Urutan terbalik itu disengaja dan mudah salah: syaratnya berbunyi
 * `mulaiHonor <= ? AND selesaiHonor >= ?`, sehingga penampung pertama tiap
 * pasangan adalah akhir periode filter, bukan awalnya.
 */
export const paramPeriode = (mulai: string, selesai: string): string[] => [
  selesai, mulai, selesai, mulai, selesai, mulai,
];

/** Tanggal mulai honor sesuai tahap baris tersebut, sebagai 'yyyy-MM-dd'. */
export const MULAI_SESUAI_TAHAP = `CASE p.tahap
    WHEN 'listing' THEN DATE_FORMAT(${listingRange.mulai}, '%Y-%m-%d')
    WHEN 'pencacahan' THEN DATE_FORMAT(${pencacahanRange.mulai}, '%Y-%m-%d')
    WHEN 'pengolahan-analisis' THEN DATE_FORMAT(${pengolahanRange.mulai}, '%Y-%m-%d')
END`;

/** Tanggal selesai honor sesuai tahap baris tersebut, sebagai 'yyyy-MM-dd'. */
export const SELESAI_SESUAI_TAHAP = `CASE p.tahap
    WHEN 'listing' THEN DATE_FORMAT(${listingRange.selesai}, '%Y-%m-%d')
    WHEN 'pencacahan' THEN DATE_FORMAT(${pencacahanRange.selesai}, '%Y-%m-%d')
    WHEN 'pengolahan-analisis' THEN DATE_FORMAT(${pengolahanRange.selesai}, '%Y-%m-%d')
END`;
