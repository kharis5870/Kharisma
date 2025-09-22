// Di dalam file: server/services/pmlService.ts

import { RowDataPacket } from 'mysql2';
import db from '../db';
import { PMLAdminData } from '@shared/api'; 

export const getPmlAdminData = async (): Promise<PMLAdminData[]> => {
    const query = `
        SELECT
            u.id,
            u.nama_lengkap AS namaPML,
            COUNT(DISTINCT CONCAT(p.kegiatanId, '-', p.tahap)) AS totalKegiatan,
            GROUP_CONCAT(DISTINCT CONCAT(k.namaKegiatan, ';;', p.tahap) SEPARATOR '||') AS kegiatanDetails
        FROM
            users u
        -- ✔️ PERBAIKAN UTAMA: JOIN tabel ppl menggunakan ID
        LEFT JOIN ppl p ON u.id = p.pml_id
        LEFT JOIN kegiatan k ON p.kegiatanId = k.id
        WHERE
            u.isPML = 1
        GROUP BY
            u.id, u.nama_lengkap
        ORDER BY
            u.nama_lengkap ASC;
    `;

    const [rows] = await db.query<RowDataPacket[]>(query);

    return rows.map(row => ({
        id: row.id,
        namaPML: row.namaPML,
        totalKegiatan: row.totalKegiatan || 0,
        kegiatanDetails: row.kegiatanDetails
            ? row.kegiatanDetails.split('||').map((detail: string) => {
                  const [nama, tahap] = detail.split(';;');
                  return { nama, tahap };
              })
            : [],
        posisi: 'Pendataan/Pengolahan' 
    }));
};