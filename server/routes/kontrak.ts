// server/routes/kontrak.ts

import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
    getTemplateAktif,
    updateTemplate,
    getUraianTugas,
    simpanUraianTugas,
    getDataKontrak,
    pesanNomorKontrak,
    pesanNomorBast,
    getMaksNomorUrut,
    aturUlangNomorPeriode,
    getRiwayatSurat,
    ubahNomorSurat,
    batalkanSurat,
    ubahCatatanSurat,
    hapusSuratBatal,
    rapikanNomorTahun,
    perbaruiIsiSurat,
} from '../services/kontrakService';
// Jalur relatif, BUKAN @shared — lihat catatan di kontrakService.ts.
import { penandaTidakDikenal, polaTanpaNomor } from '../../shared/nomorSurat';
import { konfirmasiAturUlangSah } from '../../shared/aturUlangNomor';
import { wajibKeuangan } from '../auth/middleware';

const router = Router();

const FORMAT_TANGGAL = /^\d{4}-\d{2}-\d{2}$/;

/** Membaca dan memvalidasi pasangan tanggalMulai/tanggalSelesai dari query. */
const bacaPeriode = (query: any): { mulai: string; selesai: string } | { error: string } => {
    const { tanggalMulai, tanggalSelesai } = query;
    if (typeof tanggalMulai !== 'string' || typeof tanggalSelesai !== 'string') {
        return { error: 'Parameter tanggalMulai dan tanggalSelesai dibutuhkan.' };
    }
    if (!FORMAT_TANGGAL.test(tanggalMulai) || !FORMAT_TANGGAL.test(tanggalSelesai)) {
        return { error: 'Format tanggal harus yyyy-MM-dd.' };
    }
    if (tanggalMulai > tanggalSelesai) {
        return { error: 'tanggalMulai tidak boleh setelah tanggalSelesai.' };
    }
    return { mulai: tanggalMulai, selesai: tanggalSelesai };
};

// GET template surat yang aktif
router.get('/template', async (_req, res) => {
    try {
        const template = await getTemplateAktif();
        if (!template) {
            return res.status(404).json({ message: 'Belum ada template surat yang aktif.' });
        }
        res.json(template);
    } catch (error: any) {
        console.error('Error fetching template surat:', error);
        res.status(500).json({ message: error.message || 'Gagal memuat template surat.' });
    }
});

// PUT simpan template surat
router.put('/template/:id', wajibKeuangan, async (req, res) => {
    try {
        const data = req.body;
        // Identitas diambil dari token (req.user), BUKAN dari badan permintaan.
        // Nama pengguna yang dikirim klien tidak membuktikan apa pun.
        const username = req.user!.username;
        if (!data.ppk_nama || !data.ppk_nip || !data.satker_nama) {
            return res.status(400).json({ message: 'Nama PPK, NIP PPK, dan nama satuan kerja wajib diisi.' });
        }

        // Pola nomor divalidasi DI SERVER, bukan hanya di layar. Pola yang rusak
        // tidak menimbulkan galat saat disimpan — akibatnya baru muncul jauh
        // kemudian, tercetak di surat resmi yang sudah ditandatangani.
        for (const [label, pola] of [
            ['Surat PK', data.format_nomor],
            ['BAST', data.format_nomor_bast],
        ] as [string, string][]) {
            if (!pola) {
                return res.status(400).json({ message: `Pola nomor ${label} wajib diisi.` });
            }
            // Tanpa {nomor}, SEMUA mitra menerima nomor surat yang sama persis.
            // Pemeriksaan penanda salah tulis tidak menangkap ini, karena pola
            // seperti "097/SPK/FEBRUARI/II/2026" memang tidak punya penanda.
            if (polaTanpaNomor(pola)) {
                return res.status(400).json({
                    message: `Pola nomor ${label} harus memuat {nomor}. Tanpa itu semua surat akan bernomor sama.`,
                });
            }
            const salah = penandaTidakDikenal(pola);
            if (salah.length > 0) {
                return res.status(400).json({
                    message: `Penanda tidak dikenal pada pola nomor ${label}: ${salah.join(', ')}.`,
                });
            }
        }
        const template = await updateTemplate(parseInt(req.params.id), data, username);
        if (!template) {
            return res.status(404).json({ message: 'Template tidak ditemukan.' });
        }
        res.json(template);
    } catch (error: any) {
        console.error('Error updating template surat:', error);
        res.status(500).json({ message: error.message || 'Gagal menyimpan template surat.' });
    }
});

// GET daftar kegiatan x tahap dalam periode, beserta uraian tugas & kode MAK
router.get('/uraian', async (req, res) => {
    const periode = bacaPeriode(req.query);
    if ('error' in periode) return res.status(400).json({ message: periode.error });
    try {
        res.json(await getUraianTugas(periode.mulai, periode.selesai));
    } catch (error: any) {
        console.error('Error fetching uraian tugas:', error);
        res.status(500).json({ message: error.message || 'Gagal memuat uraian tugas.' });
    }
});

// PUT simpan uraian tugas & kode MAK secara massal
router.put('/uraian', wajibKeuangan, async (req, res) => {
    try {
        const { daftar } = req.body;
        if (!Array.isArray(daftar)) {
            return res.status(400).json({ message: 'Body harus memuat array "daftar".' });
        }
        const tersimpan = await simpanUraianTugas(daftar);
        res.json({ tersimpan });
    } catch (error: any) {
        console.error('Error saving uraian tugas:', error);
        res.status(500).json({ message: error.message || 'Gagal menyimpan uraian tugas.' });
    }
});

// GET data Surat PK per mitra untuk sebuah periode
router.get('/data', async (req, res) => {
    const periode = bacaPeriode(req.query);
    if ('error' in periode) return res.status(400).json({ message: periode.error });
    try {
        res.json(await getDataKontrak(periode.mulai, periode.selesai));
    } catch (error: any) {
        console.error('Error fetching data kontrak:', error);
        res.status(500).json({ message: error.message || 'Gagal memuat data kontrak.' });
    }
});

// POST pesan nomor urut surat (idempoten per mitra per periode)
router.post('/nomor', wajibKeuangan, async (req, res) => {
    try {
        const { periodeMulai, periodeSelesai, tanggalSurat, daftarMitra, nomorMulai } = req.body;
        // Identitas diambil dari token (req.user), BUKAN dari badan permintaan.
        // Nama pengguna yang dikirim klien tidak membuktikan apa pun.
        const username = req.user!.username;
        if (!FORMAT_TANGGAL.test(periodeMulai || '') || !FORMAT_TANGGAL.test(periodeSelesai || '')) {
            return res.status(400).json({ message: 'periodeMulai dan periodeSelesai harus berformat yyyy-MM-dd.' });
        }
        if (!FORMAT_TANGGAL.test(tanggalSurat || '')) {
            return res.status(400).json({ message: 'tanggalSurat harus berformat yyyy-MM-dd.' });
        }
        if (!Array.isArray(daftarMitra) || daftarMitra.length === 0) {
            return res.status(400).json({ message: 'daftarMitra tidak boleh kosong.' });
        }
        const hasil = await pesanNomorKontrak(periodeMulai, periodeSelesai, tanggalSurat, daftarMitra, username, nomorMulai);
        res.json(hasil);
    } catch (error: any) {
        console.error('Error reserving nomor kontrak:', error);
        res.status(500).json({ message: error.message || 'Gagal memesan nomor surat.' });
    }
});

/**
 * POST tetapkan nomor Surat BAST.
 *
 * Tidak memesan nomor baru: nomor BAST disusun dari nomor urut SPK mitra yang
 * sama. Mitra yang SPK-nya belum ada dikembalikan lewat `tanpaSpk`, bukan
 * membuat seluruh permintaan gagal — satu mitra tertinggal tidak boleh
 * menghalangi puluhan lainnya.
 */
router.post('/bast/nomor', wajibKeuangan, async (req, res) => {
    try {
        const { periodeMulai, periodeSelesai, tanggalBast, daftarPplMasterId } = req.body;
        // Identitas diambil dari token (req.user), BUKAN dari badan permintaan.
        // Nama pengguna yang dikirim klien tidak membuktikan apa pun.
        const username = req.user!.username;
        if (!FORMAT_TANGGAL.test(periodeMulai || '') || !FORMAT_TANGGAL.test(periodeSelesai || '')) {
            return res.status(400).json({ message: 'periodeMulai dan periodeSelesai harus berformat yyyy-MM-dd.' });
        }
        if (!FORMAT_TANGGAL.test(tanggalBast || '')) {
            return res.status(400).json({ message: 'tanggalBast harus berformat yyyy-MM-dd.' });
        }
        if (!Array.isArray(daftarPplMasterId) || daftarPplMasterId.length === 0) {
            return res.status(400).json({ message: 'daftarPplMasterId tidak boleh kosong.' });
        }
        const hasil = await pesanNomorBast(periodeMulai, periodeSelesai, tanggalBast, daftarPplMasterId, username);
        res.json(hasil);
    } catch (error: any) {
        console.error('Error reserving nomor BAST:', error);
        res.status(500).json({ message: error.message || 'Gagal menetapkan nomor BAST.' });
    }
});

/**
 * GET nomor urut tertinggi pada sebuah tahun surat.
 *
 * Layar memerlukan angka yang SAMA dengan yang dipakai server saat memesan
 * nomor. Sebelumnya layar menghitung sendiri dari periode yang sedang tampil,
 * sehingga peringatan "nomor sudah terpakai" bisa diam-diam gagal muncul untuk
 * nomor yang terbit di periode lain pada tahun yang sama.
 */
router.get('/nomor-terpakai', async (req, res) => {
    try {
        const tahun = Number(req.query.tahun);
        if (!Number.isInteger(tahun) || tahun < 2000 || tahun > 2999) {
            return res.status(400).json({ message: 'Parameter tahun tidak valid.' });
        }
        res.json({ tahun, maksTerpakai: await getMaksNomorUrut(tahun) });
    } catch (error: any) {
        console.error('Error fetching maks nomor urut:', error);
        res.status(500).json({ message: error.message || 'Gagal memuat nomor terpakai.' });
    }
});

// Tindakan destruktif dan tidak bisa dibatalkan; dibatasi seperti login.
const aturUlangLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Terlalu banyak permintaan atur ulang nomor. Coba lagi setelah 15 menit.' },
});

/**
 * POST atur ulang nomor surat satu periode.
 *
 * POST, bukan DELETE: apiClient.delete tidak mengirim body, padahal periode,
 * pelaku, dan frasa konfirmasi harus ikut. Menaruhnya di query string membuat
 * tindakan sedestruktif ini bisa terpanggil hanya dengan menempel URL.
 */
router.post('/nomor/atur-ulang', wajibKeuangan, aturUlangLimiter, async (req, res) => {
    try {
        const { periodeMulai, periodeSelesai, konfirmasi } = req.body;
        // Identitas diambil dari token (req.user), BUKAN dari badan permintaan.
        // Nama pengguna yang dikirim klien tidak membuktikan apa pun.
        const username = req.user!.username;

        if (!FORMAT_TANGGAL.test(periodeMulai || '') || !FORMAT_TANGGAL.test(periodeSelesai || '')) {
            return res.status(400).json({ message: 'periodeMulai dan periodeSelesai harus berformat yyyy-MM-dd.' });
        }
        // Frasa yang sama diketik pengguna di layar. Diperiksa ulang di sini
        // supaya permintaan yang tidak lewat layar ikut tertolak.
        if (!konfirmasiAturUlangSah(konfirmasi)) {
            return res.status(400).json({ message: 'Konfirmasi tidak sesuai. Ketik frasa konfirmasi dengan benar.' });
        }
        const hasil = await aturUlangNomorPeriode(periodeMulai, periodeSelesai, username);
        if (hasil.terhapus === 0) {
            return res.status(404).json({ message: 'Tidak ada nomor surat pada periode ini.' });
        }
        res.json(hasil);
    } catch (error: any) {
        console.error('Error atur ulang nomor:', error);
        res.status(500).json({ message: error.message || 'Gagal mengatur ulang nomor surat.' });
    }
});

// =====================================================================
// Riwayat Penyuratan
//
// Semuanya `wajibKeuangan`: yang boleh menyentuh nomor surat hanyalah tim
// keuangan (role supervisor) dan admin. Identitas pelaku selalu diambil dari
// token, tidak pernah dari badan permintaan.
// =====================================================================

/** Membaca dan memvalidasi parameter tahun. */
const bacaTahun = (nilai: unknown): number | null => {
    const tahun = Number(nilai);
    return Number.isInteger(tahun) && tahun >= 2000 && tahun <= 2999 ? tahun : null;
};

/** Membaca id surat dari path. */
const bacaIdSurat = (nilai: string): number | null => {
    const id = Number(nilai);
    return Number.isInteger(id) && id > 0 ? id : null;
};

// GET seluruh surat satu tahun, surat batal ikut, beserta nomor yang kosong.
router.get('/riwayat', wajibKeuangan, async (req, res) => {
    try {
        const tahun = bacaTahun(req.query.tahun);
        if (tahun === null) return res.status(400).json({ message: 'Parameter tahun tidak valid.' });
        res.json(await getRiwayatSurat(tahun));
    } catch (error: any) {
        console.error('Error fetching riwayat surat:', error);
        res.status(500).json({ message: error.message || 'Gagal memuat riwayat surat.' });
    }
});

/**
 * PUT ganti nomor urut sebuah surat.
 *
 * PUT, bukan PATCH, karena apiClient di klien hanya punya get/post/put/delete.
 */
router.put('/surat/:id/nomor', wajibKeuangan, async (req, res) => {
    try {
        const id = bacaIdSurat(req.params.id);
        const nomor = Number(req.body?.nomor);
        if (id === null) return res.status(400).json({ message: 'Id surat tidak valid.' });
        if (!Number.isInteger(nomor) || nomor < 1 || nomor > 9999) {
            return res.status(400).json({ message: 'Nomor surat harus bilangan bulat 1 sampai 9999.' });
        }
        const hasil = await ubahNomorSurat(id, nomor, req.user!.username);
        if (!hasil.ok && hasil.alasan === 'tidak-ada') {
            return res.status(404).json({ message: 'Surat tidak ditemukan.' });
        }
        if (!hasil.ok) {
            return res.status(409).json({ message: `Nomor ${nomor} sudah dipakai surat lain yang masih berlaku pada tahun ini.` });
        }
        res.json(hasil);
    } catch (error: any) {
        console.error('Error ubah nomor surat:', error);
        res.status(500).json({ message: error.message || 'Gagal mengubah nomor surat.' });
    }
});

// POST batalkan sebuah surat. Nomornya tetap tercatat di riwayat.
router.post('/surat/:id/batal', wajibKeuangan, async (req, res) => {
    try {
        const id = bacaIdSurat(req.params.id);
        if (id === null) return res.status(400).json({ message: 'Id surat tidak valid.' });
        const catatan = typeof req.body?.catatan === 'string' ? req.body.catatan.trim() : '';
        if (catatan.length === 0) {
            return res.status(400).json({ message: 'Catatan alasan pembatalan wajib diisi, supaya riwayatnya bisa dibaca orang lain.' });
        }
        const berhasil = await batalkanSurat(id, catatan, req.user!.username);
        if (!berhasil) {
            return res.status(404).json({ message: 'Surat tidak ditemukan atau memang sudah batal.' });
        }
        res.json({ ok: true });
    } catch (error: any) {
        console.error('Error batalkan surat:', error);
        res.status(500).json({ message: error.message || 'Gagal membatalkan surat.' });
    }
});

// PUT sunting catatan sebuah surat.
router.put('/surat/:id/catatan', wajibKeuangan, async (req, res) => {
    try {
        const id = bacaIdSurat(req.params.id);
        if (id === null) return res.status(400).json({ message: 'Id surat tidak valid.' });
        const catatan = typeof req.body?.catatan === 'string' ? req.body.catatan.trim() : '';
        const berhasil = await ubahCatatanSurat(id, catatan);
        if (!berhasil) return res.status(404).json({ message: 'Surat tidak ditemukan.' });
        res.json({ ok: true });
    } catch (error: any) {
        console.error('Error ubah catatan surat:', error);
        res.status(500).json({ message: error.message || 'Gagal menyimpan catatan.' });
    }
});

/**
 * DELETE hapus permanen sebuah surat yang SUDAH batal.
 *
 * Surat yang masih berlaku tidak bisa dihapus lewat sini: batalkan dulu. Dengan
 * begitu tidak ada nomor berlaku yang lenyap dalam satu langkah.
 */
router.delete('/surat/:id', wajibKeuangan, aturUlangLimiter, async (req, res) => {
    try {
        const id = bacaIdSurat(req.params.id);
        if (id === null) return res.status(400).json({ message: 'Id surat tidak valid.' });
        const berhasil = await hapusSuratBatal(id, req.user!.username);
        if (!berhasil) {
            return res.status(409).json({ message: 'Hanya surat yang sudah dibatalkan yang bisa dihapus. Batalkan suratnya lebih dulu.' });
        }
        res.status(204).send();
    } catch (error: any) {
        console.error('Error hapus surat batal:', error);
        res.status(500).json({ message: error.message || 'Gagal menghapus surat.' });
    }
});

/**
 * POST rapikan nomor surat satu tahun.
 *
 * `pratinjau: true` hanya mengembalikan rencananya tanpa mengubah apa pun,
 * supaya layar bisa memperlihatkan pergeserannya sebelum disetujui. Penerapan
 * sungguhan menuntut frasa konfirmasi yang sama dengan atur ulang nomor.
 */
router.post('/nomor/rapikan', wajibKeuangan, aturUlangLimiter, async (req, res) => {
    try {
        const tahun = bacaTahun(req.body?.tahun);
        if (tahun === null) return res.status(400).json({ message: 'Parameter tahun tidak valid.' });
        const pratinjau = req.body?.pratinjau === true;
        if (!pratinjau && !konfirmasiAturUlangSah(req.body?.konfirmasi)) {
            return res.status(400).json({ message: 'Konfirmasi tidak sesuai. Ketik frasa konfirmasi dengan benar.' });
        }
        res.json(await rapikanNomorTahun(tahun, pratinjau, req.user!.username));
    } catch (error: any) {
        console.error('Error rapikan nomor surat:', error);
        res.status(500).json({ message: error.message || 'Gagal merapikan nomor surat.' });
    }
});

/**
 * POST perbarui isi surat mengikuti data sekarang, nomornya tetap.
 *
 * Jawaban atas peringatan "isi surat berubah sejak digenerate". Tidak memakai
 * frasa konfirmasi: tindakan ini menyelaraskan surat dengan kenyataan, bukan
 * menghanguskan nomor, jadi cukup dikonfirmasi di layar.
 */
router.post('/surat/:id/perbarui', wajibKeuangan, async (req, res) => {
    try {
        const id = bacaIdSurat(req.params.id);
        if (id === null) return res.status(400).json({ message: 'Id surat tidak valid.' });
        const hasil = await perbaruiIsiSurat(id, req.user!.username);
        if (hasil === 'tidak-ada') return res.status(404).json({ message: 'Surat tidak ditemukan.' });
        if (hasil === 'tidak-aktif') {
            return res.status(409).json({ message: 'Surat yang sudah dibatalkan tidak bisa diperbarui.' });
        }
        if (hasil === 'tanpa-data') {
            return res.status(409).json({ message: 'Mitra ini sudah tidak punya honor pada periode surat tersebut. Batalkan suratnya, jangan diperbarui.' });
        }
        res.json({ ok: true });
    } catch (error: any) {
        console.error('Error perbarui isi surat:', error);
        res.status(500).json({ message: error.message || 'Gagal memperbarui isi surat.' });
    }
});

export default router;
