// server/routes/integrasi.ts

/**
 * Status integrasi luar.
 *
 * Endpoint ini tidak melakukan apa pun terhadap data — ia menjawab satu
 * pertanyaan: "apakah aplikasi ini siap disambungkan ke FASIH, dan apa yang
 * kurang?". Dibuat supaya kesiapan itu bisa ditunjukkan, bukan sekadar
 * diklaim.
 */

import { Router } from 'express';
import { statusIntegrasiFasih } from '../integrasi/sumberProgress';
import { wajibAdmin } from '../auth/middleware';

const router = Router();

// Admin saja: keterangan konfigurasi server bukan konsumsi umum.
router.get('/fasih/status', wajibAdmin, (_req, res) => {
    res.json(statusIntegrasiFasih());
});

export default router;
