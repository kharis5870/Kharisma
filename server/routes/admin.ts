import { Router } from 'express';
import * as adminService from '../services/adminService';
import { terapkanImpor, type PermintaanImpor } from '../services/imporMitraService';
import { wajibAdmin } from '../auth/middleware';

const router = Router();

// Mengelola pengguna, ketua tim, dan PPL master adalah wewenang admin.
// Membacanya tetap terbuka bagi semua yang login: daftar ketua tim dan PPL
// dipakai halaman Input/Edit Kegiatan dan Daftar PPL, dan kuerinya tidak
// pernah mengembalikan hash password.


// User routes
router.get('/users', async (_req, res) => res.json(await adminService.getAllUsers()));
router.post('/users', wajibAdmin, async (req, res) => res.status(201).json(await adminService.createUser(req.body)));
router.put('/users/:id', wajibAdmin, async (req, res) => res.json(await adminService.updateUser(req.params.id, req.body)));
router.delete('/users/:id', wajibAdmin, async (req, res) => {
    await adminService.deleteUser(req.params.id);
    res.status(204).send();
});

router.get('/pml', async (_req, res) => res.json(await adminService.getAllPMLs()));

// Ketua Tim routes
router.get('/ketua-tim', async (_req, res) => res.json(await adminService.getAllKetuaTim()));
router.post('/ketua-tim', wajibAdmin, async (req, res) => res.status(201).json(await adminService.createKetuaTim(req.body)));
router.put('/ketua-tim/:id', wajibAdmin, async (req, res) => res.json(await adminService.updateKetuaTim(req.params.id, req.body)));
router.delete('/ketua-tim/:id', wajibAdmin, async (req, res) => {
    await adminService.deleteKetuaTim(req.params.id);
    res.status(204).send();
});

// PPL routes
const FORMAT_TANGGAL = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Periode opsional dari query string, untuk menyaring kolom Kegiatan di Daftar
 * PPL menurut rentang honornya.
 *
 * Dianggap TIDAK ADA bila salah satu tanggalnya hilang atau bentuknya tidak
 * sah. Menyaring dengan tanggal yang separuh benar akan menghasilkan daftar
 * yang salah tanpa ada yang menyadarinya — lebih baik menampilkan semuanya.
 */
const bacaPeriodeOpsional = (query: any) => {
    const { tanggalMulai, tanggalSelesai } = query;
    if (!FORMAT_TANGGAL.test(tanggalMulai || '') || !FORMAT_TANGGAL.test(tanggalSelesai || '')) return undefined;
    if (tanggalMulai > tanggalSelesai) return undefined;
    return { mulai: tanggalMulai as string, selesai: tanggalSelesai as string };
};

router.get('/ppl', async (req, res) => res.json(await adminService.getAllPPLAdmin(bacaPeriodeOpsional(req.query))));

/**
 * POST impor daftar mitra dari berkas SOBAT.
 *
 * Berkas Excel-nya dibaca DI LAYAR, bukan di sini: yang dikirim ke server sudah
 * berupa baris yang terbaca beserta keputusan pengguna untuk tiap baris
 * (tambah / perbarui / lewati). Dengan begitu layar pemetaan kolom dan dialog
 * duplikat bisa berjalan sebelum apa pun menyentuh database.
 *
 * `pratinjau: true` hanya menghitung dan tidak menulis apa pun — dipakai untuk
 * memperlihatkan ringkasan sebelum pengguna menyetujui.
 */
router.post('/ppl/impor', wajibAdmin, async (req, res) => {
    try {
        const { baris, keputusan, nonaktifkan, pratinjau } = req.body ?? {};
        if (!Array.isArray(baris) || !Array.isArray(keputusan)) {
            return res.status(400).json({ message: 'baris dan keputusan harus berupa daftar.' });
        }
        if (nonaktifkan !== undefined && !Array.isArray(nonaktifkan)) {
            return res.status(400).json({ message: 'nonaktifkan harus berupa daftar id mitra.' });
        }
        const permintaan: PermintaanImpor = {
            baris, keputusan, nonaktifkan,
            // Bawaannya PRATINJAU: permintaan yang lupa menyebutkan niatnya
            // tidak boleh diam-diam menulis ke daftar mitra.
            pratinjau: pratinjau !== false,
        };
        res.json(await terapkanImpor(permintaan));
    } catch (error: any) {
        console.error('Error impor mitra:', error);
        res.status(500).json({ message: error.message || 'Gagal mengimpor daftar mitra.' });
    }
});
router.post('/ppl', wajibAdmin, async (req, res) => res.status(201).json(await adminService.createPPLAdmin(req.body)));
router.put('/ppl/:id', wajibAdmin, async (req, res) => res.json(await adminService.updatePPLAdmin(req.params.id, req.body)));
router.delete('/ppl/:id', wajibAdmin, async (req, res) => {
    await adminService.deletePPLAdmin(req.params.id);
    res.status(204).send();
});

export default router;
