// Di dalam file: server/routes/alamat.ts
import express from 'express';
import { getAllKecamatan, getDesaByKecamatan } from '../services/alamatService';
import { tangani } from './utilRoute';

const router = express.Router();

// Dibungkus `tangani`: galat database di handler async tanpa try/catch akan
// menghentikan seluruh proses server. Lihat utilRoute.ts.
router.get('/kecamatan', tangani(async (_req, res) => {
    res.json(await getAllKecamatan());
}));

router.get('/desa', tangani(async (req, res) => {
    const kecamatanId = parseInt(req.query.kecamatanId as string, 10);
    if (!kecamatanId) return res.status(400).json({ message: 'kecamatanId is required' });
    res.json(await getDesaByKecamatan(kecamatanId));
}));

export default router;
