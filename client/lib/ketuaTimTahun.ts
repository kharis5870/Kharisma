/**
 * Ketua tim mana yang boleh dipilih untuk sebuah kegiatan.
 *
 * Kepengurusan dicatat per tahun (migrasi 2026-09-28), jadi kegiatan tahun 2027
 * harus memilih dari ketua tim 2027 — bukan dari seluruh angkatan sekaligus.
 *
 * Tahunnya diambil dari TANGGAL MULAI PERSIAPAN kegiatan itu. Selama jadwal
 * belum diisi, yang dipakai tahun berjalan: itulah tebakan yang hampir selalu
 * benar, dan formnya tetap bisa dipakai sebelum jadwalnya ditentukan.
 */

export interface KetuaTimBertahun {
  id: string;
  tahun?: number;
}

/** Empat digit pertama; lihat alasannya di `tahunKegiatan`. */
const tahunDariTanggal = (tanggal: unknown): number | null => {
  const cocok = String(tanggal ?? '').match(/^(\d{4})-\d{2}-\d{2}/);
  return cocok ? Number(cocok[1]) : null;
};

/**
 * Tahun kepengurusan yang berlaku untuk kegiatan ini.
 *
 * `tanggalMulaiPersiapan` bisa berupa teks ISO (dari database) atau Date (dari
 * pemilih tanggal di form), jadi keduanya diterima.
 */
export const tahunUntukKetuaTim = (
  tanggalMulaiPersiapan: string | Date | null | undefined,
  hariIni: Date = new Date(),
): number => {
  if (tanggalMulaiPersiapan instanceof Date) {
    return Number.isNaN(tanggalMulaiPersiapan.getTime())
      ? hariIni.getFullYear()
      : tanggalMulaiPersiapan.getFullYear();
  }
  return tahunDariTanggal(tanggalMulaiPersiapan) ?? hariIni.getFullYear();
};

/** Ketua tim pada satu tahun kepengurusan. */
export const ketuaTimTahun = <T extends KetuaTimBertahun>(
  daftar: readonly T[],
  tahun: number,
): T[] => daftar.filter(kt => Number(kt.tahun) === tahun);

/**
 * Tahun terdekat SEBELUM tahun ini yang masih punya ketua tim.
 *
 * Dipakai untuk menawarkan jalan keluar ketika kepengurusan tahun berjalan
 * belum didaftarkan: "Belum ada ketua tim untuk 2027. Pakai daftar 2026?" —
 * lebih baik daripada dropdown kosong tanpa penjelasan. Null berarti tidak ada
 * tahun sebelumnya sama sekali, jadi tidak ada yang bisa ditawarkan.
 */
export const tahunCadangan = (
  daftar: readonly KetuaTimBertahun[],
  tahun: number,
): number | null => {
  const sebelumnya = daftar
    .map(kt => Number(kt.tahun))
    .filter(t => Number.isFinite(t) && t < tahun);
  return sebelumnya.length > 0 ? Math.max(...sebelumnya) : null;
};
