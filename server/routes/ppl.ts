import { Router } from 'express';
import { getAllMasterPPL } from '../services/pplService';

const router = Router();

// Route ini hanya MEMBACA daftar mitra aktif untuk Input & Edit Kegiatan.
// Menambah, mengubah, menonaktifkan, dan menghapus mitra dilakukan lewat
// halaman Manajemen Admin (/admin/ppl) — dulu route ini punya POST/PUT/DELETE
// kembaran yang tidak pernah dipanggil layar mana pun.


// GET all master PPL
router.get('/', async (_req, res) => {
  try {
    const pplList = await getAllMasterPPL();
    res.json(pplList);
  } catch (error) {
    console.error('Error fetching PPL list:', error);
    res.status(500).json({ message: 'Error fetching PPL list' });
  }
});

export default router;
