// server/services/kontrakService.ts

/**
 * Pintu masuk layanan Surat PK & BAST.
 *
 * Isinya dulu satu berkas 1.150 baris. Sekarang dipecah per tanggung jawab,
 * dan berkas ini HANYA mengekspor ulang — routes/kontrak.ts dan
 * notifikasiService.ts tetap mengimpor dari sini tanpa perubahan apa pun.
 *
 *   kontrakBantu.ts       label tahap & pola nomor bawaan
 *   kontrakTemplate.ts    template surat, uraian tugas & kode anggaran
 *   kontrakData.ts        data surat per mitra per periode, salinan isi terbit
 *   kontrakPenomoran.ts   memesan nomor SPK/BAST, atur ulang nomor periode
 *   kontrakRiwayat.ts     Riwayat Penyuratan: ubah nomor, batal, catatan,
 *                         hapus, rapikan
 *   kontrakPerubahan.ts   isi berubah sejak terbit: peringatan & perbarui kontrak
 *
 * Modul-modul itu saling mengimpor lewat jalur relatif: alias @shared tidak
 * tersedia saat vite.config.ts memuat kode server lewat Node.
 */

export { getTemplateAktif, updateTemplate, getUraianTugas, simpanUraianTugas } from './kontrakTemplate';
export { getDataKontrak } from './kontrakData';
export { pesanNomorKontrak, pesanNomorBast, getMaksNomorUrut, aturUlangNomorPeriode } from './kontrakPenomoran';
export type { HasilAturUlangNomor } from './kontrakPenomoran';
export {
    getRiwayatSurat, ubahNomorSurat, batalkanSurat, ubahCatatanSurat, hapusSuratBatal, rapikanNomorTahun,
} from './kontrakRiwayat';
export type { HasilUbahNomor } from './kontrakRiwayat';
export { perbaruiIsiSurat, suratBerubahSejakTerbit } from './kontrakPerubahan';
export type { HasilPerbaruiIsi, SuratBerubah } from './kontrakPerubahan';
