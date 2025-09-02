// shared/api.ts

export interface Dokumen {
  id?: number;
  kegiatanId?: number;
  tipe: 'persiapan' | 'pengumpulan-data' | 'pengolahan-analisis' | 'diseminasi-evaluasi';
  nama: string;
  link: string;
  jenis: 'file' | 'link' | 'catatan';
  status?: 'Pending' | 'Reviewed' | 'Approved';
  uploadedAt?: string;
  isWajib?: boolean;
  lastApproved?: string;
  lastApprovedBy?: string;
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
  namaPPL?: string;
  namaPML: string;
  bebanKerja: string; 
  besaranHonor: string; 
  tahap: 'pengumpulan-data' | 'pengolahan-analisis';
  progress?: Partial<Record<ProgressType, number>>;
  honorarium?: HonorariumDetail[];
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
}

export interface KetuaTim {
  id: string;
  namaKetua: string;
  nip?: string;
}

export interface Kegiatan {
  id: number;
  namaKegiatan: string;
  ketua_tim_id: string;
  namaKetua?: string;
  deskripsiKegiatan: string;
  adaListing: boolean;
  isFasih: boolean; 
  bulanPembayaranHonor?: number | string; // Diubah agar bisa menerima string dari form
  status: 'Persiapan' | 'Pengumpulan Data' | 'Pengolahan & Analisis' | 'Diseminasi & Evaluasi' | 'Selesai';
  progressKeseluruhan: number;
  progressPendataanApproved: number;
  progressPengolahanApproved: number;
  progressPendataanSubmit: number;
  progressPengolahanSubmit: number;
  lastUpdated: string;
  lastUpdatedBy?: string;
  lastEdited?: string;
  lastEditedBy?: string;
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
  honorBulanIni: number;
  activitiesCount: number;
  kegiatanNames: string[];
  honorPerBulan: number[];
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
}

export interface PPLAdminData {
    id: string;
    namaPPL: string;
    totalKegiatan: number;
    alamat: string;
    noTelepon: string;
    kegiatanNames: string[];
}