import type { RequestHandler } from 'express';
// server/routes/settings.ts
import express from 'express';
import { getSetting, updateSetting } from '../services/settingsService';
import { wajibAdmin, wajibKeuangan } from '../auth/middleware';

const router = express.Router();

// Endpoint untuk MENGAMBIL satu pengaturan
router.get('/:key', async (req, res) => {
    try {
        const { key } = req.params;
        // Kita set default value kosong, karena frontend yang akan menanganinya
        const value = await getSetting(key, ''); 
        res.json({ key, value });
    } catch (error) {
        console.error('Gagal mengambil pengaturan:', error);
        res.status(500).json({ message: 'Gagal mengambil pengaturan.' });
    }
});

// Endpoint untuk MEMPERBARUI satu pengaturan
// Pengaturan aplikasi berlaku untuk semua orang; hanya admin yang boleh mengubahnya.
/**
 * Siapa yang boleh mengubah sebuah pengaturan.
 *
 * Batas honor bulanan (SBML) adalah urusan tim keuangan sehari-hari, jadi
 * mereka — bukan hanya admin — boleh mengubahnya. Pengaturan lain yang kelak
 * ditambahkan tetap khusus admin sampai ada alasan untuk membukanya; daftar
 * putih ini sengaja sempit.
 */
const KUNCI_UNTUK_KEUANGAN = new Set(['HONOR_LIMIT']);
const wajibBolehUbahSetting: RequestHandler = (req, res, next) =>
    KUNCI_UNTUK_KEUANGAN.has(req.params.key)
        ? wajibKeuangan(req, res, next)
        : wajibAdmin(req, res, next);

router.put('/:key', wajibBolehUbahSetting, async (req, res) => {
    try {
        const { key } = req.params;
        const { value } = req.body;

        if (value === undefined) {
            return res.status(400).json({ message: 'Nilai (value) tidak boleh kosong.' });
        }

        await updateSetting(key, value);
        res.status(200).json({ message: `Pengaturan ${key} berhasil diperbarui.` });
    } catch (error) {
        console.error('Gagal memperbarui pengaturan:', error);
        res.status(500).json({ message: 'Gagal memperbarui pengaturan.' });
    }
});

export default router;