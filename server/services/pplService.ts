// server/services/pplService.ts

import { RowDataPacket, OkPacket } from 'mysql2';
import db from '../db';
import { PPLMaster, PPLAdminData } from '@shared/api';

interface PPLMasterPacket extends PPLMaster, RowDataPacket {}

// Fungsi ini tetap ada untuk manajemen data master PPL
export const getAllMasterPPL = async (): Promise<PPLMaster[]> => {
    // SATU-SATUNYA kueri mitra yang menyaring `aktif`, dan itu disengaja.
    //
    // Daftar ini mengisi pemilih mitra di Input dan Edit Kegiatan, yaitu tempat
    // alokasi BARU dibuat — mitra yang sudah berhenti tidak boleh bisa diberi
    // pekerjaan lagi. Sebaliknya Daftar PPL (getPplAdminData) sengaja TIDAK
    // menyaring, dan seluruh kueri honor, kontrak, serta penilaian menunjuk
    // `ppl.ppl_master_id`, bukan tabel ini: pekerjaan yang sudah terjadi harus
    // tetap terbaca apa pun status orangnya sekarang. Menyeragamkan penyaring
    // ini ke kueri lain akan menghapus sejarah dari layar.
    const [rows] = await db.query<PPLMasterPacket[]>(
        'SELECT id, namaPPL, posisi FROM ppl_master WHERE aktif = 1 ORDER BY namaPPL ASC');
    return rows;
};

// Fungsi ini TIDAK ADA di file Anda, tetapi seharusnya ada di adminService.ts
// Saya akan asumsikan fungsi ini ada di adminService.ts dan kita akan fokus pada getPplAdminData
// Jika Anda ingin saya menambahkan fungsi ini di sini, beri tahu saya.

/**
 * Fungsi ini mengambil data untuk halaman admin Daftar PPL,
 * dan memecah kegiatan berdasarkan tahap PPL.
 */
// Fragmen SQL rentang honor dipakai bersama beberapa layanan; lihat
// rentangHonorSql.ts untuk aturan dan alasannya.
import { KONDISI_PERIODE, paramPeriode } from './rentangHonorSql';

/** Rentang tanggal untuk menyaring kegiatan menurut periode honornya. */
export interface PeriodeFilter {
    mulai: string;
    selesai: string;
}

export const getPplAdminData = async (periode?: PeriodeFilter): Promise<PPLAdminData[]> => {
    // Penyaringan periode dilakukan DI DALAM tabel turunan, bukan di WHERE
    // kueri utama. Kalau ditaruh di WHERE, mitra yang tidak punya kegiatan pada
    // periode itu akan HILANG dari daftar, padahal yang benar adalah tetap
    // tampil dengan 0 kegiatan — daftar ini adalah daftar mitra, bukan daftar
    // penugasan.
    const saringPeriode = periode ? KONDISI_PERIODE : '1';
    const query = `
        SELECT
            pm.id,
            pm.sobat_id,
            pm.namaPPL,
            pm.posisi,
            pm.kecamatan_id,
            pm.desa_id,
            kec.nama AS namaKecamatan,
            desa.nama AS namaDesa,
            pm.alamat,
            pm.noTelepon,
            pm.aktif,
            DATE_FORMAT(pm.nonaktifSejak, '%Y-%m-%d') AS nonaktifSejak,
            COUNT(x.id) AS totalKegiatan,
            GROUP_CONCAT(DISTINCT
                CONCAT_WS(';;',
                    IFNULL(x.namaKegiatan, 'Kegiatan Tidak Ditemukan'),
                    x.tahap
                )
            SEPARATOR '||') as kegiatanDetails
        FROM
            ppl_master pm
        LEFT JOIN (
            SELECT p.id, p.ppl_master_id, p.tahap, k.namaKegiatan
              FROM ppl p
              LEFT JOIN kegiatan k ON p.kegiatanId = k.id
             WHERE ${saringPeriode}
        ) x ON x.ppl_master_id = pm.id
        LEFT JOIN kecamatan kec ON pm.kecamatan_id = kec.id
        LEFT JOIN desa ON pm.desa_id = desa.id
        GROUP BY
            pm.id, pm.namaPPL, pm.posisi, pm.alamat, pm.noTelepon, pm.kecamatan_id, pm.desa_id
        ORDER BY
            pm.namaPPL ASC;
    `;

    // Ganti mapping agar sesuai dengan query yang lebih sederhana
    const [rows] = await db.query<any[]>(
        query, periode ? paramPeriode(periode.mulai, periode.selesai) : []);
    
    return rows.map(row => ({
        id: row.id,
        sobatId: row.sobat_id ?? null,
        namaPPL: row.namaPPL,
        posisi: row.posisi,
        alamat: row.alamat,
        noTelepon: row.noTelepon,
        // Daftar PPL sengaja memuat mitra nonaktif juga, jadi statusnya ikut
        // dikirim supaya layar bisa menandainya alih-alih menyembunyikannya.
        aktif: Number(row.aktif) === 1,
        nonaktifSejak: row.nonaktifSejak ?? null,
        kecamatanId: row.kecamatan_id,
        desaId: row.desa_id, 
        namaKecamatan: row.namaKecamatan, 
        namaDesa: row.namaDesa,
        totalKegiatan: row.totalKegiatan || 0,
        kegiatanDetails: row.kegiatanDetails ? row.kegiatanDetails.split('||').map((detail: string) => {
            const [nama, tahap] = detail.split(';;');
            return { nama, tahap };
        }) : [],
    }));
};

export const createMasterPPL = async (ppl: PPLAdminData): Promise<PPLAdminData> => {
    const { id, sobatId, namaPPL, posisi, alamat, noTelepon, kecamatanId, desaId  } = ppl;
    const query = 'INSERT INTO ppl_master (id, sobat_id, namaPPL, posisi, alamat, noTelepon, kecamatan_id, desa_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    // String kosong DISIMPAN SEBAGAI NULL: indeks uniknya mengabaikan NULL,
    // tetapi menganggap '' sebagai nilai biasa — mitra kedua yang dikosongkan
    // akan ditolak sebagai kembar kalau dibiarkan ''.
    await db.execute(query, [id, sobatId?.trim() || null, namaPPL, posisi, alamat, noTelepon, kecamatanId, desaId]);
    return ppl;
};

export const updateMasterPPL = async (originalId: string, pplData: PPLAdminData): Promise<PPLAdminData> => {
    const { sobatId, namaPPL, posisi, alamat, noTelepon, kecamatanId, desaId } = pplData;
    const query = 'UPDATE ppl_master SET sobat_id = ?, namaPPL = ?, posisi = ?, alamat = ?, noTelepon = ?, kecamatan_id = ?, desa_id = ? WHERE id = ?';
    // Lihat createMasterPPL: kosong harus menjadi NULL, bukan ''.
    await db.execute(query, [sobatId?.trim() || null, namaPPL, posisi, alamat, noTelepon, kecamatanId, desaId, originalId]);
    return pplData;
};

export const deleteMasterPPL = async (id: string): Promise<boolean> => {
    const query = 'DELETE FROM ppl_master WHERE id = ?';
    const [result] = await db.execute<OkPacket>(query, [id]);
    return result.affectedRows > 0;
};