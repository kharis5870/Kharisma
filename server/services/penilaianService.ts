// server/services/penilaianService.ts

import pool from '../db';
import { PenilaianRequest } from '../../shared/api'; // Kita akan definisikan tipe ini nanti

/**
 * Mengambil daftar gabungan PPL dari sebuah kegiatan beserta data penilaiannya (jika ada).
 */
export const getPenilaianList = async () => {
  const query = `
    SELECT
      p.id AS id, -- ID unik dari tabel PPL, kita gunakan sebagai ID utama
      k.id AS kegiatanId,
      k.nama AS namaKegiatan,
      p.id AS pplId,
      pmaster.nama AS namaPPL,
      u.id AS pmlId,
      u.nama AS namaPML,
      pn.sikap_perilaku AS sikapPelikaku,
      pn.kualitas_pekerjaan AS kualitasPekerjaan,
      pn.ketepatan_waktu AS ketepatanWaktu,
      pn.rata_rata AS rataRata,
      (CASE WHEN pn.id IS NOT NULL THEN 1 ELSE 0 END) AS sudahDinilai,
      pn.tanggal_penilaian AS tanggalPenilaian,
      (SELECT nama FROM users WHERE id = pn.dinilai_oleh_userId) AS dinilaiOleh
    FROM ppl p
    JOIN kegiatan k ON p.kegiatanId = k.id
    JOIN ppl_master pmaster ON p.ppl_master_id = pmaster.id
    LEFT JOIN users u ON p.pml_id = u.id -- Mengambil nama PML dari tabel PPL
    LEFT JOIN penilaian_mitra pn ON p.id = pn.pplId AND k.id = pn.kegiatanId
    ORDER BY k.nama, pmaster.nama;
  `;

  const [rows] = await pool.query(query);
  return rows;
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