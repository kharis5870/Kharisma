// Dipisah dari server/services/kegiatanService.ts tanpa mengubah isinya.

import { RowDataPacket } from 'mysql2';
import db from '../db';
import { catatRiwayat } from './riwayatService';
import { PPL, ProgressType } from '@shared/api';
// Jalur relatif, BUKAN '@shared/...': alias itu tidak tersedia saat
// vite.config.ts memuat kode server lewat Node, dan ini nilai runtime.
import { progresBolehDiperbarui, PESAN_PROGRES_BELUM_DIBUKA } from '../../shared/hakKegiatan';
import { PPLPacket, ProgressPacket, calculateProgress } from './kegiatanBantu';

// =================================================================
// START OF MODIFICATION: updatePplProgress function
// =================================================================
export const updatePplProgress = async (pplId: number, progressData: Partial<Record<ProgressType, number>>, username: string) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // Kunci diambil dengan URUTAN yang sama seperti simpan Edit Kegiatan:
        // kegiatan -> ppl -> ppl_progress. Dengan urutan yang sama, simpan progres
        // dan simpan kegiatan yang berjalan bersamaan saling MENUNGGU, bukan saling
        // mengunci (deadlock); dan beban kerja yang dibaca di sini tidak bisa
        // berubah di tengah jalan.
        const [pemilik] = await connection.query<RowDataPacket[]>('SELECT kegiatanId FROM ppl WHERE id = ?', [pplId]);
        if (pemilik[0]) {
            // Tanggalnya ikut dibaca di sini, bukan lewat kueri tersendiri:
            // baris kegiatan memang sedang dikunci, dan menambah kueri kedua
            // berarti meminjam koneksi lain di tengah transaksi.
            //
            // CURDATE() dipakai sebagai "hari ini" supaya acuannya sama dengan
            // notifikasi dan peringatan dasbor: sesi database sudah +07:00,
            // sedangkan jam mesin server cPanel umumnya UTC.
            const [kegRows] = await connection.query<RowDataPacket[]>(`
                SELECT DATE_FORMAT(tanggalMulaiPengumpulanData, '%Y-%m-%d') AS mulaiPendataan,
                       DATE_FORMAT(CURDATE(), '%Y-%m-%d')                   AS hariIni
                  FROM kegiatan WHERE id = ? FOR UPDATE`, [pemilik[0].kegiatanId]);

            const keg = kegRows[0];
            if (keg && !progresBolehDiperbarui(keg.mulaiPendataan, keg.hariIni)) {
                throw Object.assign(new Error(PESAN_PROGRES_BELUM_DIBUKA), {
                    statusCode: 409,
                    details: { code: 'PROGRES_BELUM_DIBUKA', mulaiPendataan: keg.mulaiPendataan },
                });
            }
        }
        const [pplRows] = await connection.query<RowDataPacket[]>('SELECT kegiatanId, bebanKerja, tahap FROM ppl WHERE id = ? FOR UPDATE', [pplId]);
        if (pplRows.length === 0) {
            throw Object.assign(new Error('Alokasi mitra tidak ditemukan. Muat ulang halaman.'), { statusCode: 404 });
        }
        const currentPpl = pplRows[0];
        const totalBebanKerja = parseInt(currentPpl.bebanKerja, 10) || 0;

        // Perbarui logika penentuan stages
        const stages = (currentPpl.tahap === 'listing' || currentPpl.tahap === 'pencacahan')
            ? ['open', 'submit', 'diperiksa', 'approved']
            : ['belum_entry', 'sudah_entry', 'validasi', 'clean'];
        
        const firstStage = stages[0];
        const editableStages = stages.slice(1);

        // Setiap angka yang dikirim harus bilangan bulat tidak negatif. Layar
        // Dashboard sudah mencegahnya, tetapi permintaan langsung ke API tidak
        // melewati layar — tanpa pemeriksaan ini nilai -5 atau 2.5 tersimpan dan
        // merusak persentase progres kegiatan.
        for (const stage of editableStages) {
            const nilai = progressData[stage as ProgressType];
            if (nilai !== undefined && (!Number.isInteger(Number(nilai)) || Number(nilai) < 0)) {
                throw Object.assign(
                    new Error(`Nilai progres "${stage}" harus bilangan bulat 0 atau lebih.`),
                    { statusCode: 400 });
            }
        }

        let editableProgressSum = 0;
        for (const stage of editableStages) {
            if (progressData[stage as ProgressType] !== undefined) {
                editableProgressSum += Number(progressData[stage as ProgressType]);
            }
        }
        
        const firstStageValue = totalBebanKerja - editableProgressSum;
        
        if (firstStageValue < 0) {
            throw Object.assign(
                new Error(`Total progres (${editableProgressSum}) tidak bisa melebihi total beban kerja (${totalBebanKerja}).`),
                { statusCode: 400 });
        }

        const fullProgressData = { ...progressData };
        (fullProgressData as any)[firstStage] = firstStageValue;

        await connection.execute('DELETE FROM ppl_progress WHERE ppl_id = ?', [pplId]);
        const progressEntries = Object.entries(fullProgressData).filter(([, value]) => value !== undefined && value !== null);
        if (progressEntries.length > 0) {
            const progressQuery = 'INSERT INTO ppl_progress (ppl_id, progress_type, value) VALUES ?';
            const progressValues = progressEntries.map(([type, value]) => [pplId, type, Number(value) || 0]);
            await connection.query(progressQuery, [progressValues]);
        }

        const kegiatanId = currentPpl.kegiatanId;

        // Satu-satunya jejak "siapa mengubah progress kapan": tabel
        // ppl_progress sama sekali tidak punya kolom waktu maupun pelaku.
        await catatRiwayat(connection, {
            kegiatanId,
            aksi: 'progress_diupdate',
            entitas: 'progress',
            entitasId: pplId,
            jumlah: editableProgressSum,
            aktorNama: username,
            ringkasan: currentPpl.tahap,
        });

        const [allPplForKegiatan] = await connection.query<PPLPacket[]>('SELECT * FROM ppl WHERE kegiatanId = ?', [kegiatanId]);
        if (allPplForKegiatan.length > 0) {
            const pplIds = allPplForKegiatan.map(p => p.id).filter(id => id !== undefined) as number[];
            if (pplIds.length > 0) {
                 const pplPlaceholders = pplIds.map(() => '?').join(',');
                 // connection, BUKAN pool: (1) pool hanya 10 koneksi dan transaksi ini sudah
                 // memegang satu — beberapa simpan progres serentak saling menunggu koneksi
                 // kedua sampai server macet total (terbukti: 29 dari 30 macet); (2) koneksi
                 // lain tidak melihat progres yang baru diubah di transaksi ini, sehingga
                 // persentase kegiatan tertinggal satu langkah.
                 const [progressRows] = await connection.query<ProgressPacket[]>('SELECT * FROM ppl_progress WHERE ppl_id IN (' + pplPlaceholders + ')', pplIds);

                 const progressMap = new Map<number, Partial<Record<ProgressType, number>>>();
                 progressRows.forEach(row => {
                      if (!progressMap.has(row.ppl_id)) {
                           progressMap.set(row.ppl_id, {});
                      }
                      progressMap.get(row.ppl_id)![row.progress_type] = row.value;
                 });
                 allPplForKegiatan.forEach(p => {
                      p.progress = progressMap.get(p.id!) || {};
                 });
            }
        }
        
        const progressListingApproved = calculateProgress(allPplForKegiatan, 'listing', 'Approved');
    const progressListingSubmit = calculateProgress(allPplForKegiatan, 'listing', 'Submitted');
    const progressPencacahanApproved = calculateProgress(allPplForKegiatan, 'pencacahan', 'Approved');
    const progressPencacahanSubmit = calculateProgress(allPplForKegiatan, 'pencacahan', 'Submitted');
    const progressPengolahanApproved = calculateProgress(allPplForKegiatan, 'pengolahan-analisis', 'Approved');
    const progressPengolahanSubmit = calculateProgress(allPplForKegiatan, 'pengolahan-analisis', 'Submitted');
    
    // Tetap hitung progress gabungan
    const progressPendataanApproved = calculateProgress(allPplForKegiatan, 'pendataan', 'Approved');
    const progressPendataanSubmit = calculateProgress(allPplForKegiatan, 'pendataan', 'Submitted');
    
    const totalBebanKerjaKegiatan = allPplForKegiatan.reduce((acc, p) => acc + (parseInt(p.bebanKerja, 10) || 0), 0);
    const totalApproved = allPplForKegiatan.reduce((acc, p) => {
        const approvedValue = (p.progress?.approved || 0) + (p.progress?.clean || 0);
        return acc + approvedValue;
    }, 0);
    const progressKeseluruhan = totalBebanKerjaKegiatan > 0 ? Math.round((totalApproved / totalBebanKerjaKegiatan) * 100) : 0;
    
    // Perbarui query UPDATE untuk menyertakan semua kolom baru
    await connection.execute(
        `UPDATE kegiatan SET 
            lastUpdated = CURRENT_TIMESTAMP, lastUpdatedBy = ?, progressKeseluruhan = ?, 
            progressPendataanApproved = ?, progressPengolahanApproved = ?, 
            progressPendataanSubmit = ?, progressPengolahanSubmit = ?,
            progressListingApproved = ?, progressListingSubmit = ?,
            progressPencacahanApproved = ?, progressPencacahanSubmit = ?
         WHERE id = ?`,
        [
            username, progressKeseluruhan, 
            progressPendataanApproved, progressPengolahanApproved, 
            progressPendataanSubmit, progressPengolahanSubmit,
            progressListingApproved, progressListingSubmit,
            progressPencacahanApproved, progressPencacahanSubmit,
            kegiatanId
        ]
    );
        
        await connection.commit();
        
        // Masih memegang koneksi transaksi; memakainya lagi alih-alih meminjam
        // koneksi kedua dari pool (lihat catatan di atas).
        const [updatedPplRows] = await connection.query<RowDataPacket[]>('SELECT * FROM ppl WHERE id = ?', [pplId]);
        const updatedPpl = updatedPplRows[0] as PPL;
        const [newProgressRows] = await connection.query<ProgressPacket[]>('SELECT * FROM ppl_progress WHERE ppl_id = ?', [pplId]);
        updatedPpl.progress = {};
        newProgressRows.forEach(row => {
            updatedPpl.progress![row.progress_type] = row.value;
        });

        return updatedPpl;

    } catch (error: any) {
        await connection.rollback();
        // Galat yang sengaja dilempar di atas (statusCode) membawa penjelasan
        // untuk pengguna, jadi diteruskan apa adanya. Dulu SEMUA galat diganti
        // pesan umum, sehingga "Total progres melebihi beban kerja" tidak pernah
        // sampai ke layar. Galat tak terduga tetap dicatat lengkap dan dibalas
        // pesan umum, supaya detail database tidak bocor.
        if (error?.statusCode) throw error;
        console.error("❌ TRANSACTION ROLLED BACK");
        console.error("Code:", error.code);
        console.error("Message:", error.sqlMessage || error.message);
        console.error("Query:", error.sql);
        console.error("Stack:", error.stack);
        throw new Error('Terjadi kesalahan di server saat menyimpan data.');
    } finally {
        connection.release();
    }
};
