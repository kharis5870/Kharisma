// server/services/notifikasiService.ts

import pool from '../db';

/**
 * Mengambil daftar dokumen yang memiliki link dan statusnya 'Pending'.
 * Ini akan menjadi sumber data untuk notifikasi di header.
 */
export const getPendingDocumentNotifications = async () => {
  const query = `
    SELECT 
      d.id,
      d.nama AS namaDokumen,
      k.namaKegiatan AS namaKegiatan,
      k.id AS kegiatanId,
      d.link AS linkFile,
      u.nama_lengkap AS uploadedBy,
      d.uploadedAt AS uploadedAt,
      d.tipe AS tahap,
      'pending_approval' AS status, 
      'document_uploaded' AS type
    FROM dokumen d
    JOIN kegiatan k ON d.kegiatanId = k.id
    LEFT JOIN users u ON d.lastEditedBy_userId = u.id 
    WHERE 
      d.status = 'Pending' 
      AND d.link IS NOT NULL
      AND d.link <> ''
    ORDER BY d.uploadedAt DESC
    LIMIT 10; 
  `;

  const [rows] = await pool.query(query);
  return rows;
};