import { RowDataPacket } from 'mysql2';
import db from '../db';
import { PPLHonorData } from '@shared/api';

interface HonorQueryResult extends RowDataPacket {
    id: number;
    nama: string;
    totalHonor: number;
    kegiatanCount: number;
}

export const getHonorBulanan = async (bulan: number, tahun: number): Promise<PPLHonorData[]> => {
    // Bulan di SQL adalah 1-12, sedangkan di JS 0-11, jadi kita tambah 1
    const sqlMonth = bulan + 1;

    // Query ini akan menjumlahkan honor dari semua kegiatan yang aktif di bulan dan tahun yang dipilih
    // untuk setiap PPL. Ini adalah contoh sederhana; query yang lebih kompleks mungkin diperlukan
    // jika struktur data honor lebih rumit.
    const query = `
        SELECT
            p.id,
            p.namaPPL as nama,
            SUM(p.besaranHonor) as totalHonor,
            COUNT(k.id) as kegiatanCount
        FROM ppl p
        JOIN kegiatan k ON p.kegiatanId = k.id
        WHERE
            MONTH(k.tanggalMulai) <= ? AND YEAR(k.tanggalMulai) <= ?
            AND MONTH(k.tanggalSelesai) >= ? AND YEAR(k.tanggalSelesai) >= ?
        GROUP BY p.id, p.namaPPL
        ORDER BY p.namaPPL;
    `;

    const [rows] = await db.query<HonorQueryResult[]> (query, [sqlMonth, tahun, sqlMonth, tahun]);
    
    // Untuk saat ini, kita akan menyederhanakan 'activities' dan 'honorPerBulan'.
    // Integrasi penuh memerlukan struktur tabel yang lebih detail.
    return rows.map(row => ({
        id: String(row.id),
        nama: row.nama,
        honorBulanIni: row.totalHonor,
        activitiesCount: row.kegiatanCount,
        // Data riwayat honor masih statis untuk demonstrasi
        honorPerBulan: [2400000, 2200000, 2400000, 0, 2100000, 2400000, 2300000, 2400000, 2200000, 3600000, 0, 0],
    }));
};

export const getHonorDetail = async (pplId: number, tahun: number): Promise<number[]> => {
    // Membuat array 12 bulan yang diisi dengan 0
    const honorPerBulan = Array(12).fill(0);

    const query = `
        SELECT 
            MONTH(k.tanggalMulai) as bulan,
            SUM(p.besaranHonor) as totalHonorBulanan
        FROM ppl p
        JOIN kegiatan k ON p.kegiatanId = k.id
        WHERE
            p.id = ? AND YEAR(k.tanggalMulai) = ?
        GROUP BY MONTH(k.tanggalMulai);
    `;

    const [rows] = await db.query<RowDataPacket[]>(query, [pplId, tahun]);

    rows.forEach(row => {
        // Indeks array adalah bulan - 1 (Januari = bulan 1 -> indeks 0)
        const monthIndex = row.bulan - 1;
        if (monthIndex >= 0 && monthIndex < 12) {
            honorPerBulan[monthIndex] = row.totalHonorBulanan;
        }
    });

    return honorPerBulan;
};