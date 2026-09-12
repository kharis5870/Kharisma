/**
 * Pilihan periode siap pakai untuk menyaring daftar menurut honor kegiatan.
 *
 * Dipakai Daftar PPL dan Daftar PML, dan sengaja murni (hanya tanggal, tanpa
 * React) supaya batas-batasnya bisa diuji — terutama batas triwulan dan akhir
 * bulan Februari, dua tempat yang paling sering salah bila dihitung manual.
 *
 * "Bulan Depan" ada dan "Bulan Lalu" tidak, mengikuti cara kerja di kantor:
 * kegiatan biasanya diinput di akhir bulan untuk dijalankan awal bulan
 * berikutnya, jadi yang perlu dilihat sebelum menambah beban adalah bulan DEPAN.
 */

export type KunciPeriode = 'semua' | 'bulan-ini' | 'bulan-depan' | 'triwulan-ini' | 'tahun-ini';

export interface RentangPeriode {
  mulai: string;
  selesai: string;
}

const dua = (n: number): string => String(n).padStart(2, '0');

const teks = (tahun: number, bulan1: number, hari: number): string =>
  `${tahun}-${dua(bulan1)}-${dua(hari)}`;

/** Hari terakhir sebuah bulan (bulan berbasis 1). Menangani tahun kabisat. */
export const hariTerakhir = (tahun: number, bulan1: number): number =>
  new Date(tahun, bulan1, 0).getDate();

/**
 * Rentang tanggal sebuah pilihan periode, relatif terhadap `acuan`.
 *
 * `semua` mengembalikan null, artinya "jangan menyaring sama sekali" — berbeda
 * dari rentang yang sangat lebar, yang tetap akan membuang kegiatan tanpa
 * tanggal honor.
 */
export const rentangPeriode = (kunci: KunciPeriode, acuan = new Date()): RentangPeriode | null => {
  const tahun = acuan.getFullYear();
  const bulan1 = acuan.getMonth() + 1;

  switch (kunci) {
    case 'semua':
      return null;

    case 'bulan-ini':
      return { mulai: teks(tahun, bulan1, 1), selesai: teks(tahun, bulan1, hariTerakhir(tahun, bulan1)) };

    case 'bulan-depan': {
      // Desember berpindah tahun; dihitung lewat Date supaya tidak ada
      // penanganan khusus yang gampang terlewat.
      const depan = new Date(tahun, acuan.getMonth() + 1, 1);
      const t = depan.getFullYear();
      const b = depan.getMonth() + 1;
      return { mulai: teks(t, b, 1), selesai: teks(t, b, hariTerakhir(t, b)) };
    }

    case 'triwulan-ini': {
      const awal = Math.floor((bulan1 - 1) / 3) * 3 + 1;
      const akhir = awal + 2;
      return { mulai: teks(tahun, awal, 1), selesai: teks(tahun, akhir, hariTerakhir(tahun, akhir)) };
    }

    case 'tahun-ini':
      return { mulai: teks(tahun, 1, 1), selesai: teks(tahun, 12, 31) };
  }
};

export const LABEL_PERIODE: Record<KunciPeriode, string> = {
  'semua': 'Semua Periode',
  'bulan-ini': 'Bulan Ini',
  'bulan-depan': 'Bulan Depan',
  'triwulan-ini': 'Triwulan Ini',
  'tahun-ini': 'Tahun Ini',
};

export const URUTAN_PERIODE: KunciPeriode[] =
  ['semua', 'bulan-ini', 'bulan-depan', 'triwulan-ini', 'tahun-ini'];

/** Potongan query string untuk endpoint yang menerima periode opsional. */
export const kueriPeriode = (rentang: RentangPeriode | null): string =>
  rentang ? `?tanggalMulai=${rentang.mulai}&tanggalSelesai=${rentang.selesai}` : '';
