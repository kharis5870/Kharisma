// Di dalam file: server/routes/pml.ts

import express from 'express';
import { getPmlAdminData } from '../services/pmlService';
import { bacaPeriodeOpsional } from './utilRoute';

const router = express.Router();

// Periode opsional dari query string; aturannya ada di `bacaPeriodeOpsional`.
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
