/**
 * Pemeriksaan kelengkapan alokasi PPL sebelum kegiatan disimpan.
 *
 * Semua temuan di sini adalah PERINGATAN, bukan larangan: sebuah kegiatan boleh
 * disimpan setengah jadi lalu dilengkapi kemudian. Tapi beban kerja 0, mitra
 * tanpa PML, atau pengaturan honor yang kosong hampir selalu berarti lupa —
 * dan akibatnya baru ketahuan jauh kemudian: honor Rp 0 di rekap, progress
 * mitra yang tidak bisa diperbarui siapa pun karena tidak ada PML-nya.
 *
 * Karena itu halaman Input dan Edit Kegiatan menampilkan daftar ini dalam
 * dialog konfirmasi "Periksa lagi / Tetap simpan" sebelum mengirim.
 *
 * Murni — tanpa React, tanpa store — supaya kedua halaman memakai aturan yang
 * sama persis dan aturannya bisa diuji.
 */

export type TahapAlokasi = 'listing' | 'pencacahan' | 'pengolahan-analisis';

export const LABEL_TAHAP_ALOKASI: Record<TahapAlokasi, string> = {
  'listing': 'Listing',
  'pencacahan': 'Pencacahan',
  'pengolahan-analisis': 'Pengolahan',
};

export interface AlokasiDiperiksa {
  tahap: TahapAlokasi;
  /** Nama mitra; kosong bila mitranya belum dipilih. */
  nama?: string | null;
  /** Mitra sudah dipilih (ppl_master_id terisi). */
  adaMitra: boolean;
  bebanKerja: number;
  adaPml: boolean;
}

export interface PengaturanTahapDiperiksa {
  tahap: TahapAlokasi;
  satuanBebanKerja?: string | null;
  hargaSatuan: number;
  adaRentang: boolean;
}

export interface KelompokPeringatan {
  judul: string;
  rincian: string[];
}

const daftarNama = (xs: AlokasiDiperiksa[]) =>
  xs.map(a => a.nama?.trim() || '(tanpa nama)').join(', ');

/**
 * Mengumpulkan peringatan per tahap. Hanya tahap yang punya alokasi yang
 * diperiksa pengaturan honornya — tahap tanpa mitra memang tidak butuh honor.
 */
export const periksaKelengkapanAlokasi = (
  alokasi: AlokasiDiperiksa[],
  pengaturan: PengaturanTahapDiperiksa[],
): KelompokPeringatan[] => {
  const hasil: KelompokPeringatan[] = [];
  const tahapDipakai = (Object.keys(LABEL_TAHAP_ALOKASI) as TahapAlokasi[])
    .filter(t => alokasi.some(a => a.tahap === t));

  for (const tahap of tahapDipakai) {
    const label = LABEL_TAHAP_ALOKASI[tahap];
    const milikTahap = alokasi.filter(a => a.tahap === tahap);
    const rincian: string[] = [];

    const tanpaMitra = milikTahap.filter(a => !a.adaMitra);
    if (tanpaMitra.length > 0) {
      rincian.push(`${tanpaMitra.length} alokasi belum memilih mitra — alokasi ini tidak akan ikut tersimpan.`);
    }

    const bermitra = milikTahap.filter(a => a.adaMitra);
    const bebanNol = bermitra.filter(a => !a.bebanKerja || a.bebanKerja <= 0);
    if (bebanNol.length > 0) {
      rincian.push(`Beban kerja masih 0: ${daftarNama(bebanNol)}.`);
    }
    const tanpaPml = bermitra.filter(a => !a.adaPml);
    if (tanpaPml.length > 0) {
      rincian.push(`Belum punya PML: ${daftarNama(tanpaPml)}.`);
    }

    const atur = pengaturan.find(p => p.tahap === tahap);
    const kosong: string[] = [];
    if (!atur?.satuanBebanKerja?.trim()) kosong.push('satuan beban kerja');
    if (!atur || !atur.hargaSatuan || atur.hargaSatuan <= 0) kosong.push('harga per satuan');
    if (!atur?.adaRentang) kosong.push('rentang tanggal honor');
    if (kosong.length > 0) {
      rincian.push(`Pengaturan honor belum diisi: ${kosong.join(', ')}.`);
    }

    if (rincian.length > 0) hasil.push({ judul: `Tahap ${label}`, rincian });
  }
  return hasil;
};

/**
 * Menyusun isi dialog konfirmasi dari daftar peringatan.
 *
 * Ada di sini, bukan ditulis langsung di JSX, karena kalimatnya perlu baris
 * baru sungguhan — dan merangkainya di dalam atribut JSX membuat baris yang
 * panjang dan mudah salah escape. `ConfirmationModal` mencetaknya dengan
 * `whitespace-pre-line`, jadi "\n" di sini tampil sebagai ganti baris.
 */
export const teksPeringatan = (daftar: KelompokPeringatan[]): string =>
  daftar
    .map(k => [k.judul + ':', ...k.rincian.map(r => '• ' + r)].join('\n'))
    .join('\n\n');
