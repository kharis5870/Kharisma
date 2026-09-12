/**
 * Logika penomoran dan perbandingan isi Surat PK/BAST.
 *
 * Murni — hanya angka dan string — supaya dipakai bersama oleh server (yang
 * menjalankan perubahan) dan klien (yang menampilkan pratinjau sebelum
 * pengguna mengonfirmasi), serta bisa diuji tanpa database.
 *
 * PENTING untuk kode server: impor lewat jalur relatif
 * (`../../shared/penomoranSurat`), BUKAN `@shared/...`.
 */

export type StatusSurat = 'aktif' | 'batal';

export interface SuratBernomor {
  id: number;
  nomorUrut: number;
  status: StatusSurat;
}

/**
 * Nomor yang KOSONG sama sekali dalam satu tahun: tidak dipegang surat aktif
 * maupun surat batal.
 *
 * Surat batal sengaja dianggap "memegang" nomornya: di Riwayat Surat nomor itu
 * tampil sebagai surat batal beserta catatannya, bukan sebagai lubang. Lubang
 * yang tersisa adalah nomor yang suratnya sudah dihapus — dan untuk itu log
 * `riwayat_surat` menyimpan jejaknya.
 */
export const celahNomor = (surat: SuratBernomor[]): number[] => {
  if (surat.length === 0) return [];
  const terpakai = new Set(surat.map(s => s.nomorUrut));
  const maks = Math.max(...surat.map(s => s.nomorUrut));
  const celah: number[] = [];
  for (let n = 1; n <= maks; n++) if (!terpakai.has(n)) celah.push(n);
  return celah;
};

export interface PerubahanNomor {
  id: number;
  lama: number;
  baru: number;
}

export interface RencanaRapikan {
  perubahan: PerubahanNomor[];
  /** Nomor baru yang juga dipegang surat BATAL — akan tampil ganda di riwayat. */
  bentrokDenganBatal: number[];
}

/**
 * Merapatkan nomor surat AKTIF satu tahun menjadi 1, 2, 3, ... tanpa lubang,
 * dengan urutan lamanya dipertahankan (nomor 4 mengisi 3, nomor 5 mengisi 4).
 *
 * Surat batal TIDAK ikut dirapatkan dan tidak menahan nomor: pengguna yang
 * menekan "Rapikan" justru ingin lubang bekas surat batal terisi. Akibatnya
 * sebuah surat aktif bisa memperoleh nomor yang sama dengan surat batal —
 * itu dilaporkan di `bentrokDenganBatal` supaya layar bisa menyarankan
 * menghapus surat batal tersebut.
 *
 * Urutan seri (nomor sama) dipecah dengan id, supaya hasilnya selalu sama
 * untuk data yang sama.
 */
export const rencanaRapikanNomor = (surat: SuratBernomor[]): RencanaRapikan => {
  const aktif = surat
    .filter(s => s.status === 'aktif')
    .sort((a, b) => a.nomorUrut - b.nomorUrut || a.id - b.id);
  const perubahan: PerubahanNomor[] = [];
  aktif.forEach((s, i) => {
    const baru = i + 1;
    if (s.nomorUrut !== baru) perubahan.push({ id: s.id, lama: s.nomorUrut, baru });
  });
  const nomorBatal = new Set(surat.filter(s => s.status === 'batal').map(s => s.nomorUrut));
  const nomorAkhirAktif = aktif.map((_, i) => i + 1);
  const bentrokDenganBatal = nomorAkhirAktif.filter(n => nomorBatal.has(n));
  return { perubahan, bentrokDenganBatal };
};

/**
 * Apakah sebuah nomor boleh dipakai surat aktif: tidak boleh sama dengan
 * nomor surat AKTIF lain di tahun yang sama. Bentrok dengan surat batal
 * diizinkan (surat batal tidak lagi berlaku), tapi dilaporkan layar.
 */
export const nomorBolehDipakai = (
  nomor: number,
  surat: SuratBernomor[],
  kecualiId?: number,
): boolean =>
  Number.isInteger(nomor) && nomor > 0
  && !surat.some(s => s.status === 'aktif' && s.nomorUrut === nomor && s.id !== kecualiId);

// ---------------------------------------------------------------------------
// Perbandingan isi surat saat terbit dengan data sekarang
// ---------------------------------------------------------------------------

/** Satu baris lampiran surat, dalam bentuk yang disimpan sebagai salinan. */
export interface BarisIsiSurat {
  /** `${kegiatanId}-${jenisPekerjaan}` — penanda stabil satu baris. */
  kunci: string;
  uraianTugas: string;
  volume: number;
  satuan: string;
  hargaSatuan: number;
  nilaiPerjanjian: number;
  jangkaWaktuMulai?: string | null;
  jangkaWaktuSelesai?: string | null;
}

export interface PerubahanIsi {
  jenis: 'baru' | 'hilang' | 'ubah' | 'total';
  judul: string;
  rincian: string[];
}

const rupiah = (n: number): string => `Rp ${Math.round(n).toLocaleString('id-ID')}`;

/**
 * Daftar perubahan isi surat sejak terbit. Kosong berarti surat masih sesuai.
 *
 * `terbit` null berarti surat terbit sebelum salinan isinya disimpan: yang
 * bisa dibandingkan hanya total honornya, dan layar harus jujur soal itu.
 */
export const bandingkanIsiSurat = (
  terbit: BarisIsiSurat[] | null,
  totalTerbit: number | null,
  sekarang: BarisIsiSurat[],
): PerubahanIsi[] => {
  const totalSekarang = sekarang.reduce((j, b) => j + b.nilaiPerjanjian, 0);

  if (!terbit) {
    if (totalTerbit === null || totalTerbit === totalSekarang) return [];
    return [{
      jenis: 'total',
      judul: 'Total honor berubah',
      rincian: [
        `Saat terbit ${rupiah(totalTerbit)}, sekarang ${rupiah(totalSekarang)}.`,
        'Rincian baris saat terbit tidak tersimpan — surat ini terbit sebelum fitur perbandingan ada.',
      ],
    }];
  }

  const hasil: PerubahanIsi[] = [];
  const lama = new Map(terbit.map(b => [b.kunci, b]));
  const kini = new Map(sekarang.map(b => [b.kunci, b]));

  for (const b of sekarang) {
    const l = lama.get(b.kunci);
    if (!l) {
      hasil.push({
        jenis: 'baru',
        judul: `Kegiatan baru: ${b.uraianTugas}`,
        rincian: [`${b.volume} ${b.satuan} × ${rupiah(b.hargaSatuan)} = ${rupiah(b.nilaiPerjanjian)}`],
      });
      continue;
    }
    const rincian: string[] = [];
    if (l.volume !== b.volume) rincian.push(`Muatan ${l.volume} → ${b.volume} ${b.satuan}`);
    if (l.hargaSatuan !== b.hargaSatuan) rincian.push(`Harga satuan ${rupiah(l.hargaSatuan)} → ${rupiah(b.hargaSatuan)}`);
    if (l.nilaiPerjanjian !== b.nilaiPerjanjian) rincian.push(`Nilai ${rupiah(l.nilaiPerjanjian)} → ${rupiah(b.nilaiPerjanjian)}`);
    if ((l.jangkaWaktuMulai ?? '') !== (b.jangkaWaktuMulai ?? '') || (l.jangkaWaktuSelesai ?? '') !== (b.jangkaWaktuSelesai ?? '')) {
      rincian.push(`Jangka waktu ${l.jangkaWaktuMulai ?? '-'} s.d. ${l.jangkaWaktuSelesai ?? '-'} → ${b.jangkaWaktuMulai ?? '-'} s.d. ${b.jangkaWaktuSelesai ?? '-'}`);
    }
    if (l.uraianTugas !== b.uraianTugas) rincian.push(`Uraian "${l.uraianTugas}" → "${b.uraianTugas}"`);
    if (rincian.length > 0) hasil.push({ jenis: 'ubah', judul: b.uraianTugas, rincian });
  }

  for (const l of terbit) {
    if (!kini.has(l.kunci)) {
      hasil.push({
        jenis: 'hilang',
        judul: `Tidak ada lagi: ${l.uraianTugas}`,
        rincian: [`Saat terbit ${l.volume} ${l.satuan} = ${rupiah(l.nilaiPerjanjian)}`],
      });
    }
  }
  return hasil;
};
