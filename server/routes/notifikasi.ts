// server/routes/notifikasi.ts

import express from 'express';
import { getNotificationsFor } from '../services/notifikasiService';

const router = express.Router();

const ROLE_SAH = ['admin', 'supervisor', 'user'] as const;

/**
 * GET /api/notifikasi
 *
 * Mengembalikan notifikasi milik pengguna yang sedang login. Identitas dan
 * perannya diambil dari token sesi (`req.user`, diisi middleware `wajibLogin`),
 * bukan dari URL.
 *
 * Dulu `userId` dan `role` dikirim sebagai query parameter dan dipercaya begitu
 * saja, sehingga siapa pun bisa membaca notifikasi pengguna lain — termasuk
 * memakai `role=admin` untuk melihat seluruh dokumen tertunda beserta
 * tautannya. Sejak autentikasi token diterapkan, parameter itu tidak lagi
 * dibaca sama sekali.
 */
router.get('/', async (req, res) => {
  // Identitas diambil dari token, BUKAN dari query. Sebelumnya `userId` dan
  // `role` datang dari URL, sehingga siapa pun bisa membaca notifikasi
  // pengguna mana pun — termasuk memakai `role=admin` untuk melihat seluruh
  // dokumen tertunda beserta tautannya. Itu IDOR yang sesungguhnya, dan inilah
  // yang menutupnya.
  const userId = req.user!.id;
  const role = req.user!.role;

  try {
    const notifications = await getNotificationsFor(userId, role as typeof ROLE_SAH[number]);
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Gagal mengambil data notifikasi' });
  }
});

export default router;
