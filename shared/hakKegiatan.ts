/**
 * Siapa boleh mengubah apa pada sebuah kegiatan.
 *
 * Aturan ini sebelumnya tersalin di tiga layar (Dashboard, Edit Kegiatan, View
 * Documents) dan TIDAK ada sama sekali di server — jadi menyembunyikan tombol
 * adalah satu-satunya penjagaan, dan siapa pun yang memanggil API langsung bisa
 * melewatinya. Dikumpulkan di sini supaya layar dan server memakai kalimat yang
 * sama persis, dan tidak bisa menyimpang diam-diam.
 *
 * Modul murni: hanya perbandingan string. Dipakai klien DAN server.
 *
 * PENTING untuk kode server: impor lewat jalur relatif
 * (`../../shared/hakKegiatan`), BUKAN `@shared/...`.
 */

export interface PenggunaHak {
  id: string;
  role: 'admin' | 'supervisor' | 'user';
}

export interface KegiatanHak {
  /**
   * Akun `users` yang ditautkan ke ketua tim kegiatan ini
   * (`ketua_tim.user_id`), BUKAN `ketua_tim_id`.
   *
   * Keduanya memakai ruang ID yang berbeda — `USR###` versus `KT###` — jadi
   * membandingkan `user.id` ke `ketua_tim_id` tidak akan pernah benar.
   */
  ketuaTimUserId?: string | null;
  /** Akun yang membuat kegiatan ini. */
  createdBy_userId?: string | null;
}

/** Perbandingan id yang tahan terhadap beda tipe (VARCHAR vs number). */
const samaDengan = (a: unknown, b: unknown): boolean =>
  a !== null && a !== undefined && a !== '' && String(a) === String(b);

/**
 * Boleh menyunting kegiatan beserta dokumennya?
 *
 * Tiga pihak, sesuai yang berlaku di layar:
 *  - admin,
 *  - ketua tim kegiatan tersebut,
 *  - pengguna yang membuat kegiatan tersebut.
 *
 * Supervisor SENGAJA tidak termasuk: perannya memeriksa dan menyetujui, dan
 * memberinya hak menyunting membuat ia bisa memperbaiki sendiri dokumen yang
 * kemudian ia setujui sendiri.
 */
export const bolehMenyuntingKegiatan = (
  pengguna: PenggunaHak | null | undefined,
  kegiatan: KegiatanHak | null | undefined,
): boolean => {
  if (!pengguna) return false;
  if (pengguna.role === 'admin') return true;
  if (!kegiatan) return false;
  return samaDengan(kegiatan.ketuaTimUserId, pengguna.id)
    || samaDengan(kegiatan.createdBy_userId, pengguna.id);
};

/**
 * Boleh memperbarui progres seorang mitra?
 *
 * Hanya PML yang mengawasi mitra itu, ditambah admin. Ketua tim TIDAK termasuk:
 * progres dilaporkan oleh pengawas lapangannya sendiri, dan itulah yang membuat
 * angkanya bisa dipercaya.
 */
export const bolehMemperbaruiProgress = (
  pengguna: PenggunaHak | null | undefined,
  ppl: { pml_id?: string | null } | null | undefined,
): boolean => {
  if (!pengguna) return false;
  if (pengguna.role === 'admin') return true;
  if (!ppl) return false;
  return samaDengan(ppl.pml_id, pengguna.id);
};

/**
 * Boleh menilai kinerja seorang mitra pada satu alokasi?
 *
 * Aturannya sama dengan progres — PML yang mengawasi mitra itu, ditambah
 * admin — tetapi sengaja dipisah menjadi fungsi sendiri: keduanya keputusan
 * kebijakan yang berbeda dan kelak bisa berubah sendiri-sendiri.
 *
 * Sebelum ini aturan tersebut HANYA ada di layar Penilaian Mitra (tombol
 * dinonaktifkan). Server menerima penilaian dari siapa pun yang login, jadi
 * pemanggilan API langsung bisa menilai mitra PML lain.
 */
export const bolehMenilaiMitra = (
  pengguna: PenggunaHak | null | undefined,
  ppl: { pml_id?: string | null } | null | undefined,
): boolean => {
  if (!pengguna) return false;
  if (pengguna.role === 'admin') return true;
  if (!ppl) return false;
  return samaDengan(ppl.pml_id, pengguna.id);
};

/** Pesan penolakan yang sama dipakai server dan layar. */
export const PESAN_BUKAN_PEMILIK_KEGIATAN =
  'Anda hanya dapat mengubah kegiatan yang Anda buat atau yang Anda pimpin sebagai ketua tim.';

export const PESAN_BUKAN_PML =
  'Progres mitra hanya dapat diperbarui oleh PML yang mengawasinya.';

export const PESAN_BUKAN_PENILAI =
  'Mitra hanya dapat dinilai oleh PML yang mengawasinya.';
