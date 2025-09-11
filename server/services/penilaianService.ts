// server/services/penilaianService.ts

import { RowDataPacket } from 'mysql2';
import pool from '../db';
import { RekapPenilaian, PenilaianRequest } from '../../shared/api'; // Kita akan definisikan tipe ini nanti
import db from '../db';

/**
 * Mengambil daftar gabungan PPL dari sebuah kegiatan beserta data penilaiannya (jika ada).
 */
export const getPenilaianList = async (tahun?: number, triwulan?: number) => {
    let whereClauses = [];
    let params = [];

    if (tahun && triwulan) {
        const bulanMulai = (triwulan - 1) * 3 + 1;
        const bulanSelesai = triwulan * 3;
        whereClauses.push('YEAR(pn.tanggal_penilaian) = ? AND MONTH(pn.tanggal_penilaian) BETWEEN ? AND ?');
        params.push(tahun, bulanMulai, bulanSelesai);
    }
    
    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    
    const query = `
        SELECT
            p.id AS id,
            k.id AS kegiatanId,
            k.namaKegiatan AS namaKegiatan,
            p.id AS pplId,
            p.tahap AS tahap,
            pm.namaPPL AS namaPPL,
            p.namaPML AS namaPML,
            p.pml_id AS pmlId,
            pn.sikap_perilaku AS sikapPelikaku,
            pn.kualitas_pekerjaan AS kualitasPekerjaan,
            pn.ketepatan_waktu AS ketepatanWaktu,
            pn.rata_rata AS rataRata,
            (CASE WHEN pn.id IS NOT NULL THEN 1 ELSE 0 END) AS sudahDinilai,
            pn.tanggal_penilaian AS tanggalPenilaian,
            (SELECT nama_lengkap FROM users WHERE id = pn.dinilai_oleh_userId) AS dinilaiOleh
        FROM ppl p
        JOIN kegiatan k ON p.kegiatanId = k.id
        JOIN ppl_master pm ON p.ppl_master_id = pm.id
        LEFT JOIN users u ON p.pml_id = u.id
        LEFT JOIN penilaian_mitra pn ON p.id = pn.pplId
        ${whereSql}
        ORDER BY k.namaKegiatan, pm.namaPPL;
    `;

    const [rows] = await db.query<RowDataPacket[]>(query, params);
    return rows.map(row => ({
        ...row,
        sudahDinilai: Boolean(row.sudahDinilai),
        rataRata: row.rataRata ? Number(row.rataRata) : null,
    }));
};

/**
 * Menyimpan atau memperbarui data penilaian mitra.
 */
export const saveOrUpdatePenilaian = async (data: PenilaianRequest) => {
  const { penilaianId, sikapPelikaku, kualitasPekerjaan, ketepatanWaktu, pplId, kegiatanId, pmlId, dinilaiOleh_userId } = data;

  // Hitung rata-rata
  const rataRata = ((sikapPelikaku + kualitasPekerjaan + ketepatanWaktu) / 3).toFixed(2);

  // Kueri ON DUPLICATE KEY UPDATE akan melakukan INSERT jika belum ada,
  // atau UPDATE jika sudah ada data dengan pplId dan kegiatanId yang sama.
  // Ini dimungkinkan karena kita membuat UNIQUE KEY di tabel.
  const query = `
    INSERT INTO penilaian_mitra (pplId, kegiatanId, pmlId, sikap_perilaku, kualitas_pekerjaan, ketepatan_waktu, rata_rata, dinilai_oleh_userId)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      sikap_perilaku = VALUES(sikap_perilaku),
      kualitas_pekerjaan = VALUES(kualitas_pekerjaan),
      ketepatan_waktu = VALUES(ketepatan_waktu),
      rata_rata = VALUES(rata_rata),
      dinilai_oleh_userId = VALUES(dinilai_oleh_userId),
      pmlId = VALUES(pmlId);
  `;

  const [result] = await pool.query(query, [
    pplId,
    kegiatanId,
    pmlId,
    sikapPelikaku,
    kualitasPekerjaan,
    ketepatanWaktu,
    rataRata,
    dinilaiOleh_userId
  ]);



  return result;
};

export const getRekapPenilaian = async (tahun: number, triwulan: number): Promise<RekapPenilaian[]> => {
    // Tentukan rentang bulan berdasarkan triwulan
    const bulanMulai = (triwulan - 1) * 3 + 1;
    const bulanSelesai = triwulan * 3;

    const query = `
        SELECT
            p.ppl_master_id AS pplId,
            pm.namaPPL,
            COUNT(pn.id) AS totalKegiatan,
            AVG(pn.rata_rata) AS rataRataNilai,
            (AVG(pn.rata_rata) + (0.01 * COUNT(pn.id))) AS nilaiAkhir
        FROM
            penilaian_mitra pn
        JOIN ppl p ON pn.pplId = p.id
        JOIN ppl_master pm ON p.ppl_master_id = pm.id
        WHERE
            YEAR(pn.tanggal_penilaian) = ?
            AND MONTH(pn.tanggal_penilaian) BETWEEN ? AND ?
        GROUP BY
            p.ppl_master_id, pm.namaPPL
        ORDER BY
            nilaiAkhir DESC;
    `;

    const [rows] = await db.query<RowDataPacket[]>(query, [tahun, bulanMulai, bulanSelesai]);

    return rows.map(row => ({
        pplId: row.pplId,
        namaPPL: row.namaPPL,
        totalKegiatan: Number(row.totalKegiatan),
        rataRataNilai: row.rataRataNilai ? Number(row.rataRataNilai) : null,
        nilaiAkhir: row.nilaiAkhir ? Number(row.nilaiAkhir) : null,
    }));
};