// server/services/honorService.ts

import { RowDataPacket } from 'mysql2';
import db from '../db';
import { PPLHonorData } from '@shared/api';
import { getSetting } from './settingsService';

interface HonorQueryResult extends RowDataPacket {
    id: string;
    nama: string;
    totalHonor: number;
    kegiatanCount: number;
    kegiatanNames: string | null;
}

// FUNGSI DIPERBARUI
export const getHonorBulanan = async (bulan: number, tahun: number): Promise<PPLHonorData[]> => {
    const bulanTahunFormatted = `${String(bulan).padStart(2, '0')}-${tahun}`;

    const query = `
        SELECT
            pm.namaPPL AS nama,
            p.ppl_master_id AS id,
            SUM(p.besaranHonor) AS totalHonor,
            COUNT(DISTINCT CONCAT(k.id, '-', p.tahap)) AS kegiatanCount,
            GROUP_CONCAT(DISTINCT
                CASE p.tahap
                    WHEN 'listing' THEN CONCAT(k.namaKegiatan, ' (Listing)')
                    WHEN 'pencacahan' THEN CONCAT(k.namaKegiatan, ' (Pencacahan)')
                    WHEN 'pengolahan-analisis' THEN CONCAT(k.namaKegiatan, ' (Pengolahan)')
                END
            SEPARATOR ';;') as kegiatanNames
        FROM ppl p
        JOIN kegiatan k ON p.kegiatanId = k.id
        JOIN ppl_master pm ON p.ppl_master_id = pm.id
        WHERE
            (p.tahap = 'listing' AND k.bulanHonorListing = ?) OR
            (p.tahap = 'pencacahan' AND k.bulanHonorPencacahan = ?) OR
            (p.tahap = 'pengolahan-analisis' AND k.bulanHonorPengolahan = ?)
        GROUP BY p.ppl_master_id, pm.namaPPL
        ORDER BY pm.namaPPL;
    `;

    const [rows] = await db.query<HonorQueryResult[]>(query, [
        bulanTahunFormatted, 
        bulanTahunFormatted, 
        bulanTahunFormatted
    ]);
    
    return rows.map(row => ({
        id: row.id,
        nama: row.nama,
        honorBulanIni: Number(row.totalHonor),
        activitiesCount: row.kegiatanCount,
        kegiatanNames: row.kegiatanNames ? row.kegiatanNames.split(';;') : [],
        honorPerBulan: [], 
    }));
};

// FUNGSI DIPERBARUI
export const getHonorDetail = async (pplMasterId: string, tahun: number): Promise<number[]> => {
    const honorPerBulan = Array(12).fill(0);

    const query = `
        SELECT 
            bulan,
            SUM(totalHonorBulanan) as totalHonorBulanan
        FROM (
            SELECT CAST(SUBSTRING_INDEX(k.bulanHonorListing, '-', 1) AS UNSIGNED) as bulan, SUM(p.besaranHonor) as totalHonorBulanan
            FROM ppl p JOIN kegiatan k ON p.kegiatanId = k.id
            WHERE p.ppl_master_id = ? AND k.bulanHonorListing LIKE CONCAT('%-', ?) AND p.tahap = 'listing'
            GROUP BY bulan
            
            UNION ALL
            
            SELECT CAST(SUBSTRING_INDEX(k.bulanHonorPencacahan, '-', 1) AS UNSIGNED) as bulan, SUM(p.besaranHonor) as totalHonorBulanan
            FROM ppl p JOIN kegiatan k ON p.kegiatanId = k.id
            WHERE p.ppl_master_id = ? AND k.bulanHonorPencacahan LIKE CONCAT('%-', ?) AND p.tahap = 'pencacahan'
            GROUP BY bulan
            
            UNION ALL
            
            SELECT CAST(SUBSTRING_INDEX(k.bulanHonorPengolahan, '-', 1) AS UNSIGNED) as bulan, SUM(p.besaranHonor) as totalHonorBulanan
            FROM ppl p JOIN kegiatan k ON p.kegiatanId = k.id
            WHERE p.ppl_master_id = ? AND k.bulanHonorPengolahan LIKE CONCAT('%-', ?) AND p.tahap = 'pengolahan-analisis'
            GROUP BY bulan
        ) as honor_union
        WHERE bulan IS NOT NULL
        GROUP BY bulan;
    `;

    const [rows] = await db.query<RowDataPacket[]>(query, [pplMasterId, tahun, pplMasterId, tahun, pplMasterId, tahun]);

    rows.forEach(row => {
        const monthIndex = row.bulan - 1;
        if (monthIndex >= 0 && monthIndex < 12) {
            honorPerBulan[monthIndex] = Number(row.totalHonorBulanan);
        }
    });

    return honorPerBulan;
};

// FUNGSI DIPERBARUI
export const getTotalHonorPPLByMonth = async (pplMasterId: string, bulan: number, tahun: number, kegiatanIdToExclude: number | null = null): Promise<number> => {
    const bulanTahunFormatted = `${String(bulan).padStart(2, '0')}-${tahun}`;
    
    let query = `
        SELECT SUM(p.besaranHonor) as totalHonor
        FROM kegiatan k
        JOIN ppl p ON k.id = p.kegiatanId
        WHERE
            p.ppl_master_id = ? AND (
                (p.tahap = 'listing' AND k.bulanHonorListing = ?) OR
                (p.tahap = 'pencacahan' AND k.bulanHonorPencacahan = ?) OR
                (p.tahap = 'pengolahan-analisis' AND k.bulanHonorPengolahan = ?)
            )
    `;

    const params: (string | number)[] = [pplMasterId, bulanTahunFormatted, bulanTahunFormatted, bulanTahunFormatted];

    if (kegiatanIdToExclude) {
        query += ' AND k.id != ?';
        params.push(kegiatanIdToExclude);
    }

    const [rows] = await db.query<RowDataPacket[]>(query, params);

    if (rows.length > 0 && rows[0].totalHonor) {
        return parseInt(rows[0].totalHonor, 10);
    }
    return 0;
};

// FUNGSI INI TIDAK BERUBAH
export const validatePplHonor = async (pplMasterId: string, bulan: number, tahun: number, currentActivityHonor: number, kegiatanIdToExclude: number | null) => {
    const honorLimitString = await getSetting('HONOR_LIMIT', '3000000');
    const honorLimit = parseInt(honorLimitString, 10);
    const existingHonor = await getTotalHonorPPLByMonth(pplMasterId, bulan, tahun, kegiatanIdToExclude);
    const projectedTotal = existingHonor + currentActivityHonor;

    return {
        isOverLimit: projectedTotal > honorLimit,
        limit: honorLimit,
        projectedTotal: projectedTotal
    };
};