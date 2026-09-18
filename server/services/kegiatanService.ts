// server/services/kegiatanService.ts

/**
 * Pintu masuk layanan kegiatan.
 *
 * Isinya dulu satu berkas 1.500 baris. Sekarang dipecah per tanggung jawab
 * supaya tiap bagian bisa dibaca utuh, dan berkas ini HANYA mengekspor ulang —
 * semua pemanggil (routes/kegiatan.ts) tetap mengimpor dari sini tanpa
 * perubahan apa pun.
 *
 *   kegiatanBantu.ts     tipe paket SQL, format tanggal & rupiah, hitung progres,
 *                        validasi tautan dokumen & ketua tim
 *   kegiatanBaca.ts      membaca kegiatan beserta relasinya
 *   kegiatanSimpan.ts    membuat & menyunting kegiatan (alokasi, honor, pembebanan)
 *   kegiatanDokumen.ts   dokumen: tambah, ubah, hapus, status, pengingat,
 *                        penanggung jawab
 *   kegiatanProgres.ts   progres mitra per alokasi
 *   kegiatanSiklus.ts    urungkan pembuatan, hapus, arsip
 *
 * Modul-modul itu saling mengimpor lewat jalur relatif: alias @shared tidak
 * tersedia saat vite.config.ts memuat kode server lewat Node.
 */

export { getAllKegiatan, getKegiatanById } from './kegiatanBaca';
export { createKegiatan, updateKegiatan } from './kegiatanSimpan';
export {
    createSingleDocument, updateSingleDocument, deleteSingleDocument, ubahNamaDokumen,
    kirimPengingatDokumen, updateDocumentStatus, approveDocumentsByTipe, ubahPenanggungJawabDokumen,
} from './kegiatanDokumen';
export { updatePplProgress } from './kegiatanProgres';
export {
    BATAS_URUNGKAN_MENIT, urungkanPembuatanKegiatan, deleteKegiatan, keterikatanKegiatan, setArsipKegiatan,
} from './kegiatanSiklus';
export type { HasilUrungkan } from './kegiatanSiklus';
