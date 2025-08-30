// server/services/honorService.ts

import { RowDataPacket } from 'mysql2';
import db from '../db';
import { PPLHonorData } from '@shared/api';

interface HonorQueryResult extends RowDataPacket {
    id: string;
    nama: string;
    totalHonor: number;
    kegiatanCount: number;
    kegiatanNames: string | null;
}

export const getHonorBulanan = async (bulan: number, tahun: number): Promise<PPLHonorData[]> => {
    const sqlMonth = bulan + 1;

    // PERBAIKAN: Mengganti k.tanggalSelesaiPendataan menjadi k.tanggalSelesaiPengumpulanData
    const query = `
        SELECT
            pm.namaPPL AS nama,
            SUM(p.besaranHonor) AS totalHonor,
            COUNT(DISTINCT k.id) AS kegiatanCount,
            p.ppl_master_id AS id,
            GROUP_CONCAT(DISTINCT k.namaKegiatan SEPARATOR ';;') as kegiatanNames
        FROM ppl p
        JOIN kegiatan k ON p.kegiatanId = k.id
        JOIN ppl_master pm ON p.ppl_master_id = pm.id
        WHERE
            MONTH(k.tanggalSelesaiPengumpulanData) = ? AND YEAR(k.tanggalSelesaiPengumpulanData) = ?
        GROUP BY p.ppl_master_id, pm.namaPPL
        ORDER BY pm.namaPPL;
    `;

    const [rows] = await db.query<HonorQueryResult[]>(query, [sqlMonth, tahun]);
    
    return rows.map(row => ({
        id: row.id,
        nama: row.nama,
        honorBulanIni: Number(row.totalHonor),
        activitiesCount: row.kegiatanCount,
        kegiatanNames: row.kegiatanNames ? row.kegiatanNames.split(';;') : [],
        honorPerBulan: [], 
    }));
};

export const getHonorDetail = async (pplMasterId: string, tahun: number): Promise<number[]> => {
    const honorPerBulan = Array(12).fill(0);

    // PERBAIKAN: Mengganti k.tanggalSelesaiPendataan menjadi k.tanggalSelesaiPengumpulanData
    const query = `
        SELECT 
            MONTH(k.tanggalSelesaiPengumpulanData) as bulan,
            SUM(p.besaranHonor) as totalHonorBulanan
        FROM ppl p
        JOIN kegiatan k ON p.kegiatanId = k.id
        WHERE
            p.ppl_master_id = ? AND YEAR(k.tanggalSelesaiPengumpulanData) = ?
        GROUP BY MONTH(k.tanggalSelesaiPengumpulanData);
    `;

    const [rows] = await db.query<RowDataPacket[]>(query, [pplMasterId, tahun]);

    rows.forEach(row => {
        const monthIndex = row.bulan - 1;
        if (monthIndex >= 0 && monthIndex < 12) {
            honorPerBulan[monthIndex] = Number(row.totalHonorBulanan);
        }
    });

    return honorPerBulan;
};

export const getTotalHonorPPLByMonth = async (pplMasterId: string, bulan: number, tahun: number): Promise<number> => {
   // Query ini sudah diperbaiki untuk menangani tanggal yang NULL dengan lebih aman
   const query = `
       SELECT SUM(p.besaranHonor) as totalHonor
       FROM kegiatan k
       JOIN ppl p ON k.id = p.kegiatanId
       WHERE
           p.ppl_master_id = ? AND 
           (
               k.bulanPembayaranHonor = ? OR
               (
                   k.bulanPembayaranHonor IS NULL AND 
                   MONTH(k.tanggalSelesaiPengumpulanData) = ? AND 
                   YEAR(k.tanggalSelesaiPengumpulanData) = ?
               )
           )
   `;

   const bulanPembayaran = `${String(bulan).padStart(2, '0')}-${tahun}`;
   const sqlMonth = bulan;

   const [rows] = await db.query<RowDataPacket[]>(query, [pplMasterId, bulanPembayaran, sqlMonth, tahun]);

   if (rows.length > 0 && rows[0].totalHonor) {
       return parseInt(rows[0].totalHonor, 10);
   }
   return 0;
 };