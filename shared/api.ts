export interface Dokumen {
  id?: number;
  kegiatanId?: number;
  tipe: 'persiapan' | 'pengumpulan-data' | 'pengolahan-analisis' | 'diseminasi-evaluasi';
  nama: string;
  link: string; // Akan menyimpan link ATAU isi catatan
  jenis: 'file' | 'link' | 'catatan'; // Menambahkan 'catatan'
  status?: 'Pending' | 'Reviewed' | 'Approved';
  uploadedAt?: string;
  isWajib?: boolean;
}

export interface PPL {
  id?: number; 
  kegiatanId?: number;
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
