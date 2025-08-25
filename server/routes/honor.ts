// server/routes/honor.ts

import { Router } from 'express';
import { getHonorBulanan, getHonorDetail } from '../services/honorService';

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

export default router;