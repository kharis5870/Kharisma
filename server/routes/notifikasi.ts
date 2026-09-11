// server/routes/notifikasi.ts

import express from 'express';
import { getNotificationsFor } from '../services/notifikasiService';

const router = express.Router();

const ROLE_SAH = ['admin', 'supervisor', 'user'] as const;

/**
 * GET /api/notifikasi?userId=<id>&role=<role>
 *
 * BATASAN KEAMANAN, dinyatakan terbuka: `userId` dan `role` datang sebagai
 * query parameter dari klien, jadi siapa pun bisa memanggil dengan
 * `role=admin` dan membaca seluruh dokumen tertunda beserta tautannya.
 *
 * Ini konsisten dengan sisa aplikasi — `apiClient` tidak pernah mengirim
 * header Authorization, dan setiap route yang mengubah data sudah memercayai
 * `username` dari body — jadi endpoint ini tidak MENURUNKAN standar yang ada.
 * Tapi ini IDOR sungguhan. Perbaikannya satu hal, bukan banyak: terbitkan
 * token saat login, pasang di apiClient.request, lalu satu middleware Express
 * yang mengisi req.user. Seluruh route yang sekarang memercayai body langsung
 * ikut benar. Layak dijadwalkan sebagai pekerjaan tersendiri.
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
