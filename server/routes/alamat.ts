// Di dalam file: server/routes/alamat.ts
import express from 'express';
import { getAllKecamatan, getDesaByKecamatan } from '../services/alamatService';

const router = express.Router();

router.get('/kecamatan', async (_req, res) => {
    res.json(await getAllKecamatan());
});

router.get('/desa', async (req, res) => {
    const kecamatanId = parseInt(req.query.kecamatanId as string, 10);
    if (!kecamatanId) return res.status(400).json({ message: 'kecamatanId is required' });
    res.json(await getDesaByKecamatan(kecamatanId));
});

export default router;