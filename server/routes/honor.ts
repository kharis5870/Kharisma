// server/routes/honor.ts

import { Router } from 'express';
import { getHonorBulanan, getHonorDetail, getTotalHonorPPLByMonth, validatePplHonor } from '../services/honorService';

const router = Router();

// GET /api/honor?bulan=7&tahun=2024 (contoh untuk Agustus)
router.get('/', async (req, res) => {
    const { bulan, tahun } = req.query;

    if (typeof bulan !== 'string' || typeof tahun !== 'string') {
        return res.status(400).json({ message: 'Parameter bulan dan tahun dibutuhkan' });
    }

    try {
        const data = await getHonorBulanan(parseInt(bulan), parseInt(tahun));
        res.json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching honor data' });
    }
});

// GET /api/honor/:pplId/detail?tahun=2024
router.get('/:pplId/detail', async (req, res) => {
    const { pplId } = req.params; // pplId sekarang adalah ppl_master_id (string)
    const { tahun } = req.query;

    if (!tahun || typeof tahun !== 'string') {
        return res.status(400).json({ message: 'Parameter tahun dibutuhkan' });
    }

    try {
        // PERBAIKAN: Tidak perlu parseInt untuk pplId karena sudah string
        const data = await getHonorDetail(pplId, parseInt(tahun));
        res.json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching honor detail' });
    }
});

 // RUTE BARU UNTUK VALIDASI HONOR SAAT INPUT KEGIATAN
 // GET /api/honor/ppl/validate?pplId=...&bulan=...&tahun=...
 router.get('/ppl/validate', async (req, res) => {
   try {
       const { pplId, bulan, tahun } = req.query;

       if (!pplId || !bulan || !tahun) {
           return res.status(400).json({ message: 'Parameter pplId, bulan, dan tahun diperlukan' });
       }

       const totalHonor = await getTotalHonorPPLByMonth(pplId as string, parseInt(bulan as string), parseInt(tahun as string));
       res.json({ totalHonor });

   } catch (error) {
       console.error("Error fetching PPL honor for validation:", error);
       res.status(500).json({ message: 'Gagal memuat data honor PPL' });
   }
 });
 
 router.post('/validate', async (req, res) => {
  try {
    const { pplMasterId, bulan, tahun, currentActivityHonor, kegiatanIdToExclude } = req.body;
    if (!pplMasterId || !bulan || !tahun || currentActivityHonor === undefined) {
      return res.status(400).json({ message: 'Parameter untuk validasi honor tidak lengkap.' });
    }
    const result = await validatePplHonor(pplMasterId, bulan, tahun, currentActivityHonor, kegiatanIdToExclude || null);
    res.json(result);
  } catch (error) {
    console.error('API Validation Error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan internal saat melakukan validasi honor.' });
  }
});

export default router;