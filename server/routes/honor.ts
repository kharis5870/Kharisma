// server/routes/honor.ts

import { Router } from 'express';
import { getHonorRekap, getHonorDetail } from '../services/honorService';

const router = Router();

const FORMAT_TANGGAL = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Rekap honor untuk sebuah rentang tanggal.
 *
 *   GET /api/honor?tanggalMulai=2026-01-10&tanggalSelesai=2026-01-31
 *
 * Bentuk lama masih didukung supaya pemanggil lain tidak rusak; bulan
 * diterjemahkan menjadi rentang tanggal 1 s.d. akhir bulan:
 *
 *   GET /api/honor?bulan=1&tahun=2026
 */
router.get('/', async (req, res) => {
    const { bulan, tahun, tanggalMulai, tanggalSelesai } = req.query;

    let mulai: string;
    let selesai: string;

    if (typeof tanggalMulai === 'string' && typeof tanggalSelesai === 'string') {
        if (!FORMAT_TANGGAL.test(tanggalMulai) || !FORMAT_TANGGAL.test(tanggalSelesai)) {
            return res.status(400).json({ message: 'Format tanggal harus yyyy-MM-dd' });
        }
        if (tanggalMulai > tanggalSelesai) {
            return res.status(400).json({ message: 'tanggalMulai tidak boleh setelah tanggalSelesai' });
        }
        mulai = tanggalMulai;
        selesai = tanggalSelesai;
    } else if (typeof bulan === 'string' && typeof tahun === 'string') {
        const b = parseInt(bulan, 10);
        const t = parseInt(tahun, 10);
        if (!Number.isInteger(b) || b < 1 || b > 12 || !Number.isInteger(t)) {
            return res.status(400).json({ message: 'Parameter bulan atau tahun tidak valid' });
        }
        const bb = String(b).padStart(2, '0');
        // Date.UTC dengan hari 0 memberi hari terakhir bulan sebelumnya.
        const hariTerakhir = new Date(Date.UTC(t, b, 0)).getUTCDate();
        mulai = `${t}-${bb}-01`;
        selesai = `${t}-${bb}-${String(hariTerakhir).padStart(2, '0')}`;
    } else {
        return res.status(400).json({
            message: 'Butuh parameter tanggalMulai dan tanggalSelesai (atau bulan dan tahun)',
        });
    }

    try {
        const data = await getHonorRekap(mulai, selesai);
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