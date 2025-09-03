// server/routes/kegiatan.ts
import { Router } from 'express';
import {
  getAllKegiatan,
  getKegiatanById,
  createKegiatan,
  updateKegiatan,
  updatePplProgress,
  deleteKegiatan,
  updateDocumentStatus,
  updateSingleDocument,
  createSingleDocument,
  deleteSingleDocument,
  approveDocumentsByTipe
} from '../services/kegiatanService';

const router = Router();

// GET all
router.get('/', async (_req, res) => {
  try {
    const kegiatan = await getAllKegiatan();
    res.json(kegiatan);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching kegiatan' });
  }
});

// GET by ID
router.get('/:id', async (req, res) => {
  try {
    const kegiatan = await getKegiatanById(parseInt(req.params.id));
    if (kegiatan) {
      res.json(kegiatan);
    } else {
      res.status(404).json({ message: 'Kegiatan not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error fetching kegiatan details' });
  }
});

// POST new
router.post('/', async (req, res) => {
  try {
    const newKegiatan = await createKegiatan(req.body);
    res.status(201).json(newKegiatan);
  } catch (error) {
    console.error("CREATE KEGIATAN ERROR:", error);
    res.status(500).json({ message: 'Error creating kegiatan' });
  }
});

// PUT update (untuk detail kegiatan)
router.put('/:id', async (req, res) => {
    try {
        const updatedKegiatan = await updateKegiatan(parseInt(req.params.id), req.body);
        res.json(updatedKegiatan);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating kegiatan' });
    }
});

// PUT update (untuk progress PPL)
router.put('/ppl/:pplId/progress', async (req, res) => {
    try {
        const { pplId } = req.params;
        // Ambil username dari body request
       const { progressData, username } = req.body;

       if (!username) {
           return res.status(400).json({ message: 'Username diperlukan untuk update progress' });
       }

       // Teruskan username sebagai argumen ketiga
       const updatedPpl = await updatePplProgress(parseInt(pplId), progressData, username);
        res.json(updatedPpl);
    } catch (error) {
        console.error("Error updating PPL progress:", error);
        res.status(500).json({ message: 'Gagal memperbarui progress PPL' });
    }
});

// RUTE UNTUK UPDATE STATUS DOKUMEN
router.put('/dokumen/:dokumenId/status', async (req, res) => {
    try {
        const { dokumenId } = req.params;
        const { status, username } = req.body;

        if (!status || !['Pending', 'Reviewed', 'Approved'].includes(status)) {
            return res.status(400).json({ message: 'Status tidak valid' });
        }
        if (!username) {
            return res.status(400).json({ message: 'Username diperlukan' });
        }

        const updatedDokumen = await updateDocumentStatus(parseInt(dokumenId), status, username);
        res.json(updatedDokumen);
    } catch (error) {
        console.error("Error updating document status:", error);
        res.status(500).json({ message: 'Gagal memperbarui status dokumen' });
    }
});

// RUTE BARU UNTUK APPROVE SEMUA DOKUMEN PER TAHAPAN
router.put('/:kegiatanId/tahapan/approve', async (req, res) => {
    try {
        const { kegiatanId } = req.params;
        const { tipe, username } = req.body;

        if (!tipe || !['persiapan', 'pengumpulan-data', 'pengolahan-analisis', 'diseminasi-evaluasi'].includes(tipe)) {
            return res.status(400).json({ message: 'Tipe tahapan tidak valid' });
        }
        if (!username) {
            return res.status(400).json({ message: 'Username diperlukan' });
        }

        await approveDocumentsByTipe(parseInt(kegiatanId), tipe, username);
        res.status(200).json({ message: `Semua dokumen untuk tahap ${tipe} telah disetujui.` });
    } catch (error) {
        console.error("Error approving documents by stage:", error);
        res.status(500).json({ message: 'Gagal menyetujui dokumen tahapan' });
    }
});

router.post('/dokumen', async (req, res) => {
    try {
        // @ts-ignore
        const username = req.user?.username || 'system_add';
        const newDocument = await createSingleDocument(req.body, username);
        res.status(201).json(newDocument);
    } catch (error: any) {
        console.error("Error creating single document:", error);
        res.status(500).json({ message: error.message || 'Gagal membuat dokumen baru.' });
    }
});

router.put('/dokumen/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { link, nama } = req.body;
        // Asumsi Anda memiliki middleware untuk otentikasi yang menaruh data user di req.user
        // @ts-ignore
        const username = req.user?.username || 'system_update';
        
        const updatedDocument = await updateSingleDocument(Number(id), { link, nama }, username);
        res.json(updatedDocument);
    } catch (error: any) {
        console.error("Error updating single document:", error);
        res.status(500).json({ message: error.message || 'Gagal memperbarui dokumen.' });
    }
});

// DELETE kegiatan
router.delete('/:id', async (req, res) => {
    try {
        const success = await deleteKegiatan(parseInt(req.params.id));
        if (success) {
            res.status(204).send();
        } else {
            res.status(404).json({ message: 'Kegiatan tidak ditemukan untuk dihapus' });
        }
    } catch (error) {
        console.error("Error deleting kegiatan:", error);
        res.status(500).json({ message: 'Gagal menghapus kegiatan' });
    }
});

router.delete('/dokumen/:id', async (req, res) => {
    try {
        const success = await deleteSingleDocument(parseInt(req.params.id));
        if (success) {
            res.status(204).send();
        } else {
            res.status(404).json({ message: 'Dokumen tidak ditemukan.' });
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

export default router;