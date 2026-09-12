import type { MetodePembebanan } from './pembebananHonor';
import type { BarisIsiSurat, PerubahanIsi } from './penomoranSurat';

// shared/api.ts

export interface Dokumen {
  id?: number;
  kegiatanId?: number;
  tipe: 'persiapan' | 'pengumpulan-data' | 'pengolahan-analisis' | 'diseminasi-evaluasi';
  nama: string;
  link: string;
  jenis: 'file' | 'link' | 'catatan';
  status?: 'Pending' | 'Reviewed' | 'Approved' | 'Rejected';
  uploadedAt?: string;
  isWajib?: boolean;
  catatan?: string;
  lastApproved?: string;
  lastApprovedBy?: string;
  /** Alasan penolakan. Wajib terisi saat status 'Rejected'. */
  rejectionNote?: string | null;
  rejectedAt?: string | null;
  rejectedBy?: string | null;
  /**
   * Diisi saat dokumen yang tadinya 'Rejected' diunggah ulang. Kolom terpisah,
   * bukan mengandalkan `updatedAt`, karena jalur simpan massal di
   * `updateActivity` tidak memperbarui `updatedAt`.
   */
  resubmittedAt?: string | null;
  /**
   * Kapan tim keuangan mengirim pengingat "dokumen ini belum diisi".
   *
   * Terisi berarti tombol pengingat sudah dipakai dan tidak boleh dipakai lagi
   * selama link-nya masih kosong. Dikosongkan kembali oleh server begitu
   * link-nya terisi, sehingga dokumen yang dikosongkan lagi di kemudian hari
   * bisa diingatkan sekali lagi.
   */
  pengingatDikirimPada?: string | null;
  /** Username tim keuangan yang mengirim pengingat itu. */
  pengingatDikirimOleh?: string | null;
  /**
   * Siapa yang bertanggung jawab MENGISI dokumen ini.
   *
   * 'keuangan' berarti tim keuangan (role supervisor, plus admin) mengisinya
   * langsung dari View Documents, dan dokumen itu tidak lagi menahan tenggat
   * maupun peringatan dashboard ketua tim.
   *
   * Boleh undefined pada respons lama atau data yang masih di cache — perlakukan
   * sebagai 'ketua_tim'. Pakai helper di `client/lib/hakDokumen.ts`, jangan
   * membandingkan langsung, supaya aturannya hanya ada di satu tempat.
   */
  penanggungJawab?: 'ketua_tim' | 'keuangan';
  /** USERNAME pengubah penanda, konsisten dengan kolom pelaku lain di tabel ini. */
  penanggungJawabDiubahOleh?: string | null;
  penanggungJawabDiubahPada?: string | null;
}

export type ProgressType = 'open' | 'submit' | 'diperiksa' | 'approved' | 'belum_entry' | 'sudah_entry' | 'validasi' | 'clean';

export interface HonorariumDetail {
    jenis_pekerjaan: 'listing' | 'pencacahan' | 'pengolahan';
    bebanKerja?: string;
    satuanBebanKerja?: string;
    hargaSatuan?: string;
    besaranHonor?: string;
}

export interface PPL {
  id?: number;
  kegiatanId?: number;
  ppl_master_id: string;
  pml_id?: string | null;
  namaPPL?: string;
  namaPML?: string;
  bebanKerja: string; 
  besaranHonor: string; 
  tahap: 'listing' | 'pencacahan' | 'pengolahan-analisis';
  progress?: Partial<Record<ProgressType, number>>;
  honorarium?: HonorariumDetail[];
  /**
   * Cara membebankan honor alokasi ini ke bulan-bulan yang dilalui periode
   * honornya. Hanya berarti bila periode honor tahapnya melintasi lebih dari
   * satu bulan.
   *
   * Per ALOKASI, bukan per kegiatan: batas SBML berlaku per mitra per bulan,
   * jadi mitra yang kuotanya masih longgar dan yang hampir mentok bisa diatur
   * berbeda di dalam kegiatan yang sama.
   */
  metodePembebanan?: MetodePembebanan;
  /** Bulan 'MM-YYYY' yang dipilih untuk metode 'bulan_tertentu'. */
  bulanPembebananDipilih?: string | null;
}

export interface HonorariumSettings {
  satuanBebanKerja: string;
  hargaSatuan: string;
}

export interface HonorariumSettingsMap {
  'pengumpulan-data-listing': HonorariumSettings;
  'pengumpulan-data-pencacahan': HonorariumSettings;
  'pengolahan-analisis': HonorariumSettings;
}

export interface PPLMaster {
  id: string;
  namaPPL: string;
  posisi: 'Pendataan' | 'Pengolahan' | 'Pendataan/Pengolahan';
  alamat: string;    
  noTelepon: string; 
}

export interface Kecamatan { id: number; nama: string; }
export interface Desa { id: number; nama: string; }

export interface PMLAdminData {
    id: string;
    namaPML: string;
    posisi: 'Pendataan' | 'Pengolahan' | 'Pendataan/Pengolahan';
    totalKegiatan: number;
    /**
     * Banyaknya mitra BERBEDA yang diawasi, bukan banyaknya alokasi. Seorang
     * mitra yang diawasi PML ini pada dua kegiatan tetap dihitung satu orang —
     * yang ditanyakan adalah berapa orang yang harus ia dampingi.
     */
    jumlahMitra: number;
    /**
     * Total muatan seluruh alokasi yang diawasi, dijumlahkan dari beban kerja
     * tiap alokasi. Satuannya bisa berbeda antar kegiatan (dokumen, responden),
     * jadi angka ini adalah ukuran beban kasar, bukan jumlah yang bersatuan.
     */
    totalMuatan: number;
    kecamatanId?: number | null;
    desaId?: number | null;
    namaKecamatan?: string;
    namaDesa?: string;
    kegiatanDetails: {
        nama: string;
        tahap: string;
    }[];
}

/** Daftar tim/bidang di BPS. VARCHAR di database, jadi bisa ditambah tanpa migrasi. */
export const DAFTAR_TIM = [
  'Produksi',
  'Distribusi',
  'IPDS',
  'Neraca & Analisis Statistik',
  'Sosial',
  'Umum / TU',
] as const;

export interface KetuaTim {
  id: string;
  namaKetua: string;
  nip?: string;
  /** Tim/bidang yang dipimpin, mis. "Produksi". */
  tim?: string | null;
  /** Akun `users` yang memegang ketua tim ini. Penentu penerima notifikasi. */
  userId?: string | null;
}

export interface Kegiatan {
  id: number;
  namaKegiatan: string;
  ketua_tim_id: string;
  createdBy_userId?: string | null;
  namaKetua?: string;
  /** Tim ketua yang memimpin kegiatan ini, hasil JOIN ke `ketua_tim`. */
  timKetua?: string | null;
  /**
   * Akun `users` yang memegang ketua tim kegiatan ini, hasil JOIN ke
   * `ketua_tim.user_id`. Inilah yang harus dibandingkan dengan `user.id` untuk
   * menentukan hak edit — BUKAN `ketua_tim_id`, karena `users` memakai ID
   * berpola USR### sedangkan `ketua_tim` memakai KT###, tanpa irisan sama sekali.
   * Bernilai null selama ketua tim belum ditautkan ke akun di Manajemen Admin.
   */
  ketuaTimUserId?: string | null;
  deskripsiKegiatan: string;
  adaListing: boolean;
  /**
   * Apakah kegiatan ini menangani tahap Pengolahan & Analisis / Diseminasi &
   * Evaluasi. Di BPS Kabupaten Bengkulu Selatan keduanya umumnya dikerjakan
   * provinsi atau pusat, jadi kabupaten sering hanya menjalankan pendataan.
   *
   * JANGAN dikelirukan dengan alokasi mitra bertahap 'pengolahan-analisis':
   * mitra itu bekerja pada masa PENDATAAN (entri dan cleaning), dan tidak ikut
   * hilang saat `adaPengolahan` dimatikan.
   *
   * Boleh undefined pada respons lama atau data di cache — perlakukan sebagai
   * true, karena itulah keadaan seluruh kegiatan sebelum kolomnya ada.
   */
  adaPengolahan?: boolean;
  adaDiseminasi?: boolean;
  isFasih: boolean; 
  /**
   * Bulan pembebanan honor, format "MM-YYYY". Menentukan bulan mana yang
   * dipakai saat memvalidasi HONOR_LIMIT per PPL. Kalau rentang tanggal honor
   * melintasi lebih dari satu bulan, pengguna memilih salah satunya.
   */
  bulanHonorListing?: string;
  bulanHonorPencacahan?: string;
  bulanHonorPengolahan?: string;
  /**
   * Rentang tanggal honor, format "yyyy-MM-dd". Dipakai untuk filter rekap
   * berbasis rentang dan kolom "Jangka Waktu" di Surat Perjanjian Kerja.
   */
  tanggalMulaiHonorListing?: string;
  tanggalSelesaiHonorListing?: string;
  tanggalMulaiHonorPencacahan?: string;
  tanggalSelesaiHonorPencacahan?: string;
  tanggalMulaiHonorPengolahan?: string;
  tanggalSelesaiHonorPengolahan?: string;
  status: 'Persiapan' | 'Pengumpulan Data' | 'Pengolahan & Analisis' | 'Diseminasi & Evaluasi' | 'Selesai';
  progressKeseluruhan: number;
  progressPendataanApproved: number;
  progressPengolahanApproved: number;
  progressPendataanSubmit: number;
  progressPengolahanSubmit: number;
  progressListingApproved: number;
  progressListingSubmit: number;
  progressPencacahanApproved: number;
  progressPencacahanSubmit: number;
  lastUpdated: string;
  lastUpdatedBy?: string;
  lastEdited?: string;
  lastEditedBy?: string;
  /** Kegiatan yang diarsipkan disembunyikan dari daftar utama dashboard. */
  isArsip?: boolean | number;
  arsipAt?: string | null;
  arsipBy?: string | null;
  dokumen: Dokumen[];
  ppl: PPL[];
  tanggalMulaiPersiapan?: string;
  tanggalSelesaiPersiapan?: string;
  tanggalMulaiPengumpulanData?: string;
  tanggalSelesaiPengumpulanData?: string;
  tanggalMulaiPengolahanAnalisis?: string;
  tanggalSelesaiPengolahanAnalisis?: string;
  tanggalMulaiDiseminasiEvaluasi?: string;
  tanggalSelesaiDiseminasiEvaluasi?: string;
  honorariumSettings?: HonorariumSettingsMap;
}

export interface PPLHonorData {
  id: string;
  nama: string;
  /** Total honor dalam rentang tanggal yang sedang difilter. */
  honorBulanIni: number;
  activitiesCount: number;
  kegiatanNames: string[];
  honorPerBulan: number[];
  /**
   * Rincian honor per bulan pembebanan ("MM-YYYY" -> rupiah). HONOR_LIMIT
   * berlaku per bulan, jadi status "melebihi batas" harus dinilai dari sini,
   * bukan dari total rentang yang bisa mencakup beberapa bulan.
   */
  honorPerBulanPembebanan?: Record<string, number>;
}

// ===================== Surat Perjanjian Kerja (Kontrak Mitra) =====================

/** Template surat yang dikelola tim keuangan (role admin atau supervisor). */
export interface TemplateSurat {
  id: number;
  nama_template: string;
  /** Pola nomor Surat PK. Placeholder: {nomor} {BULAN} {ROMAWI} {tahun} {bulan}. */
  format_nomor: string;
  /**
   * Pola nomor Surat BAST. Penandanya sama persis dengan `format_nomor`.
   *
   * Nomor URUT-nya bukan sekuens tersendiri: BAST memakai `nomor_urut` milik
   * SPK mitra yang sama, sedangkan penanda bulan/tahun diisi dari TANGGAL BAST.
   */
  format_nomor_bast: string;
  ppk_nama: string;
  ppk_nip: string;
  ppk_jabatan: string;
  satker_nama: string;
  satker_alamat?: string | null;
  kota?: string | null;
  pengadilan_negeri?: string | null;
  is_aktif?: boolean | number;
  updatedAt?: string;
  updatedBy?: string | null;
}

/** Satu kombinasi kegiatan x tahap dalam periode, tempat uraian tugas & MAK diatur. */
export interface UraianTugasKontrak {
  kegiatanId: number;
  namaKegiatan: string;
  jenis_pekerjaan: 'listing' | 'pencacahan' | 'pengolahan';
  /** Default `namaKegiatan + tahap` bila belum pernah diisi. */
  uraian_tugas: string;
  kode_anggaran: string;
  /** Jumlah mitra yang akan memakai uraian & MAK ini. */
  jumlahMitra: number;
  tanggalMulaiHonor?: string | null;
  tanggalSelesaiHonor?: string | null;
}

/** Satu baris tabel lampiran Surat PK. */
export interface BarisKontrak {
  /**
   * Penanda stabil satu baris: `${kegiatanId}-${jenisPekerjaan}`.
   *
   * Dipakai membandingkan isi surat sekarang dengan salinan isi saat surat
   * terbit. Uraian tugas TIDAK bisa jadi penanda karena justru itu salah satu
   * hal yang boleh berubah.
   */
  kunci?: string;
  uraianTugas: string;
  jangkaWaktuMulai?: string | null;
  jangkaWaktuSelesai?: string | null;
  volume: number;
  satuan: string;
  hargaSatuan: number;
  nilaiPerjanjian: number;
  kodeAnggaran: string;
}

/** Data lengkap satu Surat PK untuk satu mitra pada satu periode. */
export interface DataKontrakMitra {
  pplMasterId: string;
  nama: string;
  alamat?: string | null;
  baris: BarisKontrak[];
  totalHonor: number;
  jangkaWaktuMulai?: string | null;
  jangkaWaktuSelesai?: string | null;
  /**
   * Id baris `kontrak_mitra` suratnya. Terisi hanya bila suratnya sudah
   * pernah digenerate, dan dipakai untuk tindakan yang menyasar SATU surat
   * (memperbarui isinya, membatalkannya) tanpa perlu menebaknya dari periode.
   */
  suratId?: number;
  /** Terisi setelah nomor dipesan lewat POST /kontrak/nomor. */
  nomorUrut?: number;
  nomorSurat?: string;
  tanggalSurat?: string;
  /**
   * Terisi setelah BAST dibuat lewat POST /kontrak/bast/nomor.
   *
   * Kosong berarti BAST mitra ini belum pernah dibuat. Bila `nomorSurat` juga
   * kosong, BAST-nya memang belum BISA dibuat — nomornya mengikuti nomor SPK.
   */
  nomorBast?: string;
  tanggalBast?: string;
  /**
   * Perbedaan antara isi surat saat TERBIT dan data sekarang: honor berubah,
   * muatan berubah, atau ada kegiatan baru yang masuk setelah surat dibuat.
   *
   * Kosong berarti surat masih sesuai. Terisi berarti layar harus memperingatkan
   * tim keuangan, karena surat yang sudah ditandatangani tidak lagi
   * mencerminkan pekerjaan yang sebenarnya.
   */
  perubahan?: PerubahanIsi[];
}

/**
 * Satu surat sebagaimana tampil di halaman Riwayat Penyuratan.
 *
 * Surat batal IKUT terbawa — justru itu gunanya halaman ini: menjawab
 * "nomor 005 ke mana" tanpa harus membuka database. Karena itu `status`,
 * `catatan`, dan `dibatalkanPada` ada di sini, bukan hanya di tabel.
 */
export interface RiwayatSuratItem {
  id: number;
  nomorUrut: number;
  nomorSurat: string;
  nomorBast?: string | null;
  tanggalSurat: string;
  tanggalBast?: string | null;
  pplMasterId: string;
  namaPPL: string;
  periodeMulai: string;
  periodeSelesai: string;
  totalHonor: number;
  status: 'aktif' | 'batal';
  catatan?: string | null;
  dibatalkanPada?: string | null;
  dibatalkanOleh?: string | null;
  generatedBy?: string | null;
  /**
   * Isi surat: satu baris per kegiatan x tahap, beserta muatan dan honornya.
   *
   * Diambil dari salinan isi saat terbit bila ada, supaya yang tampil adalah
   * apa yang BENAR-BENAR tertulis di surat, bukan keadaan data hari ini. Untuk
   * surat lama yang terbit sebelum salinan isi disimpan, diisi dari data
   * sekarang — satu-satunya sumber yang tersisa.
   */
  baris: BarisIsiSurat[];
  /**
   * Perbedaan antara isi surat saat terbit dan data sekarang. Kosong berarti
   * surat masih sesuai; terisi berarti surat perlu dikonfirmasi ulang — itulah
   * yang ditampilkan sebagai status "Butuh Konfirmasi".
   */
  perubahan?: PerubahanIsi[];
}

/** Ringkasan satu tahun penyuratan, untuk kepala halaman Riwayat Penyuratan. */
export interface RiwayatSuratTahun {
  tahun: number;
  surat: RiwayatSuratItem[];
  /** Nomor yang tidak dipegang surat mana pun — bekas surat yang dihapus. */
  celah: number[];
}

/** Jawaban `GET /kontrak/nomor-terpakai`. */
export interface NomorTerpakaiTahun {
  tahun: number;
  /** Nomor urut tertinggi tahun itu — angka yang sama dipakai server saat memesan. */
  maksTerpakai: number;
}

/** Jawaban `POST /kontrak/nomor/atur-ulang`. */
export interface HasilAturUlangNomor {
  terhapus: number;
  jumlahBast: number;
  nomorSurat: string[];
  nomorBast: string[];
}

export interface UserData {
    id: string;
    username: string;
    password?: string;
    namaLengkap: string;
    role: 'admin' | 'supervisor' | 'user';
    isPML?: boolean;
}

export interface KetuaTimData {
    id: string;
    nama: string;
    nip: string;
    tim?: string | null;
    /** Akun `users` yang ditautkan. Kosong = belum ditautkan. */
    userId?: string | null;
    /** Nama lengkap akun tertaut, hanya untuk ditampilkan. */
    namaUser?: string | null;
}

export interface PPLAdminData {
    id: string;
    namaPPL: string;
    posisi: 'Pendataan' | 'Pengolahan' | 'Pendataan/Pengolahan';
    totalKegiatan: number;
    alamat: string;
    noTelepon: string;
    kecamatanId?: number | null;
    desaId?: number | null;
    namaKecamatan?: string; 
    namaDesa?: string;
    kegiatanDetails: {
        nama: string;
        tahap: string;
        sub_tahap?: 'listing' | 'updating' | null; 
    }[];
}

/**
 * Satu kejadian dalam riwayat sebuah kegiatan.
 *
 * Dicatat saat kejadian berlangsung, bukan dihitung saat dibaca seperti
 * notifikasi: kolom audit lain semuanya bertipe "terakhir" dan ditimpa setiap
 * perubahan, sehingga urutan kejadian tidak bisa direkonstruksi dari sana.
 */
export interface RiwayatKegiatan {
  id: number;
  kegiatanId: number;
  /** Mis. 'dokumen_ditambah', 'progress_diupdate', 'kegiatan_disunting'. */
  aksi: string;
  entitas: 'kegiatan' | 'dokumen' | 'ppl' | 'progress' | 'honor' | 'penilaian';
  entitasId?: number | null;
  /** Meringkas operasi massal: 12 dokumen sekaligus jadi satu baris. */
  jumlah: number;
  aktorUserId?: string | null;
  aktorNama?: string | null;
  ringkasan?: string | null;
  terjadiPada: string;
}

/** Jenis notifikasi, menentukan penerima, ikon, dan tujuan tautannya. */
export type NotificationKind =
  | 'document_pending'      // supervisor/admin: menunggu persetujuan
  | 'document_resubmitted'  // supervisor/admin: sudah diperbaiki setelah ditolak
  | 'document_rejected'     // ketua tim: dokumen kegiatannya ditolak
  | 'deadline_soon'         // ketua tim: H-3 / H-2 / H-1
  | 'deadline_overdue'      // ketua tim: lewat tenggat, dokumen wajib belum disetujui
  | 'progress_stale'        // ketua tim: tidak ada pembaruan > 2 hari
  | 'document_keuangan_kosong'  // supervisor/admin: dokumen keuangan belum diisi
  | 'document_reminder'         // ketua tim & pembuat kegiatan: diingatkan tim keuangan
  | 'surat_berubah';            // supervisor/admin: isi surat yang sudah terbit tidak lagi sesuai

export type NotificationSeverity = 'critical' | 'warning' | 'info';

/**
 * Notifikasi dihitung saat dibaca, bukan disimpan di tabel.
 *
 * Konsekuensi yang disepakati: tidak ada "tandai dibaca" — notifikasi hilang
 * sendiri begitu penyebabnya beres. Sebagai gantinya, tidak perlu penjadwal
 * (yang memang tidak bisa dijalankan di target deploy Netlify) dan isinya
 * selalu akurat.
 */
export interface AppNotification {
  /** Stabil dan unik lintas jenis, mis. "rejected-142", "deadline-7-persiapan". */
  id: string;
  kind: NotificationKind;
  severity: NotificationSeverity;

  kegiatanId: number;
  namaKegiatan: string;
  /** Tahap terkait; null untuk progress_stale. */
  tahap: Dokumen['tipe'] | null;

  dokumenId?: number | null;
  namaDokumen?: string | null;
  linkFile?: string | null;

  /** Nama lengkap pengunggah atau penolak, bila relevan. */
  actorName?: string | null;
  /** Alasan penolakan untuk document_rejected. */
  note?: string | null;

  /** deadline_*: sisa hari (negatif = terlambat). progress_stale: hari sejak update. */
  daysLeft?: number | null;
  /** deadline_*: tanggal tenggat 'yyyy-MM-dd'. */
  deadline?: string | null;
  /** deadline_*: jumlah dokumen wajib yang belum disetujui. */
  pendingCount?: number | null;

  occurredAt: string;
}

export interface PenilaianMitra {
  id: number;
  kegiatanId: number;
  namaKegiatan: string;
  pplId: number;
  namaPPL: string;
  pmlId: string | null;
  namaPML: string | null;
  tahap: string;
  sikapPelikaku: number | null;
  kualitasPekerjaan: number | null;
  ketepatanWaktu: number | null;
  rataRata: number | null;
  sudahDinilai: boolean;
  tanggalPenilaian?: string | null; 
  dinilaiOleh?: string | null;
}

export interface PenilaianRequest {
  penilaianId?: number; 
  pplId: number;
  kegiatanId: number;
  pmlId: string | null;
  dinilaiOleh_userId: string;
  sikapPelikaku: number;
  kualitasPekerjaan: number;
  ketepatanWaktu: number;
}

export interface RekapPenilaian {
    pplId: number;
    namaPPL: string;
    totalKegiatan: number;
    rataRataNilai: number | null;
    nilaiAkhir: number | null;
}