// Di dalam file: server/services/pmlService.ts

import { RowDataPacket } from 'mysql2';
import db from '../db';
import { PMLAdminData } from '@shared/api';
import { KONDISI_PERIODE, paramPeriode } from './rentangHonorSql';
import type { PeriodeFilter } from './pplService';

export const getPmlAdminData = async (periode?: PeriodeFilter): Promise<PMLAdminData[]> => {
    // Sama seperti daftar mitra: penyaringan periode ada DI DALAM tabel
    // turunan, supaya PML yang tidak mengawasi apa pun pada periode itu tetap
    // tampil dengan angka 0 dan tidak lenyap dari daftar.
    const saringPeriode = periode ? KONDISI_PERIODE : '1';
    const query = `
        SELECT
            u.id,
            u.nama_lengkap AS namaPML,
            COUNT(DISTINCT CONCAT(x.kegiatanId, '-', x.tahap)) AS totalKegiatan,
            -- Mitra BERBEDA, bukan alokasi: satu mitra yang diawasi pada dua
            -- kegiatan tetap satu orang yang harus didampingi.
            COUNT(DISTINCT x.ppl_master_id) AS jumlahMitra,
            -- Beban kerja seluruh alokasi yang diawasi. Penjaganya ada di tabel
            -- turunan: satu alokasi hanya berpasangan dengan SATU baris
            -- honorarium, kalau tidak penjumlahannya menggandakan diri.
            COALESCE(SUM(x.muatan), 0) AS totalMuatan,
            GROUP_CONCAT(DISTINCT CONCAT(x.namaKegiatan, ';;', x.tahap) SEPARATOR '||') AS kegiatanDetails
        FROM
            users u
        -- ✔️ PERBAIKAN UTAMA: JOIN tabel ppl menggunakan ID
        LEFT JOIN (
            SELECT p.id, p.pml_id, p.ppl_master_id, p.kegiatanId, p.tahap,
                   k.namaKegiatan,
                   CAST(ph.bebanKerja AS DECIMAL(12,2)) AS muatan
              FROM ppl p
              LEFT JOIN kegiatan k ON p.kegiatanId = k.id
              -- Tahap pada tabel ppl bernama 'pengolahan-analisis', sedangkan
              -- ppl_honorarium.jenis_pekerjaan memakai 'pengolahan'.
              LEFT JOIN ppl_honorarium ph
                     ON ph.ppl_id = p.id
                    AND ph.jenis_pekerjaan = CASE p.tahap
                          WHEN 'pengolahan-analisis' THEN 'pengolahan' ELSE p.tahap END
             WHERE ${saringPeriode}
        ) x ON x.pml_id = u.id
        WHERE
            u.isPML = 1
        GROUP BY
            u.id, u.nama_lengkap
        ORDER BY
            u.nama_lengkap ASC;
    `;

    const [rows] = await db.query<RowDataPacket[]>(
        query, periode ? paramPeriode(periode.mulai, periode.selesai) : []);

    return rows.map(row => ({
        id: row.id,
        namaPML: row.namaPML,
        totalKegiatan: row.totalKegiatan || 0,
        jumlahMitra: Number(row.jumlahMitra) || 0,
        totalMuatan: Number(row.totalMuatan) || 0,
        kegiatanDetails: row.kegiatanDetails
            ? row.kegiatanDetails.split('||').map((detail: string) => {
                  const [nama, tahap] = detail.split(';;');
                  return { nama, tahap };
              })
            : [],
        posisi: 'Pendataan/Pengolahan' 
    }));
};