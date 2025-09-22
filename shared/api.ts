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
  catatan?: string; 
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
  pml_id?: string | null;
  namaPPL?: string;
  namaPML?: string;
  bebanKerja: string; 
  besaranHonor: string; 
  tahap: 'listing' | 'pencacahan' | 'pengolahan-analisis';
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
    kecamatanId?: number | null;
    desaId?: number | null;
    namaKecamatan?: string;
    namaDesa?: string;
    kegiatanDetails: {
        nama: string;
        tahap: string;
    }[];
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
  createdBy_userId?: string | null;
  namaKetua?: string;
  deskripsiKegiatan: string;
  adaListing: boolean;
  isFasih: boolean; 
  bulanHonorListing?: string;
  bulanHonorPencacahan?: string;
  bulanHonorPengolahan?: string;
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

export interface DocumentNotification {
  id: number;
  namaDokumen: string;
  namaKegiatan: string;
  kegiatanId: number;
  linkFile: string;
  uploadedBy: string;
  uploadedAt: string; 
  status: 'pending_approval';
  type: 'document_uploaded';
  tahap: string;
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