/**
 * Pengaturan ulang nomor surat sebuah periode.
 *
 * Nomor surat dipesan secara permanen: sekali seorang mitra punya baris di
 * `kontrak_mitra`, generate ulang selalu mengembalikan nomor yang sama, dan
 * isian "Mulai dari Nomor" tidak berpengaruh sama sekali. Itu memang disengaja
 * — surat resmi tidak boleh berganti nomor diam-diam.
 *
 * Konsekuensinya, satu-satunya cara menomori ulang adalah menghapus nomor
 * periode tersebut lebih dulu. Karena tindakan itu tidak bisa dibatalkan dan
 * bisa melahirkan dua surat bernomor sama, ia dijaga frasa konfirmasi yang
 * harus diketik pengguna — dan frasa yang sama diperiksa ulang di server,
 * supaya permintaan liar tanpa melewati layar ikut tertolak.
 *
 * PENTING untuk kode server: impor lewat jalur relatif
 * (`../../shared/aturUlangNomor`), BUKAN `@shared/...`.
 */

export const FRASA_KONFIRMASI_ATUR_ULANG = 'ATUR ULANG';

/**
 * Frasa konfirmasi sah?
 *
 * Toleran terhadap spasi berlebih dan huruf kecil — pengguna sedang mengetik
 * ulang sebuah frasa, bukan kata sandi. TIDAK toleran terhadap salah ketik:
 * itulah gunanya frasa ini ada.
 */
export const konfirmasiAturUlangSah = (teks: unknown): boolean =>
  typeof teks === 'string'
  && teks.trim().replace(/\s+/g, ' ').toUpperCase() === FRASA_KONFIRMASI_ATUR_ULANG;

export interface RingkasanNomorPeriode {
  jumlah: number;
  /** Berapa di antaranya yang sudah punya nomor BAST. */
  jumlahBast: number;
  nomorTerkecil: number | null;
  nomorTerbesar: number | null;
}

/** Meringkas nomor sebuah periode, untuk kalimat peringatan di dialog. */
export const ringkasNomorPeriode = (
  baris: { nomorUrut?: number | null; nomorBast?: string | null }[],
): RingkasanNomorPeriode => {
  const urut = baris
    .map(b => Number(b.nomorUrut))
    .filter(n => Number.isFinite(n) && n > 0);

  return {
    jumlah: urut.length,
    jumlahBast: baris.filter(b => !!b.nomorBast).length,
    nomorTerkecil: urut.length ? Math.min(...urut) : null,
    nomorTerbesar: urut.length ? Math.max(...urut) : null,
  };
};

const tigaDigit = (n: number) => String(n).padStart(3, '0');

/** Kalimat siap tampil, mis. "4 nomor SPK (001–004) akan dihapus." */
export const kalimatRingkasanNomor = (r: RingkasanNomorPeriode): string => {
  if (r.jumlah === 0) return 'Belum ada nomor surat pada periode ini.';

  const rentang = r.nomorTerkecil === r.nomorTerbesar
    ? tigaDigit(r.nomorTerkecil!)
    : `${tigaDigit(r.nomorTerkecil!)}–${tigaDigit(r.nomorTerbesar!)}`;

  const inti = `${r.jumlah} nomor Surat PK (${rentang}) akan dihapus.`;
  return r.jumlahBast > 0
    ? `${inti} ${r.jumlahBast} di antaranya sudah punya nomor BAST, dan nomor BAST itu ikut hilang.`
    : inti;
};
