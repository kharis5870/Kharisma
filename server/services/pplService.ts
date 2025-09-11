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
    const [rows] = await db.query<PPLMasterPacket[]>('SELECT id, namaPPL, posisi FROM ppl_master ORDER BY namaPPL ASC');
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
            pm.posisi,
            pm.alamat, 
            pm.noTelepon,
            COUNT(p.id) AS totalKegiatan,
            GROUP_CONCAT(DISTINCT 
                CONCAT_WS(';;', 
                    IFNULL(k.namaKegiatan, 'Kegiatan Tidak Ditemukan'), 
                    p.tahap
                )
            SEPARATOR '||') as kegiatanDetails
        FROM 
            ppl_master pm
        LEFT JOIN ppl p ON pm.id = p.ppl_master_id
        LEFT JOIN kegiatan k ON p.kegiatanId = k.id
        GROUP BY 
            pm.id, pm.namaPPL, pm.posisi, pm.alamat, pm.noTelepon
        ORDER BY 
            pm.namaPPL ASC;
    `;
    
    // Ganti mapping agar sesuai dengan query yang lebih sederhana
    const [rows] = await db.query<any[]>(query);
    
    return rows.map(row => ({
        id: row.id,
        namaPPL: row.namaPPL,
        posisi: row.posisi,
        alamat: row.alamat,
        noTelepon: row.noTelepon,
        totalKegiatan: row.totalKegiatan || 0,
        kegiatanDetails: row.kegiatanDetails ? row.kegiatanDetails.split('||').map((detail: string) => {
            const [nama, tahap] = detail.split(';;');
            return { nama, tahap };
        }) : [],
    }));
};

export const createMasterPPL = async (ppl: PPLAdminData): Promise<PPLAdminData> => {
    const { id, namaPPL, posisi, alamat, noTelepon } = ppl;
    const query = 'INSERT INTO ppl_master (id, namaPPL, posisi, alamat, noTelepon) VALUES (?, ?, ?, ?, ?)';
    await db.execute(query, [id, namaPPL, posisi, alamat, noTelepon]);
    return ppl;
};

export const updateMasterPPL = async (originalId: string, pplData: PPLAdminData): Promise<PPLAdminData> => {
    const { namaPPL, posisi, alamat, noTelepon } = pplData;
    const query = 'UPDATE ppl_master SET namaPPL = ?, posisi = ?, alamat = ?, noTelepon = ? WHERE id = ?';
    await db.execute(query, [namaPPL, posisi, alamat, noTelepon, originalId]);
    return pplData;
};

export const deleteMasterPPL = async (id: string): Promise<boolean> => {
    const query = 'DELETE FROM ppl_master WHERE id = ?';
    const [result] = await db.execute<OkPacket>(query, [id]);
    return result.affectedRows > 0;
};