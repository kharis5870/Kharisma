/**
 * Warna status terpusat.
 *
 * Warna-warna ini BUKAN permukaan tema — ia mengandung makna (hijau = selesai,
 * merah = bermasalah), jadi ronanya harus tetap sama di mode terang maupun
 * gelap. Yang berubah hanya kepekatannya.
 *
 * Sebelumnya pasangan kelas ini disalin di Dashboard.tsx, ViewDocuments.tsx,
 * DaftarPPL.tsx, dan PenilaianMitra.tsx sehingga gampang menyimpang.
 *
 * Catatan kontras: teks mode terang sengaja memakai step -800, bukan -700.
 * `text-green-700` di atas `bg-green-100` hanya 4.3:1; `-800` mencapai 6.1:1
 * tanpa biaya apa pun.
 */

/** Latar redup + teks pekat, dipakai untuk Badge status. */
export const NADA_STATUS = {
  hijau: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  kuning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
  biru: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  indigo: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300',
  ungu: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
  merah: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  jingga: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  netral: 'bg-muted text-muted-foreground',
} as const;

/** Lingkaran ikon pada modal (AlertModal, ConfirmationModal). */
export const NADA_IKON = {
  merah: 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400',
  kuning: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/40 dark:text-yellow-400',
  biru: 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400',
  hijau: 'bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400',
} as const;

/** Status dokumen. `Rejected` menyusul bersama fitur Tolak Dokumen. */
export const GAYA_STATUS_DOKUMEN: Record<string, string> = {
  Pending: NADA_STATUS.kuning,
  Reviewed: NADA_STATUS.biru,
  Approved: NADA_STATUS.hijau,
  Rejected: NADA_STATUS.merah,
};

/** Status kegiatan sebagaimana dihitung `calculateActivityStatus`. */
export const GAYA_STATUS_KEGIATAN: Record<string, string> = {
  'Persiapan': NADA_STATUS.biru,
  'Pengumpulan Data': NADA_STATUS.kuning,
  'Pengolahan & Analisis': NADA_STATUS.hijau,
  'Diseminasi & Evaluasi': NADA_STATUS.indigo,
  'Selesai': NADA_STATUS.ungu,
};

/**
 * Warna ikon peringatan. `text-destructive` di mode gelap terlalu pekat untuk
 * ikon (0 62.8% 30.6%), jadi ikon memakai pasangan red-500/red-400 dan
 * `text-destructive` disisakan untuk tombol berisi.
 */
export const IKON_PERINGATAN = 'text-red-500 dark:text-red-400';

/**
 * Posisi mitra PPL.
 *
 * Sebelumnya Manajemen Admin memakai `variant` bawaan Badge tanpa className,
 * sehingga "Pendataan" tampak biru hanya karena `default` kebetulan
 * `bg-primary`, sementara "Pengolahan" jatuh ke abu nyaris putih dan
 * "Pendataan/Pengolahan" jadi garis tepi transparan — dua nilai terakhir
 * praktis tidak berwarna. Daftar PPL sementara itu punya tiga warna sendiri.
 * Sekarang keduanya memakai peta yang sama.
 */
export const GAYA_POSISI_PPL: Record<string, string> = {
  'Pendataan': NADA_STATUS.biru,
  'Pengolahan': NADA_STATUS.jingga,
  'Pendataan/Pengolahan': NADA_STATUS.hijau,
};

/**
 * Warna tombol nilai terpilih pada modal Penilaian Mitra.
 *
 * PENTING: kelasnya HARUS memakai modifier `data-[state=on]:`. `toggleVariants`
 * (client/components/ui/toggle.tsx) sudah menetapkan
 * `data-[state=on]:bg-accent data-[state=on]:text-accent-foreground`, dan kelas
 * tanpa modifier seperti `bg-green-600` TIDAK akan menang melawannya —
 * tailwind-merge memperlakukan keduanya sebagai grup berbeda, sehingga
 * tombol yang terpilih tetap tampak abu-abu.
 */
export const NADA_TOMBOL_MUTU: Record<'baik' | 'cukup' | 'kurang', string> = {
  baik:   'data-[state=on]:bg-green-600 data-[state=on]:text-white data-[state=on]:border-green-600 data-[state=on]:hover:bg-green-700',
  cukup:  'data-[state=on]:bg-yellow-500 data-[state=on]:text-white data-[state=on]:border-yellow-500 data-[state=on]:hover:bg-yellow-600',
  kurang: 'data-[state=on]:bg-red-600 data-[state=on]:text-white data-[state=on]:border-red-600 data-[state=on]:hover:bg-red-700',
};

/** Warna teks angka nilai/rata-rata, memakai ambang yang sama. */
export const NADA_TEKS_MUTU: Record<'baik' | 'cukup' | 'kurang', string> = {
  baik:   'text-green-600 dark:text-green-300',
  cukup:  'text-yellow-600 dark:text-yellow-300',
  kurang: 'text-red-600 dark:text-red-300',
};
