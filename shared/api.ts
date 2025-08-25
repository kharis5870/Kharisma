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
  ppl_master_id: string; // Menggunakan ID dari ppl_master
  namaPPL?: string; // Nama untuk ditampilkan (dari JOIN)
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
  id: number;
  namaKetua: string;
  nip?: string;
}

export interface Kegiatan {
  id: number;
  namaKegiatan: string;
  ketua_tim_id: number; // Menggunakan ID dari ketua_tim
  namaKetua?: string; // Nama untuk ditampilkan (dari JOIN)
  timKerja: string;
  adaListing: boolean;
  status: 'Persiapan' | 'Pengumpulan Data' | 'Pengolahan & Analisis' | 'Diseminasi & Evaluasi' | 'Selesai';
  progressKeseluruhan: number;
  lastUpdated: string;
  dokumen: Dokumen[];
  ppl: PPL[];

  // Jadwal baru per tahapan
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
