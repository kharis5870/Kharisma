import type { PPL, ProgressType } from "@shared/api";

/**
 * Aturan perpindahan progress mitra, dipisah dari komponen supaya bisa diuji.
 *
 * Progress bergerak berurutan antar tahap: menaikkan satu tahap berarti
 * mengambil dari tahap sebelumnya. Tahap pertama (`open` / `belum_entry`)
 * dihitung otomatis sebagai sisa, jadi tidak bisa diubah langsung.
 */

export const TAHAP_PENDATAAN: ProgressType[] = ['open', 'submit', 'diperiksa', 'approved'];
export const TAHAP_PENGOLAHAN: ProgressType[] = ['belum_entry', 'sudah_entry', 'validasi', 'clean'];

export type KunciProgressDapatDiubah =
  | 'submit' | 'diperiksa' | 'approved'
  | 'sudah_entry' | 'validasi' | 'clean';

export interface HasilValidasi {
  ok: boolean;
  /** Pesan siap tampil di bawah kotak isian yang bermasalah. */
  pesan?: string;
  /** Progress hasil perpindahan, hanya terisi bila ok. */
  progressBaru?: Partial<Record<ProgressType, number>>;
}

/** Urutan tahap yang berlaku untuk sebuah alokasi PPL. */
export const tahapUntuk = (tahap: PPL['tahap']): ProgressType[] =>
  tahap === 'listing' || tahap === 'pencacahan' ? TAHAP_PENDATAAN : TAHAP_PENGOLAHAN;

/** Label tahap yang enak dibaca, untuk pesan galat. */
const LABEL: Record<string, string> = {
  open: 'Open',
  submit: 'Submit',
  diperiksa: 'Diperiksa',
  approved: 'Approved',
  belum_entry: 'Belum Entry',
  sudah_entry: 'Sudah Entry',
  validasi: 'Validasi',
  clean: 'Clean',
};

export const labelTahap = (t: ProgressType | string): string => LABEL[t] ?? String(t);

/**
 * Memvalidasi satu perubahan angka progress.
 *
 * Sebelumnya logika ini tertanam di dalam `setLocalPplProgress` di Dashboard
 * dan hasilnya hanya berupa satu modal global tanpa keterangan kotak mana yang
 * bermasalah. Dengan mengembalikan hasil terstruktur, pemanggil bisa menandai
 * kotak yang tepat.
 */
export const validasiPerpindahanProgress = (
  ppl: Pick<PPL, 'tahap' | 'bebanKerja'> & { progress?: Partial<Record<ProgressType, number>> },
  field: KunciProgressDapatDiubah,
  nilaiBaruMentah: string | number,
): HasilValidasi => {
  const nilaiBaru = parseInt(String(nilaiBaruMentah), 10);
  if (isNaN(nilaiBaru) || nilaiBaru < 0) {
    return { ok: false, pesan: 'Isi dengan angka 0 atau lebih.' };
  }

  const tahap = tahapUntuk(ppl.tahap);
  const indeks = tahap.indexOf(field);

  if (indeks <= 0) {
    return {
      ok: false,
      pesan: `Progress '${labelTahap(tahap[0])}' dihitung otomatis dan tidak dapat diubah.`,
    };
  }

  const progress = { ...(ppl.progress ?? {}) };
  const nilaiLama = progress[field] ?? 0;
  const selisih = nilaiBaru - nilaiLama;

  if (selisih === 0) return { ok: true, progressBaru: progress };

  const tahapSebelum = tahap[indeks - 1];
  const nilaiSebelum = progress[tahapSebelum] ?? 0;
  const nilaiSebelumBaru = nilaiSebelum - selisih;

  if (nilaiSebelumBaru < 0) {
    return {
      ok: false,
      pesan: `Hanya tersedia ${nilaiSebelum} di tahap '${labelTahap(tahapSebelum)}'. Kurangi angkanya.`,
    };
  }

  progress[tahapSebelum] = nilaiSebelumBaru;
  progress[field] = nilaiBaru;

  const totalBeban = parseInt(String(ppl.bebanKerja), 10) || 0;
  const totalProgress = tahap.reduce((acc, t) => acc + (progress[t] ?? 0), 0);

  if (Math.abs(totalProgress - totalBeban) > 0.01) {
    return {
      ok: false,
      pesan: `Total progress (${totalProgress}) tidak sama dengan beban kerja (${totalBeban}).`,
    };
  }

  return { ok: true, progressBaru: progress };
};

/** Kunci galat per kotak isian: `${pplId}:${field}`. */
export const kunciGalat = (pplId: number | string, field: string): string => `${pplId}:${field}`;

/**
 * Membuang SELURUH pesan galat milik satu PPL.
 *
 * Perlu karena satu perubahan menyentuh DUA tahap sekaligus: menurunkan
 * 'diperiksa' otomatis menambah 'submit'. Kalau hanya galat pada kotak yang
 * disunting yang dihapus, pesan lama di kotak tetangga akan menempel terus
 * padahal penyebabnya sudah teratasi — dan pengguna tidak punya cara
 * menghilangkannya selain menyunting kotak itu lagi.
 *
 * Setelah satu perubahan berhasil disimpan, semua kotak PPL tersebut
 * disegarkan dari nilai tersimpan, jadi tidak ada lagi angka tertolak yang
 * ditampilkan — dengan kata lain tidak ada galat yang masih relevan.
 */
export const hapusGalatPpl = (
  galat: Record<string, string>,
  pplId: number | string,
): Record<string, string> => {
  // Tanda titik dua mencegah id 1 ikut menghapus milik id 11.
  const prefiks = `${pplId}:`;
  const kunci = Object.keys(galat).filter(k => k.startsWith(prefiks));
  if (kunci.length === 0) return galat; // identitas dipertahankan, hindari render sia-sia
  const sisa = { ...galat };
  for (const k of kunci) delete sisa[k];
  return sisa;
};

/** Apakah alokasi PPL ini sudah tuntas? */
export const sudahSelesai = (
  ppl: Pick<PPL, 'tahap' | 'bebanKerja'> & { progress?: Partial<Record<ProgressType, number>> },
): boolean => {
  const totalBeban = parseInt(String(ppl.bebanKerja), 10) || 0;
  if (totalBeban === 0) return false;
  // `.at()` butuh target ES2022; proyek ini ES2020, jadi pakai indeks biasa.
  const urutan = tahapUntuk(ppl.tahap);
  const akhir: ProgressType = urutan[urutan.length - 1];
  return (ppl.progress?.[akhir] ?? 0) >= totalBeban;
};

export type StatusPengawasan = 'tidak-mengawasi' | 'selesai' | 'berjalan' | 'terlambat';

/**
 * Status agregat mitra yang diawasi seorang PML pada satu kegiatan.
 * Dipakai untuk titik warna di tombol "Update".
 */
export const statusPengawasanPML = (
  pplKegiatan: Array<Pick<PPL, 'tahap' | 'bebanKerja' | 'pml_id'> & { progress?: Partial<Record<ProgressType, number>> }>,
  userId: string | undefined,
  tenggatPerTahap: Partial<Record<PPL['tahap'], string | undefined>>,
  hariIni: Date = new Date(),
): StatusPengawasan => {
  if (!userId) return 'tidak-mengawasi';

  const milikSaya = pplKegiatan.filter(p => String(p.pml_id) === String(userId));
  if (milikSaya.length === 0) return 'tidak-mengawasi';

  const belumSelesai = milikSaya.filter(p => !sudahSelesai(p));
  if (belumSelesai.length === 0) return 'selesai';

  const adaYangLewatTenggat = belumSelesai.some(p => {
    const tenggat = tenggatPerTahap[p.tahap];
    if (!tenggat) return false;
    // Tenggat berformat 'yyyy-MM-dd'; bandingkan sebagai tanggal lokal supaya
    // tidak bergeser sehari di WIB (UTC+7).
    const [y, m, d] = tenggat.split('-').map(Number);
    if (!y || !m || !d) return false;
    return hariIni > new Date(y, m - 1, d, 23, 59, 59);
  });

  return adaYangLewatTenggat ? 'terlambat' : 'berjalan';
};
