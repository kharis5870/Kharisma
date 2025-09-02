// server/routes/settings.ts
import express from 'express';
import { getSetting, updateSetting } from '../services/settingsService';

const router = express.Router();

// Endpoint untuk MENGAMBIL satu pengaturan
router.get('/:key', async (req, res) => {
    try {
        const { key } = req.params;
        // Kita set default value kosong, karena frontend yang akan menanganinya
        const value = await getSetting(key, ''); 
        res.json({ key, value });
    } catch (error) {
        res.status(500).json({ message: 'Gagal mengambil pengaturan.' });
    }
});

// Endpoint untuk MEMPERBARUI satu pengaturan
router.put('/:key', async (req, res) => {
    try {
        const { key } = req.params;
        const { value } = req.body;

        if (value === undefined) {
            return res.status(400).json({ message: 'Nilai (value) tidak boleh kosong.' });
        }

        await updateSetting(key, value);
        res.status(200).json({ message: `Pengaturan ${key} berhasil diperbarui.` });
    } catch (error) {
        res.status(500).json({ message: 'Gagal memperbarui pengaturan.' });
    }
});

export default router;