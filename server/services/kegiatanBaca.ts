// Dipisah dari server/services/kegiatanService.ts tanpa mengubah isinya.

import { RowDataPacket } from 'mysql2';
import db from '../db';
import { Kegiatan, Dokumen, PPL, ProgressType, HonorariumDetail } from '@shared/api';
import { KegiatanPacket, PPLPacket, ProgressPacket, HonorariumPacket, calculateProgress, HonorariumSettingPacket } from './kegiatanBantu';

export const getKegiatanWithRelations = async (whereClause: string, params: any[]): Promise<Kegiatan[]> => {
    const query = `
        SELECT
            k.*,
            -- Nama ketua tim dibaca dari akunnya, bukan dari baris kepengurusan:
            -- sejak migrasi 2026-09-28-ketua-tim-ikut-akun, nama hanya tersimpan
            -- di satu tempat sehingga koreksi ejaan berlaku untuk semua tahun.
            ktu.nama_lengkap AS namaKetua,
            kt.tim AS timKetua,
            -- Akun users yang memegang ketua tim ini. Dipakai untuk menentukan
            -- hak edit. JANGAN membandingkan user.id ke k.ketua_tim_id: kedua
            -- tabel memakai ruang ID yang berbeda (USR### vs KT###) sehingga
            -- perbandingannya tidak pernah benar.
            kt.user_id AS ketuaTimUserId,
            -- Pool mysql2 mengembalikan kolom DATE sebagai objek Date JS, yang
            -- bisa bergeser sehari saat diserialisasi dari zona WIB. Kolom honor
            -- dipakai untuk "Jangka Waktu" di Surat PK, jadi harus persis.
            DATE_FORMAT(k.tanggalMulaiHonorListing, '%Y-%m-%d') AS tanggalMulaiHonorListing,
            DATE_FORMAT(k.tanggalSelesaiHonorListing, '%Y-%m-%d') AS tanggalSelesaiHonorListing,
            DATE_FORMAT(k.tanggalMulaiHonorPencacahan, '%Y-%m-%d') AS tanggalMulaiHonorPencacahan,
            DATE_FORMAT(k.tanggalSelesaiHonorPencacahan, '%Y-%m-%d') AS tanggalSelesaiHonorPencacahan,
            DATE_FORMAT(k.tanggalMulaiHonorPengolahan, '%Y-%m-%d') AS tanggalMulaiHonorPengolahan,
            DATE_FORMAT(k.tanggalSelesaiHonorPengolahan, '%Y-%m-%d') AS tanggalSelesaiHonorPengolahan
        FROM kegiatan k
        LEFT JOIN ketua_tim kt ON k.ketua_tim_id = kt.id
        -- Tetap LEFT JOIN walau kepengurusan wajib berakun: kegiatan yang ketua
        -- timnya sudah dihapus punya kt NULL, dan barisnya harus tetap terbaca.
        LEFT JOIN users ktu ON ktu.id = kt.user_id
        ${whereClause}
    `;
    const [kegiatanRows] = await db.query<KegiatanPacket[]>(query, params);
    if (kegiatanRows.length === 0) return [];
    const kegiatanIds = kegiatanRows.map(k => k.id);
    const placeholders = kegiatanIds.map(() => '?').join(',');

   const [honorSettingsRows] = await db.query<HonorariumSettingPacket[]>('SELECT * FROM honorarium_kegiatan WHERE kegiatanId IN (' + placeholders + ')', kegiatanIds);
   const honorSettingsMap = new Map<number, any>();
   honorSettingsRows.forEach(row => {
     if (!honorSettingsMap.has(row.kegiatanId)) {
         honorSettingsMap.set(row.kegiatanId, {});
     }
     const currentSettings = honorSettingsMap.get(row.kegiatanId);
     let key: string;
     if (row.jenis_pekerjaan === 'listing') key = 'pengumpulan-data-listing';
     else if (row.jenis_pekerjaan === 'pencacahan') key = 'pengumpulan-data-pencacahan';
     else key = 'pengolahan-analisis';

     currentSettings[key] = {
         satuanBebanKerja: row.satuan_beban_kerja,
         hargaSatuan: row.harga_satuan
     };
   });

    const [dokumenRows] = await db.query<RowDataPacket[]>('SELECT * FROM dokumen WHERE kegiatanId IN (' + placeholders + ')', kegiatanIds);
    const [pplRows] = await db.query<PPLPacket[]>(
        'SELECT p.*, pm.namaPPL, u.nama_lengkap AS namaPML FROM ppl p LEFT JOIN ppl_master pm ON p.ppl_master_id = pm.id LEFT JOIN users u ON p.pml_id = u.id WHERE p.kegiatanId IN (' + placeholders + ')', kegiatanIds);
    
    if (pplRows.length > 0) {
        const pplIds = pplRows.map(p => p.id).filter(id => id !== undefined) as number[];
        if (pplIds.length > 0) {
            const pplPlaceholders = pplIds.map(() => '?').join(',');
            const [progressRows] = await db.query<ProgressPacket[]>('SELECT * FROM ppl_progress WHERE ppl_id IN (' + pplPlaceholders + ')', pplIds);
            const [honorRows] = await db.query<HonorariumPacket[]>('SELECT * FROM ppl_honorarium WHERE ppl_id IN (' + pplPlaceholders + ')', pplIds);

            const progressMap = new Map<number, Partial<Record<ProgressType, number>>>();
            progressRows.forEach(row => {
                if (!progressMap.has(row.ppl_id)) {
                    progressMap.set(row.ppl_id, {});
                }
                progressMap.get(row.ppl_id)![row.progress_type] = row.value;
            });

            const honorMap = new Map<number, HonorariumDetail[]>();
            honorRows.forEach(row => {
                if (!honorMap.has(row.ppl_id)) {
                    honorMap.set(row.ppl_id, []);
                }
                honorMap.get(row.ppl_id)!.push({
                    jenis_pekerjaan: row.jenis_pekerjaan,
                    bebanKerja: String(row.bebanKerja),
                    satuanBebanKerja: row.satuanBebanKerja,
                    hargaSatuan: String(row.hargaSatuan),
                    besaranHonor: String(row.besaranHonor)
                });
            });

            pplRows.forEach(ppl => {
                ppl.progress = progressMap.get(ppl.id!) || {};
                ppl.honorarium = honorMap.get(ppl.id!) || [];
            });
        }
    }

    for (const kegiatan of kegiatanRows) {
        kegiatan.dokumen = dokumenRows.filter(d => d.kegiatanId === kegiatan.id) as Dokumen[];
        kegiatan.honorariumSettings = honorSettingsMap.get(kegiatan.id) || {};
        kegiatan.ppl = pplRows.filter(p => p.kegiatanId === kegiatan.id) as PPL[];
        
        // =================================================================
        // START OF MODIFICATION: Progress calculation call
        // =================================================================
        kegiatan.progressListingApproved = calculateProgress(kegiatan.ppl, 'listing', 'Approved');
        kegiatan.progressListingSubmit = calculateProgress(kegiatan.ppl, 'listing', 'Submitted');
        kegiatan.progressPencacahanApproved = calculateProgress(kegiatan.ppl, 'pencacahan', 'Approved');
        kegiatan.progressPencacahanSubmit = calculateProgress(kegiatan.ppl, 'pencacahan', 'Submitted');
        kegiatan.progressPengolahanApproved = calculateProgress(kegiatan.ppl, 'pengolahan-analisis', 'Approved');
        kegiatan.progressPengolahanSubmit = calculateProgress(kegiatan.ppl, 'pengolahan-analisis', 'Submitted');
        // =================================================================
        // END OF MODIFICATION: Progress calculation call
        // =================================================================

        // Kalkulasi untuk progress keseluruhan
        const totalBeban = kegiatan.ppl.reduce((acc, p) => acc + (parseInt(p.bebanKerja, 10) || 0), 0);
        const totalApprovedClean = kegiatan.ppl.reduce((acc, p) => acc + (p.progress?.approved || 0) + (p.progress?.clean || 0), 0);
        kegiatan.progressKeseluruhan = totalBeban > 0 ? Math.round((totalApprovedClean / totalBeban) * 100) : 0;
        
        // Tetap sediakan properti lama untuk kompatibilitas jika masih ada yang memakai
        kegiatan.progressPendataanApproved = calculateProgress(kegiatan.ppl, 'pendataan', 'Approved');
        kegiatan.progressPendataanSubmit = calculateProgress(kegiatan.ppl, 'pendataan', 'Submitted');
    }
    return kegiatanRows;
};

export const getAllKegiatan = async (): Promise<Kegiatan[]> => {
    return getKegiatanWithRelations('ORDER BY k.lastUpdated DESC', []);
};

export const getKegiatanById = async (id: number): Promise<Kegiatan | null> => {
    const kegiatan = await getKegiatanWithRelations('WHERE k.id = ?', [id]);
    return kegiatan.length > 0 ? kegiatan[0] : null;
};
