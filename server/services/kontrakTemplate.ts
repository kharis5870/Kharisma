// Dipisah dari server/services/kontrakService.ts tanpa mengubah isinya.

import { RowDataPacket, OkPacket } from 'mysql2';
import db from '../db';
import { TemplateSurat, UraianTugasKontrak } from '@shared/api';
import {
    KONDISI_PERIODE, MULAI_SESUAI_TAHAP, SELESAI_SESUAI_TAHAP, JENIS_DARI_TAHAP, paramPeriode,
} from './rentangHonorSql';
import { LABEL_TAHAP, POLA_BAST_BAWAAN } from './kontrakBantu';

export const getTemplateAktif = async (): Promise<TemplateSurat | null> => {
    const [rows] = await db.query<RowDataPacket[]>(
        'SELECT * FROM template_surat WHERE is_aktif = 1 ORDER BY id LIMIT 1'
    );
    return (rows[0] as TemplateSurat) || null;
};

export const updateTemplate = async (id: number, data: Partial<TemplateSurat>, username?: string): Promise<TemplateSurat | null> => {
    await db.execute(
        `UPDATE template_surat SET
            nama_template = ?, format_nomor = ?, format_nomor_bast = ?,
            ppk_nama = ?, ppk_nip = ?, ppk_jabatan = ?,
            satker_nama = ?, satker_alamat = ?, kota = ?, pengadilan_negeri = ?,
            updatedBy = ?
         WHERE id = ?`,
        [
            data.nama_template, data.format_nomor,
            // Kueri ini menulis SEMUA kolom tanpa syarat, jadi field yang tidak
            // dikirim klien akan bernilai undefined dan membuat mysql2 melempar
            // "Bind parameters must not contain undefined" — seluruh simpanan
            // gagal, bukan cuma kolom ini.
            data.format_nomor_bast || POLA_BAST_BAWAAN,
            data.ppk_nama, data.ppk_nip, data.ppk_jabatan,
            data.satker_nama, data.satker_alamat ?? null, data.kota ?? null, data.pengadilan_negeri ?? null,
            username ?? null, id,
        // Cast hanya untuk tipe mysql2 3.24 (yang menolak `undefined` saat
        // kompilasi). Perilakunya sengaja TIDAK diubah: field wajib yang tidak
        // dikirim tetap ditolak mysql2 saat dijalankan, bukan diam-diam
        // mengosongkan kolom template.
        ] as (string | number | null)[]
    );
    const [rows] = await db.query<RowDataPacket[]>('SELECT * FROM template_surat WHERE id = ?', [id]);
    return (rows[0] as TemplateSurat) || null;
};

// -------------------- Uraian tugas & kode anggaran (MAK) --------------------

/**
 * Daftar kegiatan x tahap yang punya mitra pada periode tertentu, beserta
 * uraian tugas dan kode anggarannya. Uraian yang belum pernah diisi diberi
 * nilai bawaan "namaKegiatan + label tahap" supaya tim keuangan tinggal
 * menyesuaikan bila perlu.
 */
export const getUraianTugas = async (tanggalMulai: string, tanggalSelesai: string): Promise<UraianTugasKontrak[]> => {
    const [rows] = await db.query<RowDataPacket[]>(
        `SELECT
            k.id AS kegiatanId,
            k.namaKegiatan,
            ${JENIS_DARI_TAHAP} AS jenis_pekerjaan,
            hk.uraian_tugas,
            hk.kode_anggaran,
            COUNT(DISTINCT p.ppl_master_id) AS jumlahMitra,
            ${MULAI_SESUAI_TAHAP} AS tanggalMulaiHonor,
            ${SELESAI_SESUAI_TAHAP} AS tanggalSelesaiHonor
         FROM ppl p
         JOIN kegiatan k ON p.kegiatanId = k.id
         LEFT JOIN honorarium_kegiatan hk
                ON hk.kegiatanId = k.id AND hk.jenis_pekerjaan = ${JENIS_DARI_TAHAP}
         WHERE ${KONDISI_PERIODE}
         GROUP BY k.id, k.namaKegiatan, p.tahap, jenis_pekerjaan, hk.uraian_tugas, hk.kode_anggaran,
                  tanggalMulaiHonor, tanggalSelesaiHonor
         ORDER BY k.namaKegiatan, jenis_pekerjaan`,
        paramPeriode(tanggalMulai, tanggalSelesai)
    );

    return rows.map(row => ({
        kegiatanId: row.kegiatanId,
        namaKegiatan: row.namaKegiatan,
        jenis_pekerjaan: row.jenis_pekerjaan,
        uraian_tugas: row.uraian_tugas || `${row.namaKegiatan} ${LABEL_TAHAP[row.jenis_pekerjaan] || ''}`.trim(),
        kode_anggaran: row.kode_anggaran || '',
        jumlahMitra: Number(row.jumlahMitra) || 0,
        tanggalMulaiHonor: row.tanggalMulaiHonor,
        tanggalSelesaiHonor: row.tanggalSelesaiHonor,
    }));
};

/**
 * Menyimpan uraian tugas dan kode anggaran per kegiatan x tahap. Nilai ini
 * berlaku untuk SEMUA mitra pada kegiatan dan tahap tersebut, sesuai alur
 * "atur sekali, generate semua".
 */
export const simpanUraianTugas = async (
    daftar: { kegiatanId: number; jenis_pekerjaan: string; uraian_tugas: string; kode_anggaran: string }[]
): Promise<number> => {
    if (daftar.length === 0) return 0;

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        let tersimpan = 0;
        for (const item of daftar) {
            // Baris honorarium_kegiatan selalu dibuat saat kegiatan disimpan,
            // tapi UPDATE dipakai agar satuan & harga satuan tidak tersentuh.
            const [hasil] = await connection.execute<OkPacket>(
                'UPDATE honorarium_kegiatan SET uraian_tugas = ?, kode_anggaran = ? WHERE kegiatanId = ? AND jenis_pekerjaan = ?',
                [item.uraian_tugas || null, item.kode_anggaran || null, item.kegiatanId, item.jenis_pekerjaan]
            );
            if (hasil.affectedRows === 0) {
                await connection.execute(
                    'INSERT INTO honorarium_kegiatan (kegiatanId, jenis_pekerjaan, satuan_beban_kerja, harga_satuan, uraian_tugas, kode_anggaran) VALUES (?, ?, ?, ?, ?, ?)',
                    [item.kegiatanId, item.jenis_pekerjaan, '', '0', item.uraian_tugas || null, item.kode_anggaran || null]
                );
            }
            tersimpan += 1;
        }
        await connection.commit();
        return tersimpan;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};
