export interface Dokumen {
  id?: number;
  kegiatanId?: number;
  tipe: 'persiapan' | 'pasca-pelatihan' | 'pasca-pendataan';
  nama: string;
  link: string;
  jenis: 'file' | 'link';
  status?: 'Pending' | 'Reviewed' | 'Approved';
  uploadedAt?: string;
}

export interface PPL {
  id?: number; // ID dari database akan berupa number
  kegiatanId?: number;
  namaPPL: string;
  namaPML: string;
  bebanKerja: string;
  satuanBebanKerja: string;
  besaranHonor: string;
  // Kolom progress ditambahkan di sini untuk konsistensi
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
  tipeKegiatan: string;
  status: 'Persiapan' | 'Pelatihan' | 'Pendataan' | 'Selesai';
  progressKeseluruhan: number;
  tanggalMulaiPelatihan?: string;
  tanggalSelesaiPelatihan?: string;
  tanggalMulaiPendataan?: string;
  tanggalSelesaiPendataan?: string;
  lastUpdated: string;
  dokumen: Dokumen[];
  ppl: PPL[];
}

// Tipe BARU yang hilang sebelumnya, sekarang sudah diekspor
export interface PPLHonorData {
  id: string;
  nama: string;
  honorBulanIni: number;
  activitiesCount: number;
  honorPerBulan: number[]; 
}