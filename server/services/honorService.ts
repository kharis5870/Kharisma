import { RowDataPacket } from 'mysql2';
import db from '../db';
import { PPLHonorData } from '@shared/api';

interface HonorQueryResult extends RowDataPacket {
    id: number;
    nama: string;
    totalHonor: number;
    kegiatanCount: number;
    kegiatanNames: string | null;
}

export const getHonorBulanan = async (bulan: number, tahun: number): Promise<PPLHonorData[]> => {
    const sqlMonth = bulan + 1;

    const query = `
        SELECT
            p.namaPPL AS nama,
            SUM(p.besaranHonor) AS totalHonor,
            COUNT(DISTINCT k.id) AS kegiatanCount,
            MIN(p.id) AS id,
            GROUP_CONCAT(DISTINCT k.namaKegiatan SEPARATOR ';;') as kegiatanNames
        FROM ppl p
        JOIN kegiatan k ON p.kegiatanId = k.id
        WHERE
            MONTH(k.tanggalSelesaiPendataan) = ? AND YEAR(k.tanggalSelesaiPendataan) = ?
        GROUP BY p.namaPPL
        ORDER BY p.namaPPL;
    `;

    const [rows] = await db.query<HonorQueryResult[]>(query, [sqlMonth, tahun]);
    
    return rows.map(row => ({
        id: String(row.id),
        nama: row.nama,
        honorBulanIni: Number(row.totalHonor),
        activitiesCount: row.kegiatanCount,
        kegiatanNames: row.kegiatanNames ? row.kegiatanNames.split(';;') : [],
        honorPerBulan: [], 
    }));
};

export const getHonorDetail = async (pplId: number, tahun: number): Promise<number[]> => {
    const honorPerBulan = Array(12).fill(0);

    const [pplNameRows] = await db.query<RowDataPacket[]>('SELECT namaPPL FROM ppl WHERE id = ?', [pplId]);
    if (pplNameRows.length === 0) {
        return honorPerBulan;
    }
    const namaPPL = pplNameRows[0].namaPPL;

    const query = `
        SELECT 
            MONTH(k.tanggalSelesaiPendataan) as bulan,
            SUM(p.besaranHonor) as totalHonorBulanan
        FROM ppl p
        JOIN kegiatan k ON p.kegiatanId = k.id
        WHERE
            p.namaPPL = ? AND YEAR(k.tanggalSelesaiPendataan) = ?
        GROUP BY MONTH(k.tanggalSelesaiPendataan);
    `;

    const [rows] = await db.query<RowDataPacket[]>(query, [namaPPL, tahun]);

    rows.forEach(row => {
        const monthIndex = row.bulan - 1;
        if (monthIndex >= 0 && monthIndex < 12) {
            // PERBAIKAN: Mengubah hasil query menjadi Number
            honorPerBulan[monthIndex] = Number(row.totalHonorBulanan);
        }
    });

    return honorPerBulan;
};