// server/routes/notifikasi.ts

import express from 'express';
import { getPendingDocumentNotifications } from '../services/notifikasiService';
// Impor middleware otentikasi jika Anda punya, contoh: import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Rute untuk mendapatkan semua notifikasi dokumen yang belum disetujui
// Jika Anda punya middleware, tambahkan seperti ini: router.get('/', authenticateToken, async (req, res) => {
router.get('/', async (req, res) => {
  try {
    const notifications = await getPendingDocumentNotifications();
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Gagal mengambil data notifikasi' });
  }
});

export default router;