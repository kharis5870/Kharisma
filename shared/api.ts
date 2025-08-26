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
}

export interface PPL {
  id?: number; 
  kegiatanId?: number;
  ppl_master_id: string; 
  namaPPL?: string; 
  namaPML: string;
  bebanKerja: string;
  satuanBebanKerja: string;
  besaranHonor: string;
  progressOpen?: number;
  progressSubmit?: number;
  progressDiperiksa?: number;
  progressApproved?: number;
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
  status: 'Persiapan' | 'Pengumpulan Data' | 'Pengolahan & Analisis' | 'Diseminasi & Evaluasi' | 'Selesai';
  progressKeseluruhan: number;
  lastUpdated: string;
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
}

export interface PPLHonorData {
  id: string;
  nama: string;
  honorBulanIni: number;
  activitiesCount: number;
  kegiatanNames: string[];
  honorPerBulan: number[]; 
}


// --- Tipe Data Baru untuk Halaman Admin ---

export interface UserData {
    id: string;
    username: string;
    password?: string; // Password bersifat opsional saat mengambil data
    namaLengkap: string;
    role: 'admin' | 'supervisor' | 'user';
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
    kegiatanNames: string[]; // <-- Tambahkan properti ini
}