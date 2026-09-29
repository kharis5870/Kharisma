/**
 * Penyaringan kegiatan menurut TAHUN, untuk Dashboard.
 *
 * Tahun sebuah kegiatan diambil dari TANGGAL MULAI PERSIAPAN — awal kegiatan,
 * dan satu-satunya tanggal yang wajib diisi di form Tambah Kegiatan, jadi
 * selalu ada. Memakai tanggal tahap lain akan membuat kegiatan yang melintasi
 * pergantian tahun berpindah-pindah kelompok tergantung tahap mana yang dilihat.
 *
 * Dipakai untuk mengarsip dan mengelompokkan secara jangka panjang: setelah
 * beberapa tahun, daftar kegiatan tanpa penyaring tahun menjadi terlalu panjang
 * untuk dibaca.
 */

/** Kegiatan yang punya tanggal mulai persiapan; bentuk lain tidak diperlukan. */
export interface KegiatanBertahun {
  tanggalMulaiPersiapan?: string | null;
}

export type SaringTahun =
  | { mode: 'semua' }
  | { mode: 'satu'; tahun: number }
  | { mode: 'rentang'; dari: number; sampai: number };

/**
 * Tahun kegiatan, atau null bila tanggalnya kosong atau tidak terbaca.
 *
 * Empat digit pertama dibaca langsung dari teksnya, TIDAK lewat `new Date`:
 * tanggal dari database tiba sebagai '2026-01-01T00:00:00.000Z', dan mengubahnya
 * menjadi Date lalu membaca `getFullYear()` mengikuti zona waktu mesin — di
 * server UTC, 1 Januari 2026 WIB terbaca sebagai 31 Desember 2025.
 */
export const tahunKegiatan = (kegiatan: KegiatanBertahun): number | null => {
  const cocok = String(kegiatan.tanggalMulaiPersiapan ?? '').match(/^(\d{4})-\d{2}-\d{2}/);
  return cocok ? Number(cocok[1]) : null;
};

/** Tahun yang benar-benar ada di data, terbaru lebih dulu. */
export const tahunTersedia = (daftar: readonly KegiatanBertahun[]): number[] => {
  const set = new Set<number>();
  for (const k of daftar) {
    const tahun = tahunKegiatan(k);
    if (tahun !== null) set.add(tahun);
  }
  return [...set].sort((a, b) => b - a);
};

/**
 * Apakah kegiatan ini lolos penyaring tahun?
 *
 * Kegiatan tanpa tanggal mulai persiapan hanya muncul pada mode 'semua'. Ia
 * tidak dapat dikelompokkan ke tahun mana pun, dan menyembunyikannya pada mode
 * 'semua' akan membuatnya hilang dari aplikasi tanpa jejak.
 */
export const cocokTahun = (kegiatan: KegiatanBertahun, saring: SaringTahun): boolean => {
  if (saring.mode === 'semua') return true;
  const tahun = tahunKegiatan(kegiatan);
  if (tahun === null) return false;
  if (saring.mode === 'satu') return tahun === saring.tahun;
  // Rentang ditulis terbalik (2026 s.d. 2024) tetap dibaca sebagai rentang yang
  // sama, bukan menghasilkan daftar kosong yang membingungkan.
  const dari = Math.min(saring.dari, saring.sampai);
  const sampai = Math.max(saring.dari, saring.sampai);
  return tahun >= dari && tahun <= sampai;
};

/** Keterangan singkat penyaring yang sedang aktif, untuk judul ekspor. */
export const labelSaringTahun = (saring: SaringTahun): string => {
  if (saring.mode === 'semua') return 'Semua tahun';
  if (saring.mode === 'satu') return `Tahun ${saring.tahun}`;
  const dari = Math.min(saring.dari, saring.sampai);
  const sampai = Math.max(saring.dari, saring.sampai);
  return dari === sampai ? `Tahun ${dari}` : `Tahun ${dari}–${sampai}`;
};
