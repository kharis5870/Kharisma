// server/services/notifikasiService.ts

import pool from '../db';

/**
 * Mengambil daftar dokumen yang memiliki link dan statusnya 'Pending'.
 * Ini akan menjadi sumber data untuk notifikasi di header.
 */
export const getPendingDocumentNotifications = async () => {
  // Kueri ini menggabungkan tabel `dokumen`, `kegiatan`, dan `users`
  // untuk mendapatkan semua informasi yang dibutuhkan sesuai prototipe.
  const query = `
    SELECT 
      d.id,
      d.nama AS namaDokumen,
      k.nama AS namaKegiatan,
      k.id AS kegiatanId,
      d.link AS linkFile,
      u.nama AS uploadedBy,
      d.uploadedAt,
      'pending_approval' AS status, -- Kita set status secara manual agar cocok dengan frontend
      'document_uploaded' AS type
    FROM dokumen d
    JOIN kegiatan k ON d.kegiatanId = k.id
    LEFT JOIN users u ON d.diunggahOleh_userId = u.id -- Asumsi ada kolom 'diunggahOleh_userId'
    WHERE 
      d.status = 'Pending' AND d.link IS NOT NULL
    ORDER BY d.uploadedAt DESC
    LIMIT 10; -- Batasi 10 notifikasi terbaru untuk performa
  `;

  const [rows] = await pool.query(query);
  return rows;
};