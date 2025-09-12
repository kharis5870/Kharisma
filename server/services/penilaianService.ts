// server/services/penilaianService.ts

import { RowDataPacket } from 'mysql2';
import pool from '../db';
import { RekapPenilaian, PenilaianRequest } from '../../shared/api'; // Kita akan definisikan tipe ini nanti
import db from '../db';

/**
 * Mengambil daftar gabungan PPL dari sebuah kegiatan beserta data penilaiannya (jika ada).
 */
export const getPenilaianList = async (tahun?: number, triwulan?: number) => {
    let whereClauses: string[] = [];
    let params: (string | number)[] = [];

    // Jika parameter tahun dan triwulan diberikan, buat klausa WHERE yang dinamis
    if (tahun && triwulan && triwulan > 0) {
        const bulanMulai = (triwulan - 1) * 3 + 1;
        const bulanSelesai = triwulan * 3;

        // Logika CASE untuk memilih kolom bulan_honor yang relevan berdasarkan tahap PPL
        const dynamicMonthFilter = `
            (
                CAST(SUBSTRING_INDEX(
                    CASE
                        WHEN p.tahap = 'listing' THEN k.bulanHonorListing
                        WHEN p.tahap = 'pencacahan' THEN k.bulanHonorPencacahan
                        WHEN p.tahap = 'pengolahan-analisis' THEN k.bulanHonorPengolahan
                    END,
                '-', 1) AS UNSIGNED) BETWEEN ? AND ?
            ) AND (
                CAST(SUBSTRING_INDEX(
                    CASE
                        WHEN p.tahap = 'listing' THEN k.bulanHonorListing
                        WHEN p.tahap = 'pencacahan' THEN k.bulanHonorPencacahan
                        WHEN p.tahap = 'pengolahan-analisis' THEN k.bulanHonorPengolahan
                    END,
                '-', -1) AS UNSIGNED) = ?
            )
        `;
        whereClauses.push(dynamicMonthFilter);
        params.push(bulanMulai, bulanSelesai, tahun);
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

    // Konversi tipe data 'rataRata' menjadi angka (sudah benar)
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
    const bulanMulai = (triwulan - 1) * 3 + 1;
    const bulanSelesai = triwulan * 3;

    const query = `
        SELECT
            p.ppl_master_id AS pplId,
            pm.namaPPL,
            COUNT(DISTINCT CONCAT(p.kegiatanId, '-', p.tahap)) AS totalKegiatan,
            ROUND(AVG(pn.rata_rata), 2) AS rataRataNilai,
            (ROUND(AVG(pn.rata_rata), 2) + (0.1 * COUNT(DISTINCT CONCAT(p.kegiatanId, '-', p.tahap)))) AS nilaiAkhir
        FROM
            ppl p -- Mulai dari tabel PPL untuk mencakup semua yang bekerja
        JOIN kegiatan k ON p.kegiatanId = k.id
        JOIN ppl_master pm ON p.ppl_master_id = pm.id
        LEFT JOIN penilaian_mitra pn ON p.id = pn.pplId -- Gunakan LEFT JOIN agar yang belum dinilai tetap terhitung
        WHERE
            -- ✔️ GANTI LOGIKA FILTER DENGAN YANG INI
            (
                CAST(SUBSTRING_INDEX(
                    CASE
                        WHEN p.tahap = 'listing' THEN k.bulanHonorListing
                        WHEN p.tahap = 'pencacahan' THEN k.bulanHonorPencacahan
                        WHEN p.tahap = 'pengolahan-analisis' THEN k.bulanHonorPengolahan
                    END,
                '-', -1) AS UNSIGNED) = ?
            )
            AND
            (
                CAST(SUBSTRING_INDEX(
                    CASE
                        WHEN p.tahap = 'listing' THEN k.bulanHonorListing
                        WHEN p.tahap = 'pencacahan' THEN k.bulanHonorPencacahan
                        WHEN p.tahap = 'pengolahan-analisis' THEN k.bulanHonorPengolahan
                    END,
                '-', 1) AS UNSIGNED) BETWEEN ? AND ?
            )
        GROUP BY
            p.ppl_master_id, pm.namaPPL
        ORDER BY
            nilaiAkhir DESC, pm.namaPPL ASC;
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