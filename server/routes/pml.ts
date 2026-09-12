// Di dalam file: server/routes/pml.ts

import express from 'express';
import { getPmlAdminData } from '../services/pmlService';

const router = express.Router();

const FORMAT_TANGGAL = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Periode opsional dari query string. Dianggap TIDAK ADA bila salah satu
 * tanggalnya hilang atau bentuknya tidak sah — menyaring dengan tanggal yang
 * separuh benar akan menghasilkan daftar yang salah tanpa ada yang menyadari.
 */
const bacaPeriodeOpsional = (query: any) => {
    const { tanggalMulai, tanggalSelesai } = query;
    if (!FORMAT_TANGGAL.test(tanggalMulai || '') || !FORMAT_TANGGAL.test(tanggalSelesai || '')) return undefined;
    if (tanggalMulai > tanggalSelesai) return undefined;
    return { mulai: tanggalMulai as string, selesai: tanggalSelesai as string };
};

router.get('/', async (req, res) => {
    try {
        const pmlList = await getPmlAdminData(bacaPeriodeOpsional(req.query));
        res.json(pmlList);
    } catch (error) {
        console.error('Error fetching PML list:', error);
        res.status(500).json({ message: 'Gagal mengambil daftar PML' });
    }
});

export default router;