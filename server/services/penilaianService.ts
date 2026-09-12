// server/services/penilaianService.ts

import { RowDataPacket } from 'mysql2';
import pool from '../db';
import { RekapPenilaian, PenilaianRequest } from '../../shared/api';
import db from '../db';

/**
 * Bulan acuan penilaian satu alokasi PPL: bulan PERTAMA honornya dibebankan.
 *
 * Dulu triwulan ditentukan HANYA dari kolom `bulanHonor*` milik tahap. Sejak
 * bulan pembebanan dipilih per alokasi (lihat `ppl_honor_bulan`), kolom itu
 * sengaja dibiarkan kosong untuk periode honor lintas bulan — dan
 * `BETWEEN` atas NULL bernilai NULL, sehingga mitranya HILANG dari daftar
 * penilaian dan tidak pernah bisa dinilai.
 *
 * SATU triwulan per alokasi, bukan setiap triwulan yang disentuh honornya:
 * `penilaian_mitra` punya kunci unik (pplId, kegiatanId), jadi satu alokasi
 * memang hanya dinilai sekali. Memunculkannya di dua triwulan akan membuat
 * nilai yang sama terhitung dua kali di rekap kedua triwulan itu.
 *
 * Urutan cadangan: bulan pertama yang benar-benar menanggung honor, lalu bulan
 * pertama mana pun (alokasi berhonor nol tetap perlu dinilai), lalu kolom
 * `bulanHonor*` lama untuk data yang belum punya baris pembebanan.
 *
 * `STR_TO_DATE` sebelum `MIN`: kunci 'MM-YYYY' tidak bisa diurutkan sebagai
 * teks — '12-2025' dianggap lebih besar dari '01-2026'.
 */
const BULAN_ACUAN_PENILAIAN = `COALESCE(
    (SELECT MIN(STR_TO_DATE(CONCAT('01-', b.bulan), '%d-%m-%Y'))
       FROM ppl_honor_bulan b WHERE b.ppl_id = p.id AND b.jumlah > 0),
    (SELECT MIN(STR_TO_DATE(CONCAT('01-', b.bulan), '%d-%m-%Y'))
       FROM ppl_honor_bulan b WHERE b.ppl_id = p.id),
    STR_TO_DATE(CONCAT('01-', CASE p.tahap
        WHEN 'listing' THEN k.bulanHonorListing
        WHEN 'pencacahan' THEN k.bulanHonorPencacahan
        WHEN 'pengolahan-analisis' THEN k.bulanHonorPengolahan
    END), '%d-%m-%Y')
)`;

/** Parameter: (tahun, bulanMulai, bulanSelesai) — urutannya sama di kedua pemakai. */
const FILTER_TRIWULAN = `(
    YEAR(${BULAN_ACUAN_PENILAIAN}) = ?
    AND MONTH(${BULAN_ACUAN_PENILAIAN}) BETWEEN ? AND ?
)`;

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
        // Lihat BULAN_ACUAN_PENILAIAN untuk alasan triwulan tidak lagi diambil
        // dari kolom `bulanHonor*` saja.
        whereClauses.push(FILTER_TRIWULAN);
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
            u.nama_lengkap AS namaPML,
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
  // penilaianId sengaja tidak dipakai: kuerinya ON DUPLICATE KEY UPDATE, jadi
  // baris lama dikenali dari UNIQUE KEY (pplId, kegiatanId), bukan dari id.
  const { sikapPelikaku, kualitasPekerjaan, ketepatanWaktu, pplId, kegiatanId, pmlId, dinilaiOleh_userId } = data;

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
            (ROUND(AVG(pn.rata_rata), 2) + (0.01 * COUNT(DISTINCT CONCAT(p.kegiatanId, '-', p.tahap)))) AS nilaiAkhir
        FROM
            ppl p -- Mulai dari tabel PPL untuk mencakup semua yang bekerja
        JOIN kegiatan k ON p.kegiatanId = k.id
        JOIN ppl_master pm ON p.ppl_master_id = pm.id
        LEFT JOIN penilaian_mitra pn ON p.id = pn.pplId -- Gunakan LEFT JOIN agar yang belum dinilai tetap terhitung
        WHERE
            -- Triwulan dari bulan pertama honor alokasi itu dibebankan;
            -- lihat BULAN_ACUAN_PENILAIAN.
            ${FILTER_TRIWULAN}
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