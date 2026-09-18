// Dipisah dari server/services/kegiatanService.ts tanpa mengubah isinya.

import { RowDataPacket, OkPacket } from 'mysql2';
import db from '../db';
import { catatRiwayat } from './riwayatService';
import { Kegiatan } from '@shared/api';
import { getKegiatanById } from './kegiatanBaca';

// =================================================================
// END OF MODIFICATION: updatePplProgress function
// =================================================================

/** Berapa lama setelah dibuat, sebuah kegiatan masih boleh diurungkan pembuatnya. */
export const BATAS_URUNGKAN_MENIT = 15;

export type HasilUrungkan = 'ok' | 'tidak-ada' | 'bukan-pembuat' | 'kedaluwarsa';

/**
 * Mengurungkan pembuatan kegiatan yang BARU SAJA dibuat — tombol "Batal Simpan
 * Kegiatan" di modal sukses Input Kegiatan.
 *
 * Penghapusan kegiatan biasa khusus admin. Pintu ini sengaja sempit supaya
 * tidak menjadi jalan belakang: hanya PEMBUATNYA (atau admin), dan hanya dalam
 * `BATAS_URUNGKAN_MENIT` sejak dibuat. Waktu pembuatan diambil dari riwayat
 * 'kegiatan_dibuat' karena tabel kegiatan tidak punya kolom createdAt.
 */
export const urungkanPembuatanKegiatan = async (
    id: number,
    userId: string,
    role: string,
): Promise<HasilUrungkan> => {
    const [rows] = await db.query<RowDataPacket[]>(
        `SELECT k.createdBy_userId,
                (SELECT TIMESTAMPDIFF(SECOND, MAX(r.terjadiPada), NOW())
                   FROM riwayat_kegiatan r
                  WHERE r.kegiatanId = k.id AND r.aksi = 'kegiatan_dibuat') AS umurDetik
           FROM kegiatan k WHERE k.id = ?`,
        [id]);
    const k = rows[0];
    if (!k) return 'tidak-ada';
    if (role !== 'admin' && k.createdBy_userId !== userId) return 'bukan-pembuat';
    if (k.umurDetik === null || Number(k.umurDetik) > BATAS_URUNGKAN_MENIT * 60) return 'kedaluwarsa';
    await deleteKegiatan(id);
    return 'ok';
};

export const deleteKegiatan = async (id: number): Promise<boolean> => {
    const [result] = await db.execute<OkPacket>('DELETE FROM kegiatan WHERE id = ?', [id]);
    return result.affectedRows > 0;
};

/**
 * Data yang IKUT TERHAPUS bila sebuah kegiatan dihapus.
 *
 * Tabel ppl, honor, progres, penilaian, dan riwayat semuanya ON DELETE CASCADE
 * ke kegiatan. Menghapus kegiatan yang sudah berjalan menghilangkan honor
 * mitra yang jadi dasar surat kontrak, penilaiannya, dan catatan siapa
 * mengubah apa — tanpa bisa dikembalikan. Route hapus memakai angka ini untuk
 * menolak dan mengarahkan ke Arsip.
 *
 * `urungkanPembuatanKegiatan` sengaja TIDAK memeriksanya: urungkan hanya
 * berlaku 15 menit setelah dibuat oleh pembuatnya sendiri, dan memang untuk
 * membuang kegiatan yang baru salah disimpan beserta isinya.
 */
export const keterikatanKegiatan = async (id: number): Promise<{ alokasi: number; penilaian: number }> => {
    const [[baris]] = await db.query<RowDataPacket[]>(
        `SELECT (SELECT COUNT(*) FROM ppl WHERE kegiatanId = ?) AS alokasi,
                (SELECT COUNT(*) FROM penilaian_mitra WHERE kegiatanId = ?) AS penilaian`,
        [id, id]);
    return { alokasi: Number(baris.alokasi), penilaian: Number(baris.penilaian) };
};

/**
 * Arsipkan atau batalkan arsip sebuah kegiatan.
 *
 * Berbeda dengan deleteKegiatan yang menghapus permanen (beserta seluruh ppl,
 * dokumen, dan honor lewat ON DELETE CASCADE), arsip hanya menyembunyikan
 * kegiatan dari daftar utama dashboard. Datanya tetap ikut terhitung di rekap
 * honor dan penilaian.
 */
export const setArsipKegiatan = async (id: number, isArsip: boolean, username?: string): Promise<Kegiatan | null> => {
    const [result] = await db.execute<OkPacket>(
        'UPDATE kegiatan SET isArsip = ?, arsipAt = ?, arsipBy = ? WHERE id = ?',
        [isArsip ? 1 : 0, isArsip ? new Date() : null, isArsip ? (username || null) : null, id]
    );
    if (result.affectedRows === 0) return null;
    await catatRiwayat(null, {
        kegiatanId: id,
        aksi: isArsip ? 'kegiatan_diarsipkan' : 'arsip_dibatalkan',
        entitas: 'kegiatan',
        entitasId: id,
        aktorNama: username ?? null,
    });
    return getKegiatanById(id);
};
