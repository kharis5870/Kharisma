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
  pplId?: string; // ID dari ppl_master
  namaPPL: string;
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

export interface Kegiatan {
  id: number;
  namaKegiatan: string;
  ketuaTim: string;
  timKerja: string;
  adaListing: boolean;
  status: 'Persiapan' | 'Pengumpulan Data' | 'Pengolahan & Analisis' | 'Diseminasi & Evaluasi' | 'Selesai';
  progressKeseluruhan: number;
  tanggalMulaiPelatihan?: string;
  tanggalSelesaiPelatihan?: string;
  tanggalMulaiPendataan?: string;
  tanggalSelesaiPendataan?: string;
  lastUpdated: string;
  dokumen: Dokumen[];
  ppl: PPL[];
}

export interface PPLHonorData {
  id: string;
  nama: string;
  honorBulanIni: number;
  activitiesCount: number;
  kegiatanNames: string[];
  honorPerBulan: number[]; 
}
