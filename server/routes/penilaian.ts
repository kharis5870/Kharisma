// server/routes/penilaian.ts

import express from 'express';
import { getPenilaianList, saveOrUpdatePenilaian, getRekapPenilaian } from '../services/penilaianService';
// Jalur relatif, BUKAN @shared — lihat catatan di kontrakService.ts.
import { nilaiPenilaianSah } from '../../shared/mutuPenilaian';
import { wajibPenilaiMitra } from '../auth/kepemilikan';

const router = express.Router();

// Rute untuk mendapatkan daftar semua mitra yang perlu dinilai
router.get('/', async (req, res) => {
  try {
    const tahun = req.query.tahun ? parseInt(req.query.tahun as string) : undefined;
    const triwulan = req.query.triwulan ? parseInt(req.query.triwulan as string) : undefined;
        
    const penilaianList = await getPenilaianList(tahun, triwulan);
    res.json(penilaianList);
  } catch (error) {
    console.error('Error fetching penilaian list:', error);
    res.status(500).json({ message: 'Gagal mengambil daftar penilaian' });
  }
});

// Rute untuk menyimpan atau memperbarui penilaian.
// Hanya PML yang mengawasi mitra itu (atau admin) — lihat wajibPenilaiMitra.
router.post('/', wajibPenilaiMitra, async (req, res) => {
  try {
    const { kegiatanId, sikapPelikaku, kualitasPekerjaan, ketepatanWaktu } = req.body;
    const ppl = res.locals.pplDinilai as { id: number; kegiatanId: number; pml_id: string | null };

    // kegiatanId dari klien hanya dicocokkan, tidak dipercaya: yang disimpan
    // selalu kegiatan pemilik alokasi itu.
    if (kegiatanId !== undefined && Number(kegiatanId) !== Number(ppl.kegiatanId)) {
      return res.status(400).json({ message: 'Mitra tersebut tidak terdaftar pada kegiatan ini.' });
    }
    // Sampai sekarang rentangnya TIDAK pernah diperiksa di mana pun: kolomnya
    // int(2), jadi klien mana pun bisa mengirim 99 dan nilai itu tersimpan apa
    // adanya lalu merusak rata-rata mitra tersebut tanpa jejak.
    const aspek: [string, unknown][] = [
      ['Sikap dan Perilaku', sikapPelikaku],
      ['Kualitas Pekerjaan', kualitasPekerjaan],
      ['Ketepatan Waktu', ketepatanWaktu],
    ];
    for (const [label, nilai] of aspek) {
      if (!nilaiPenilaianSah(nilai)) {
        return res.status(400).json({
          message: `Nilai ${label} harus bilangan bulat 1 sampai 10.`,
        });
      }
    }

    // Identitas penilai dan PML diambil dari token dan database, BUKAN dari
    // badan permintaan — nilai kiriman klien tidak membuktikan apa pun.
    const result = await saveOrUpdatePenilaian({
      pplId: ppl.id,
      kegiatanId: ppl.kegiatanId,
      pmlId: ppl.pml_id,
      dinilaiOleh_userId: req.user!.id,
      sikapPelikaku,
      kualitasPekerjaan,
      ketepatanWaktu,
    });
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