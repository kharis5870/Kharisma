// server/routes/kegiatan.ts
import { Router } from 'express';
import { getRiwayatKegiatan } from '../services/riwayatService';
// Jalur relatif, BUKAN @shared: alias itu tidak tersedia saat vite.config.ts
// memuat kode server lewat Node, dan ini nilai runtime (bukan tipe) sehingga
// tidak terhapus saat kompilasi. Lihat catatan yang sama di kontrakService.ts.
import { periksaTautan } from '../../shared/tautanDokumen';
import { pesanGalatSql, statusGalatSql } from '../../shared/pesanGalatSql';
import { wajibAdmin, wajibKeuangan } from '../auth/middleware';
import {
  wajibPemilikKegiatan, wajibPmlMitra, wajibBolehMenambahDokumen,
  wajibBolehMenyuntingDokumen, wajibBolehMengelolaDokumen,
  dariParamId, dariBodyDokumen,
} from '../auth/kepemilikan';
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
  ubahNamaDokumen,
  approveDocumentsByTipe,
  ubahPenanggungJawabDokumen,
  setArsipKegiatan,
    kirimPengingatDokumen,
    urungkanPembuatanKegiatan, BATAS_URUNGKAN_MENIT,
} from '../services/kegiatanService';

const router = Router();

/**
 * Memvalidasi dan menormalkan `documentData.link` bila memang dikirim.
 *
 * `link: undefined` PENTING dipertahankan apa adanya: `updateSingleDocument`
 * memakai `link ?? oldDoc.link`, jadi mengubah undefined menjadi string kosong
 * akan menghapus tautan yang sudah tersimpan pada permintaan yang sebetulnya
 * hanya mengganti nama dokumen.
 *
 * Mengembalikan pesan galat bila tautannya tidak sah, atau documentData yang
 * sudah dinormalkan bila sah.
 */
const periksaDokumen = (documentData: any):
  { galat: string } | { data: any } => {
    if (!documentData || documentData.link === undefined) return { data: documentData };
    const tautan = periksaTautan(documentData.link);
    if (!tautan.sah) return { galat: tautan.galat ?? 'Link dokumen tidak valid.' };
    return { data: { ...documentData, link: tautan.tautan } };
};

// GET all
router.get('/', async (_req, res) => {
  try {
    const kegiatan = await getAllKegiatan();
    res.json(kegiatan);
  } catch (error) {
    console.error('Error fetching kegiatan:', error);
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
    console.error('Error fetching kegiatan details:', error);
    res.status(500).json({ message: 'Error fetching kegiatan details' });
  }
});

// POST new
router.post('/', async (req, res) => {
  try {
    const { bypassHonorLimit, ...kegiatanData } = req.body;
    // Pembuatnya diambil dari token. Kalau dipercayakan ke badan permintaan,
    // siapa pun bisa membuat kegiatan atas nama orang lain — sekaligus
    // memberi orang itu hak menyuntingnya, karena pembuat adalah salah satu
    // pihak yang berhak.
    kegiatanData.createdBy_userId = req.user!.id;
    // Sama alasannya dengan PUT: nama pembuat dari token, bukan dari body.
    kegiatanData.username = req.user!.username;
    kegiatanData.lastEditedBy = req.user!.username;
    const newKegiatan = await createKegiatan(kegiatanData, bypassHonorLimit);
    res.status(201).json(newKegiatan);
  } catch (error: any) {
    // ✅ PERUBAHAN DI SINI
    // Jika ini adalah error batas honor yang sudah kita tangani...
    if (error.details?.code === 'HONOR_LIMIT_EXCEEDED') {
        // ...cukup catat sebagai info biasa, bukan error menakutkan.
        console.log(`INFO: Validasi batas honor terpicu untuk PPL ID ${error.details.ppl_master_id}. Respons 409 dikirim.`);
    } else {
        // Jika ini adalah error lain yang tidak terduga, baru catat sebagai error.
        console.error("CREATE KEGIATAN ERROR:", error);
    }

    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message, details: error.details });
    }
    res.status(500).json({ message: 'Error creating kegiatan' });
  }
});

// PUT update (untuk detail kegiatan)
/**
 * Feed riwayat satu kegiatan.
 *
 * Diambil HANYA saat dialog detail dibuka, bukan ikut di daftar Dashboard —
 * menggabungkannya ke GET /kegiatan akan mengubah respons 5 baris jadi ribuan.
 */
router.get('/:id/riwayat', async (req, res) => {
    try {
        const riwayat = await getRiwayatKegiatan(parseInt(req.params.id));
        res.json(riwayat);
    } catch (error: any) {
        console.error('Error fetching riwayat:', error);
        res.status(500).json({ message: 'Gagal mengambil riwayat kegiatan' });
    }
});

// Hanya ketua tim kegiatan ini, pembuatnya, atau admin.
router.put('/:id', wajibPemilikKegiatan(dariParamId), async (req, res) => {
    try {
        const { bypassHonorLimit, ...kegiatanData } = req.body;
        // Identitas penyunting diambil dari token, BUKAN dari body. Nilai ini
        // masuk ke kolom `lastEditedBy`, ke riwayat 'kegiatan_disunting', dan
        // menjadi pengunggah dokumen yang baru diisi — kalau diambil dari body,
        // siapa pun yang berhak menyunting bisa mencatat perubahannya atas
        // nama orang lain.
        kegiatanData.lastEditedBy = req.user!.username;
        kegiatanData.lastUpdatedBy = req.user!.username;
        const updatedKegiatan = await updateKegiatan(parseInt(req.params.id), kegiatanData, bypassHonorLimit);
        res.json(updatedKegiatan);
    } catch (error: any) {
        // Detail teknis tetap masuk log server — itu yang dibutuhkan saat
        // menelusuri bug.
        console.error("UPDATE KEGIATAN ERROR:", error.sqlMessage || error.message, error.code || '');
        if (error.statusCode) {
            return res.status(error.statusCode).json({ message: error.message, details: error.details });
        }
        // Yang dikirim ke layar TIDAK lagi `error.sqlMessage`: pesan itu
        // membocorkan nama basis data, tabel, dan constraint ke siapa pun yang
        // bisa memicunya, sekaligus tidak memberi tahu apa yang harus
        // diperbaiki. Kode yang sebetulnya kesalahan masukan dibalas 400.
        res.status(statusGalatSql(error.code)).json({
            message: pesanGalatSql(error.code, error.message || 'Gagal menyimpan kegiatan.'),
            code: error.code,
        });
    }
});

// PUT update (untuk progress PPL)
// Hanya PML yang mengawasi mitra ini, ditambah admin.
router.put('/ppl/:pplId/progress', wajibPmlMitra, async (req, res) => {
    try {
        const { pplId } = req.params;
        const { progressData } = req.body;
        // Identitas diambil dari token (req.user), BUKAN dari badan permintaan.
        // Nama pengguna yang dikirim klien tidak membuktikan apa pun.
        const username = req.user!.username;

        if (!progressData) {
            return res.status(400).json({ message: 'Request body tidak lengkap. Harap sertakan progressData.' });
        }

       // Teruskan username sebagai argumen ketiga
       const updatedPpl = await updatePplProgress(parseInt(pplId), progressData, username);
        res.json(updatedPpl);
    } catch (error) {
        console.error("Error updating PPL progress:", error);
        // Pesan dari service diteruskan apa adanya dengan status 400. Sebelumnya
        // ditelan jadi 500 dengan teks generik, sehingga penjelasan sebenarnya
        // (mis. "Total progres melebihi beban kerja") tidak pernah sampai ke
        // pengguna dan mereka hanya melihat "Gagal memperbarui progress PPL".
        const pesan = error instanceof Error ? error.message : 'Gagal memperbarui progress PPL';
        res.status(400).json({ message: pesan });
    }
});

// RUTE UNTUK UPDATE STATUS DOKUMEN
// Menyetujui & menolak dokumen adalah wewenang pemeriksa (supervisor/admin).
router.put('/dokumen/:dokumenId/status', wajibKeuangan, async (req, res) => {
    try {
        const { dokumenId } = req.params;
        const { status, rejectionNote } = req.body;
        // Identitas diambil dari token (req.user), BUKAN dari badan permintaan.
        // Nama pengguna yang dikirim klien tidak membuktikan apa pun.
        const username = req.user!.username;

        if (!status || !['Pending', 'Reviewed', 'Approved', 'Rejected'].includes(status)) {
            return res.status(400).json({ message: 'Status tidak valid' });
        }
        // Alasan wajib: notifikasi penolakan ke ketua tim tidak ada gunanya
        // kalau tidak menyebutkan apa yang harus diperbaiki.
        if (status === 'Rejected' && !String(rejectionNote ?? '').trim()) {
            return res.status(400).json({ message: 'Alasan penolakan wajib diisi.' });
        }

        const updatedDokumen = await updateDocumentStatus(parseInt(dokumenId), status, username, rejectionNote);
        res.json(updatedDokumen);
    } catch (error) {
        console.error("Error updating document status:", error);
        res.status(500).json({ message: 'Gagal memperbarui status dokumen' });
    }
});

// RUTE BARU UNTUK APPROVE SEMUA DOKUMEN PER TAHAPAN
// Menyetujui satu tahap sekaligus — wewenang yang sama.
router.put('/:kegiatanId/tahapan/approve', wajibKeuangan, async (req, res) => {
    try {
        const { kegiatanId } = req.params;
        const { tipe } = req.body;
        // Identitas diambil dari token (req.user), BUKAN dari badan permintaan.
        // Nama pengguna yang dikirim klien tidak membuktikan apa pun.
        const username = req.user!.username;

        if (!tipe || !['persiapan', 'pengumpulan-data', 'pengolahan-analisis', 'diseminasi-evaluasi'].includes(tipe)) {
            return res.status(400).json({ message: 'Tipe tahapan tidak valid' });
        }

        await approveDocumentsByTipe(parseInt(kegiatanId), tipe, username);
        res.status(200).json({ message: `Semua dokumen untuk tahap ${tipe} telah disetujui.` });
    } catch (error) {
        console.error("Error approving documents by stage:", error);
        res.status(500).json({ message: 'Gagal menyetujui dokumen tahapan' });
    }
});

router.post('/dokumen', wajibBolehMenambahDokumen(dariBodyDokumen), async (req, res) => {
    try {
        // Ambil username dan data dokumen dari body
        const { documentData } = req.body;
        // Identitas diambil dari token (req.user), BUKAN dari badan permintaan.
        // Nama pengguna yang dikirim klien tidak membuktikan apa pun.
        const username = req.user!.username;
        // Divalidasi di route, bukan di service: blok catch di bawah membalas
        // 500 untuk error apa pun, padahal link salah jelas kesalahan masukan.
        const diperiksa = periksaDokumen(documentData);
        if ('galat' in diperiksa) {
            return res.status(400).json({ message: diperiksa.galat });
        }
        const newDocument = await createSingleDocument(diperiksa.data, username);
        res.status(201).json(newDocument);
    } catch (error: any) {
        console.error("Error creating single document:", error);
        res.status(500).json({ message: error.message || 'Gagal membuat dokumen baru.' });
    }
});

router.put('/dokumen/:id', wajibBolehMenyuntingDokumen, async (req, res) => {
    try {
        const { id } = req.params;
        // Ambil username dan data dokumen dari body
        const { documentData } = req.body;
        // Identitas diambil dari token (req.user), BUKAN dari badan permintaan.
        // Nama pengguna yang dikirim klien tidak membuktikan apa pun.
        const username = req.user!.username;
        const diperiksa = periksaDokumen(documentData);
        if ('galat' in diperiksa) {
            return res.status(400).json({ message: diperiksa.galat });
        }
        const updatedDocument = await updateSingleDocument(Number(id), diperiksa.data, username);
        res.json(updatedDocument);
    } catch (error: any) {
        console.error("Error updating single document:", error);
        res.status(500).json({ message: error.message || 'Gagal memperbarui dokumen.' });
    }
});

/**
 * Mengalihkan tanggung jawab pengisian dokumen: Ketua Tim <-> Tim Keuangan.
 *
 * Endpoint TERPISAH dari `PUT /dokumen/:id`, bukan menumpang `documentData`.
 * Alasannya konkret: `updateSingleDocument` selalu memaksa status kembali
 * 'Pending', sehingga mengalihkan tanggung jawab dokumen yang sudah disetujui
 * akan membatalkan persetujuannya. Memisahkannya juga mencegah jalur simpan
 * Edit Kegiatan membalik penanda ini tanpa sengaja.
 */
/**
 * Mengganti nama dokumen. Tidak menyentuh status maupun link — mengganti nama
 * bukan pengunggahan ulang.
 */
router.put('/dokumen/:id/nama', wajibBolehMengelolaDokumen, async (req, res) => {
    try {
        const nama = String(req.body?.nama ?? '').trim();
        if (!nama) {
            return res.status(400).json({ message: 'Nama dokumen wajib diisi.' });
        }
        res.json(await ubahNamaDokumen(Number(req.params.id), nama, req.user!.username));
    } catch (error: any) {
        console.error('Error renaming document:', error);
        res.status(500).json({ message: error.message || 'Gagal mengganti nama dokumen.' });
    }
});

/**
 * Tim keuangan mengingatkan ketua tim & pembuat kegiatan bahwa sebuah dokumen
 * belum ada link-nya.
 *
 * `wajibKeuangan`, bukan `wajibBolehMengelolaDokumen`: ini bukan penyuntingan
 * dokumen melainkan pengiriman peringatan ke orang lain, dan kewenangan itu
 * ada pada pemeriksa (supervisor/admin) — bukan pada pemilik kegiatannya.
 *
 * Status galat datang dari service (`statusCode`), sehingga "sudah pernah
 * dikirim" terbaca sebagai 409 dan "link sudah diisi" sebagai 400 — dua hal
 * yang perlu dibedakan layar, bukan sama-sama 500.
 */
router.post('/dokumen/:id/pengingat', wajibKeuangan, async (req, res) => {
    try {
        res.json(await kirimPengingatDokumen(Number(req.params.id), req.user!.username));
    } catch (error: any) {
        console.error('Error sending document reminder:', error);
        res.status(error.statusCode ?? 500).json({
            message: error.message || 'Gagal mengirim pengingat.',
        });
    }
});

router.put('/dokumen/:id/penanggung-jawab', wajibKeuangan, async (req, res) => {
    try {
        const { penanggungJawab } = req.body;
        // Identitas diambil dari token (req.user), BUKAN dari badan permintaan.
        // Nama pengguna yang dikirim klien tidak membuktikan apa pun.
        const username = req.user!.username;
        // Daftar nilai ditulis inline, mengikuti pola daftar status dan daftar
        // tipe tahapan di berkas ini — nilai runtime dari @shared tidak bisa
        // diimpor kode server.
        if (!['ketua_tim', 'keuangan'].includes(penanggungJawab)) {
            return res.status(400).json({ message: "penanggungJawab harus 'ketua_tim' atau 'keuangan'." });
        }
        const dokumen = await ubahPenanggungJawabDokumen(Number(req.params.id), penanggungJawab, username);
        res.json(dokumen);
    } catch (error: any) {
        console.error('Error updating penanggung jawab dokumen:', error);
        res.status(500).json({ message: error.message || 'Gagal mengubah penanggung jawab dokumen.' });
    }
});

// Arsipkan / batalkan arsip sebuah kegiatan.
// Arsip adalah alternatif non-destruktif untuk DELETE: kegiatan yang sudah
// selesai disembunyikan dari daftar utama dashboard tapi datanya tetap utuh.
router.put('/:id/arsip', wajibAdmin, async (req, res) => {
    try {
        const { isArsip } = req.body;
        // Identitas diambil dari token (req.user), BUKAN dari badan permintaan.
        // Nama pengguna yang dikirim klien tidak membuktikan apa pun.
        const username = req.user!.username;
        const updated = await setArsipKegiatan(parseInt(req.params.id), Boolean(isArsip), username);
        if (!updated) {
            return res.status(404).json({ message: 'Kegiatan tidak ditemukan.' });
        }
        res.json(updated);
    } catch (error: any) {
        console.error("Error updating arsip status:", error);
        res.status(500).json({ message: error.message || 'Gagal memperbarui status arsip.' });
    }
});

// DELETE kegiatan
/**
 * Mengurungkan pembuatan kegiatan yang baru saja dibuat. Aturan siapa dan
 * kapan ada di `urungkanPembuatanKegiatan`; di sini hanya pemetaan statusnya.
 */
router.delete('/:id/urungkan', async (req, res) => {
    try {
        const hasil = await urungkanPembuatanKegiatan(Number(req.params.id), req.user!.id, req.user!.role);
        if (hasil === 'tidak-ada') return res.status(404).json({ message: 'Kegiatan tidak ditemukan.' });
        if (hasil === 'bukan-pembuat') return res.status(403).json({ message: 'Hanya pembuat kegiatan yang boleh membatalkan penyimpanannya.' });
        if (hasil === 'kedaluwarsa') {
            return res.status(409).json({ message: `Batas waktu membatalkan (${BATAS_URUNGKAN_MENIT} menit) sudah lewat. Hubungi admin untuk menghapus kegiatan ini.` });
        }
        res.status(204).send();
    } catch (error) {
        console.error('Error urungkan kegiatan:', error);
        res.status(500).json({ message: 'Gagal membatalkan penyimpanan kegiatan.' });
    }
});

router.delete('/:id', wajibAdmin, async (req, res) => {
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

router.delete('/dokumen/:id', wajibBolehMengelolaDokumen, async (req, res) => {
    try {
        // Dokumen wajib hanya boleh dihapus tim keuangan/admin; lihat catatan
        // pada deleteSingleDocument.
        const peran = req.user!.role;
        const success = await deleteSingleDocument(
            parseInt(req.params.id), peran === 'admin' || peran === 'supervisor');
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