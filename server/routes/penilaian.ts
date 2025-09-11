// server/routes/penilaian.ts

import express from 'express';
import { getPenilaianList, saveOrUpdatePenilaian, getRekapPenilaian } from '../services/penilaianService';

// Impor middleware otentikasi jika Anda punya, contoh: import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Rute untuk mendapatkan daftar semua mitra yang perlu dinilai
// Jika Anda punya middleware, tambahkan seperti ini: router.get('/', authenticateToken, async (req, res) => {
router.get('/', async (req, res) => {
  try {
    const penilaianList = await getPenilaianList();
    res.json(penilaianList);
  } catch (error) {
    console.error('Error fetching penilaian list:', error);
    res.status(500).json({ message: 'Gagal mengambil daftar penilaian' });
  }
});

// Rute untuk menyimpan atau memperbarui penilaian
// Jika Anda punya middleware, tambahkan seperti ini: router.post('/', authenticateToken, async (req, res) => {
router.post('/', async (req, res) => {
  try {
    // Anda mungkin ingin menambahkan validasi di sini
    const result = await saveOrUpdatePenilaian(req.body);
    res.status(200).json({ message: 'Penilaian berhasil disimpan', data: result });
  } catch (error) {
    console.error('Error saving penilaian:', error);
    res.status(500).json({ message: 'Gagal menyimpan penilaian' });
  }
});

router.get('/rekap', async (req, res) => {
    try {
        const tahun = parseInt(req.query.tahun as string);
        const triwulan = parseInt(req.query.triwulan as string);

        if (!tahun || !triwulan) {
            return res.status(400).json({ message: 'Parameter tahun dan triwulan diperlukan' });
        }

        const rekapList = await getRekapPenilaian(tahun, triwulan);
        res.json(rekapList);
    } catch (error) {
        console.error('Error fetching rekap penilaian:', error);
        res.status(500).json({ message: 'Gagal mengambil rekap penilaian' });
    }
});

export default router;