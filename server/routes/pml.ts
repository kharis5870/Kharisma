// Di dalam file: server/routes/pml.ts

import express from 'express';
import { getPmlAdminData } from '../services/pmlService';

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const pmlList = await getPmlAdminData();
        res.json(pmlList);
    } catch (error) {
        console.error('Error fetching PML list:', error);
        res.status(500).json({ message: 'Gagal mengambil daftar PML' });
    }
});

export default router;