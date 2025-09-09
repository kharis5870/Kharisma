// server/services/pplService.ts

import { RowDataPacket, OkPacket } from 'mysql2';
import db from '../db';
import { PPLMaster, PPLAdminData } from '@shared/api';

interface PPLMasterPacket extends PPLMaster, RowDataPacket {}

// Interface baru untuk hasil query mentah dari database
interface PPLAdminQueryResult extends RowDataPacket {
    id: string;
    namaPPL: string;
    alamat: string;
    noTelepon: string;
    totalKegiatan: number;
    kegiatanNames: string | null; 
}

// Fungsi ini tetap ada untuk manajemen data master PPL
export const getAllMasterPPL = async (): Promise<PPLMaster[]> => {
    const [rows] = await db.query<PPLMasterPacket[]>('SELECT * FROM ppl_master ORDER BY namaPPL ASC');
    return rows;
};

// Fungsi ini TIDAK ADA di file Anda, tetapi seharusnya ada di adminService.ts
// Saya akan asumsikan fungsi ini ada di adminService.ts dan kita akan fokus pada getPplAdminData
// Jika Anda ingin saya menambahkan fungsi ini di sini, beri tahu saya.

/**
 * Fungsi ini mengambil data untuk halaman admin Daftar PPL,
 * dan memecah kegiatan berdasarkan tahap PPL.
 */
export const getPplAdminData = async (): Promise<PPLAdminData[]> => {
    const query = `
        SELECT
            pm.id, 
            pm.namaPPL, 
            pm.alamat, 
            pm.noTelepon,
            COUNT(DISTINCT CONCAT(p.kegiatanId, '-', p.tahap)) AS totalKegiatan,
            GROUP_CONCAT(DISTINCT 
                CASE 
                    WHEN p.tahap = 'listing' THEN CONCAT(k.namaKegiatan, ' (Listing)')
                    WHEN p.tahap = 'pencacahan' THEN CONCAT(k.namaKegiatan, ' (Pencacahan)')
                    WHEN p.tahap = 'pengolahan-analisis' THEN CONCAT(k.namaKegiatan, ' (Pengolahan)')
                    ELSE k.namaKegiatan 
                END 
            SEPARATOR ';;') as kegiatanNames
        FROM ppl_master pm
        LEFT JOIN ppl p ON pm.id = p.ppl_master_id
        LEFT JOIN kegiatan k ON p.kegiatanId = k.id
        GROUP BY pm.id, pm.namaPPL, pm.alamat, pm.noTelepon
        ORDER BY pm.namaPPL ASC
    `;
    
    const [rows] = await db.query<PPLAdminQueryResult[]>(query);
    
    return rows.map(row => ({
        id: row.id,
        namaPPL: row.namaPPL,
        alamat: row.alamat,
        noTelepon: row.noTelepon,
        totalKegiatan: row.totalKegiatan,
        kegiatanNames: row.kegiatanNames ? row.kegiatanNames.split(';;') : []
    }));
};


export const createMasterPPL = async (ppl: PPLMaster): Promise<PPLMaster> => {
    const { id, namaPPL } = ppl;
    const query = 'INSERT INTO ppl_master (id, namaPPL) VALUES (?, ?)';
    await db.execute(query, [id, namaPPL]);
    return ppl;
};

export const updateMasterPPL = async (originalId: string, pplData: PPLMaster): Promise<PPLMaster> => {
    const { id, namaPPL } = pplData;
    const query = 'UPDATE ppl_master SET id = ?, namaPPL = ? WHERE id = ?';
    await db.execute(query, [id, namaPPL, originalId]);
    return pplData;
};

export const deleteMasterPPL = async (id: string): Promise<boolean> => {
    const query = 'DELETE FROM ppl_master WHERE id = ?';
    const [result] = await db.execute<OkPacket>(query, [id]);
    return result.affectedRows > 0;
};