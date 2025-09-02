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

export const getHonorBulanan = async (bulan: number, tahun: number): Promise<PPLHonorData[]> => {
    const bulanTahunFormatted = `${String(bulan).padStart(2, '0')}-${tahun}`;

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
           (k.bulanPembayaranHonor = ?)
           OR
           (
             k.bulanPembayaranHonor IS NULL AND
             k.tanggalMulaiPersiapan IS NOT NULL AND 
             k.tanggalSelesaiDiseminasiEvaluasi IS NOT NULL AND
             STR_TO_DATE(CONCAT('01-', LPAD(?, 2, '0'), '-', ?), '%d-%m-%Y')
             BETWEEN k.tanggalMulaiPersiapan AND k.tanggalSelesaiDiseminasiEvaluasi
           )
        GROUP BY p.ppl_master_id, pm.namaPPL
        ORDER BY pm.namaPPL;
    `;

    const [rows] = await db.query<HonorQueryResult[]>(query, [bulanTahunFormatted, bulan, tahun]);
    
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

    const query = `
        SELECT 
            IF(k.bulanPembayaranHonor IS NOT NULL, 
                CAST(SUBSTRING_INDEX(k.bulanPembayaranHonor, '-', 1) AS UNSIGNED), 
                MONTH(k.tanggalSelesaiDiseminasiEvaluasi)
            ) as bulan,
            SUM(p.besaranHonor) as totalHonorBulanan
        FROM ppl p
        JOIN kegiatan k ON p.kegiatanId = k.id
        WHERE
            p.ppl_master_id = ? AND 
            (
                YEAR(STR_TO_DATE(CONCAT('01-', k.bulanPembayaranHonor), '%d-%m-%Y')) = ? OR
                (k.bulanPembayaranHonor IS NULL AND YEAR(k.tanggalSelesaiDiseminasiEvaluasi) = ?)
            )
        GROUP BY bulan;
    `;

    const [rows] = await db.query<RowDataPacket[]>(query, [pplMasterId, tahun, tahun]);

    rows.forEach(row => {
        const monthIndex = row.bulan - 1;
        if (monthIndex >= 0 && monthIndex < 12) {
            honorPerBulan[monthIndex] = Number(row.totalHonorBulanan);
        }
    });

    return honorPerBulan;
};

export const getTotalHonorPPLByMonth = async (pplMasterId: string, bulan: number, tahun: number, kegiatanIdToExclude: number | null = null): Promise<number> => {
   let query = `
       SELECT SUM(p.besaranHonor) as totalHonor
       FROM kegiatan k
       JOIN ppl p ON k.id = p.kegiatanId
       WHERE
           p.ppl_master_id = ? AND 
           (
               k.bulanPembayaranHonor = ? OR
               (
                   k.bulanPembayaranHonor IS NULL AND 
                   (MONTH(k.tanggalMulaiPengumpulanData) = ? AND YEAR(k.tanggalMulaiPengumpulanData) = ?)
               )
           )
   `;

   const params: (string | number)[] = [pplMasterId, `${String(bulan).padStart(2, '0')}-${tahun}`, bulan, tahun];

    // Jika ada kegiatanIdToExclude, tambahkan kondisi ke query
    if (kegiatanIdToExclude) {
        query += ' AND k.id != ?';
        params.push(kegiatanIdToExclude);
    }

   const bulanPembayaran = `${String(bulan).padStart(2, '0')}-${tahun}`;
   const sqlMonth = bulan;

   const [rows] = await db.query<RowDataPacket[]>(query, params);

   if (rows.length > 0 && rows[0].totalHonor) {
       return parseInt(rows[0].totalHonor, 10);
   }
   return 0;
};

// Fungsi validasi utama yang baru
export const validatePplHonor = async (pplMasterId: string, bulan: number, tahun: number, currentActivityHonor: number, kegiatanIdToExclude: number | null) => {
    // 1. Ambil batas honor dari database
    const honorLimitString = await getSetting('HONOR_LIMIT', '3000000');
    const honorLimit = parseInt(honorLimitString, 10);

    // 2. Ambil total honor yang sudah ada untuk PPL tersebut di bulan itu
    const existingHonor = await getTotalHonorPPLByMonth(pplMasterId, bulan, tahun, kegiatanIdToExclude);

    // 3. Hitung proyeksi total honor
    const projectedTotal = existingHonor + currentActivityHonor;

    // 4. Kembalikan hasil validasi
    return {
        isOverLimit: projectedTotal > honorLimit,
        limit: honorLimit,
        projectedTotal: projectedTotal
    };
};