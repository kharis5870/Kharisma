import { Router } from 'express';
import * as adminService from '../services/adminService';
import { terapkanImpor, type PermintaanImpor } from '../services/imporMitraService';
import { wajibAdmin } from '../auth/middleware';
import { ubahStatusAktifMitra } from '../services/pplService';
import { versiTokenPengguna } from '../services/authService';
import { buatToken, RAHASIA_SESI, UMUR_TOKEN_DETIK } from '../auth/token';
import { tangani, kirimGalat, bacaPeriodeOpsional } from './utilRoute';

const router = Router();

// Mengelola pengguna, ketua tim, dan PPL master adalah wewenang admin.
// Membaca daftar ketua tim dan PPL tetap terbuka bagi semua yang login: daftar
// itu dipakai halaman Input/Edit Kegiatan dan Daftar PPL, dan kuerinya tidak
// pernah mengembalikan hash password.
//
// Daftar AKUN pengguna (username + peran) pengecualiannya: hanya admin. Satu-
// satunya pemakainya halaman Manajemen Admin, dan daftar username lengkap
// beserta siapa yang admin adalah peta sasaran bagi orang yang menebak password.
//
// Setiap handler async dibungkus `tangani`. Tanpa itu, galat database di sini
// (mis. menambah pengguna dengan id yang sudah ada) menghentikan SELURUH proses
// server, bukan hanya menggagalkan satu permintaan. Lihat utilRoute.ts.


// User routes
router.get('/users', wajibAdmin, tangani(async (_req, res) => res.json(await adminService.getAllUsers())));
router.post('/users', wajibAdmin, tangani(async (req, res) => res.status(201).json(await adminService.createUser(req.body))));
router.put('/users/:id', wajibAdmin, tangani(async (req, res) => {
    const hasil = await adminService.updateUser(req.params.id, req.body);
    // Mengganti password mencabut semua sesi akun itu. Bila admin mengganti
    // password AKUNNYA SENDIRI, sesi yang sedang ia pakai ikut tercabut — jadi
    // ia diberi token pengganti, bukan tiba-tiba terlempar ke halaman login.
    if (req.params.id === req.user!.id && req.body?.password) {
        const versi = await versiTokenPengguna(req.user!.id);
        return res.json({ ...hasil, token: buatToken(req.user!.id, RAHASIA_SESI, UMUR_TOKEN_DETIK, undefined, versi) });
    }
    res.json(hasil);
}));
router.delete('/users/:id', wajibAdmin, tangani(async (req, res) => {
    await adminService.deleteUser(req.params.id);
    res.status(204).send();
}));

router.get('/pml', tangani(async (_req, res) => res.json(await adminService.getAllPMLs())));

// Ketua Tim routes
router.get('/ketua-tim', tangani(async (_req, res) => res.json(await adminService.getAllKetuaTim())));
router.post('/ketua-tim', wajibAdmin, tangani(async (req, res) => res.status(201).json(await adminService.createKetuaTim(req.body))));
router.put('/ketua-tim/:id', wajibAdmin, tangani(async (req, res) => res.json(await adminService.updateKetuaTim(req.params.id, req.body))));
// Menyalin kepengurusan satu tahun ke tahun berikutnya, dan mengganti nama
// sebuah tim di seluruh baris yang memakainya. Keduanya wewenang admin.
router.post('/ketua-tim/salin', wajibAdmin, tangani(async (req, res) =>
    res.json(await adminService.salinKetuaTim(req.body?.dariTahun, req.body?.keTahun))));

router.put('/tim/ganti-nama', wajibAdmin, tangani(async (req, res) =>
    res.json(await adminService.gantiNamaTim(req.body?.lama, req.body?.baru, req.body?.tahun))));

router.delete('/ketua-tim/:id', wajibAdmin, tangani(async (req, res) => {
    await adminService.deleteKetuaTim(req.params.id);
    res.status(204).send();
}));

// PPL routes
// Periode opsional menyaring kolom Kegiatan di Daftar PPL menurut rentang
// honornya; aturannya ada di `bacaPeriodeOpsional`.
router.get('/ppl', tangani(async (req, res) => res.json(await adminService.getAllPPLAdmin(bacaPeriodeOpsional(req.query)))));

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
        kirimGalat(res, error, 'Gagal mengimpor daftar mitra.');
    }
});
router.post('/ppl', wajibAdmin, tangani(async (req, res) => res.status(201).json(await adminService.createPPLAdmin(req.body))));
router.put('/ppl/:id', wajibAdmin, tangani(async (req, res) => res.json(await adminService.updatePPLAdmin(req.params.id, req.body))));
/**
 * Nonaktifkan / aktifkan kembali seorang mitra. Pengganti menghapus bagi mitra
 * yang sudah punya alokasi atau surat kontrak (penghapusannya ditolak).
 */
router.put('/ppl/:id/aktif', wajibAdmin, tangani(async (req, res) => {
    if (typeof req.body?.aktif !== 'boolean') {
        return res.status(400).json({ message: 'aktif harus bernilai true atau false.' });
    }
    const berhasil = await ubahStatusAktifMitra(req.params.id, req.body.aktif);
    if (!berhasil) return res.status(404).json({ message: 'Mitra tidak ditemukan.' });
    res.status(204).send();
}));
router.delete('/ppl/:id', wajibAdmin, tangani(async (req, res) => {
    await adminService.deletePPLAdmin(req.params.id);
    res.status(204).send();
}));

export default router;
