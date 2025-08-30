// server/services/kegiatanService.ts

import { RowDataPacket, OkPacket } from 'mysql2';
import db from '../db';
import { Kegiatan, Dokumen, PPL, ProgressType, HonorariumDetail } from '@shared/api';

interface KegiatanPacket extends Kegiatan, RowDataPacket {}
interface PPLPacket extends PPL, RowDataPacket {}
interface ProgressPacket extends RowDataPacket {
    ppl_id: number;
    progress_type: ProgressType;
    value: number;
}
interface HonorariumPacket extends RowDataPacket {
    ppl_id: number;
    jenis_pekerjaan: 'listing' | 'pencacahan' | 'pengolahan';
    bebanKerja: number;
    satuanBebanKerja: string;
    hargaSatuan: number;
    besaranHonor: number;
}


const calculateProgress = (ppl: PPL[], tahap: PPL['tahap'], type: 'Approved' | 'Submit'): number => {
    const pplTahap = ppl.filter(p => p.tahap === tahap);
    if (pplTahap.length === 0) return 0;

    const totalBebanKerja = pplTahap.reduce((acc, p) => acc + (parseInt(p.bebanKerja) || 0), 0);
    if (totalBebanKerja === 0) return 0;

    const totalProgress = pplTahap.reduce((acc, p) => {
        const progress = p.progress || {};
        if (tahap === 'pengumpulan-data') {
            const approved = progress.approved || 0;
            if (type === 'Approved') {
                return acc + approved;
            }
            return acc + (progress.submit || 0) + (progress.diperiksa || 0) + approved;
        }
        if (tahap === 'pengolahan-analisis') {
            const clean = progress.clean || 0;
            if (type === 'Approved') {
                return acc + clean;
            }
             return acc + (progress.sudah_entry || 0) + (progress.validasi || 0) + clean;
        }
        return acc;
    }, 0);
    
    return Math.round((totalProgress / totalBebanKerja) * 100);
};

const getKegiatanWithRelations = async (whereClause: string, params: any[]): Promise<Kegiatan[]> => {
    const query = `
        SELECT
            k.*,
            kt.nama_ketua AS namaKetua
        FROM kegiatan k
        LEFT JOIN ketua_tim kt ON k.ketua_tim_id = kt.id
        ${whereClause}
    `;
    const [kegiatanRows] = await db.query<KegiatanPacket[]>(query, params);

    if (kegiatanRows.length === 0) return [];

    const kegiatanIds = kegiatanRows.map(k => k.id);
    const placeholders = kegiatanIds.map(() => '?').join(',');

    const [dokumenRows] = await db.query<RowDataPacket[]>('SELECT * FROM dokumen WHERE kegiatanId IN (' + placeholders + ')', kegiatanIds);
    const [pplRows] = await db.query<PPLPacket[]>('SELECT p.*, pm.namaPPL FROM ppl p JOIN ppl_master pm ON p.ppl_master_id = pm.id WHERE p.kegiatanId IN (' + placeholders + ')', kegiatanIds);
    
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
        kegiatan.ppl = pplRows.filter(p => p.kegiatanId === kegiatan.id) as PPL[];
        
        kegiatan.progressPendataanApproved = calculateProgress(kegiatan.ppl, 'pengumpulan-data', 'Approved');
        kegiatan.progressPengolahanApproved = calculateProgress(kegiatan.ppl, 'pengolahan-analisis', 'Approved');
        kegiatan.progressPendataanSubmit = calculateProgress(kegiatan.ppl, 'pengumpulan-data', 'Submit');
        kegiatan.progressPengolahanSubmit = calculateProgress(kegiatan.ppl, 'pengolahan-analisis', 'Submit');
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

export const createKegiatan = async (data: any): Promise<Kegiatan> => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const {
            namaKegiatan, ketua_tim_id, deskripsiKegiatan, adaListing, isFasih, bulanPembayaranHonor,
            tanggalMulaiPersiapan, tanggalSelesaiPersiapan,
            tanggalMulaiPengumpulanData, tanggalSelesaiPengumpulanData,
            tanggalMulaiPengolahanAnalisis, tanggalSelesaiPengolahanAnalisis,
            tanggalMulaiDiseminasiEvaluasi, tanggalSelesaiDiseminasiEvaluasi,
            pplAllocations, documents, username
        } = data;

        const kegiatanQuery = `
            INSERT INTO kegiatan
            (namaKegiatan, ketua_tim_id, deskripsiKegiatan, adaListing, isFasih, bulanPembayaranHonor,
             tanggalMulaiPersiapan, tanggalSelesaiPersiapan,
             tanggalMulaiPengumpulanData, tanggalSelesaiPengumpulanData,
             tanggalMulaiPengolahanAnalisis, tanggalSelesaiPengolahanAnalisis,
             tanggalMulaiDiseminasiEvaluasi, tanggalSelesaiDiseminasiEvaluasi,
             status, progressKeseluruhan, lastUpdatedBy, lastEditedBy, 
             progressPendataanApproved, progressPengolahanApproved, 
             progressPendataanSubmit, progressPengolahanSubmit)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Persiapan', 0, ?, ?, 0, 0, 0, 0)
        `;
        const [kegiatanResult] = await connection.execute<OkPacket>(kegiatanQuery, [
            namaKegiatan, ketua_tim_id, deskripsiKegiatan, adaListing || false, isFasih || false, bulanPembayaranHonor || null,
            tanggalMulaiPersiapan || null, tanggalSelesaiPersiapan || null,
            tanggalMulaiPengumpulanData || null, tanggalSelesaiPengumpulanData || null,
            tanggalMulaiPengolahanAnalisis || null, tanggalSelesaiPengolahanAnalisis || null,
            tanggalMulaiDiseminasiEvaluasi || null, tanggalSelesaiDiseminasiEvaluasi || null,
            username, username
        ]);
        const kegiatanId = kegiatanResult.insertId;

        if (pplAllocations && pplAllocations.length > 0) {
            for (const ppl of pplAllocations) {
                const totalHonor = ppl.honorarium?.reduce((sum: number, h: HonorariumDetail) => sum + (parseInt(h.besaranHonor || '0')), 0) || 0;
                const totalBeban = ppl.honorarium?.reduce((sum: number, h: HonorariumDetail) => sum + (parseInt(h.bebanKerja || '0')), 0) || 0;

                const pplQuery = 'INSERT INTO ppl (kegiatanId, ppl_master_id, namaPML, bebanKerja, besaranHonor, tahap) VALUES (?, ?, ?, ?, ?, ?)';
                const [pplResult] = await connection.execute<OkPacket>(pplQuery, [
                   kegiatanId, ppl.ppl_master_id, ppl.namaPML, totalBeban, totalHonor, ppl.tahap
                ]);
                const pplId = pplResult.insertId;

                if (ppl.honorarium && ppl.honorarium.length > 0) {
                    const honorQuery = 'INSERT INTO ppl_honorarium (ppl_id, jenis_pekerjaan, bebanKerja, satuanBebanKerja, hargaSatuan, besaranHonor) VALUES ?';
                    const honorValues = ppl.honorarium.map((h: HonorariumDetail) => [
                        pplId, h.jenis_pekerjaan, parseInt(h.bebanKerja || '0'), h.satuanBebanKerja, parseInt(h.hargaSatuan || '0'), parseInt(h.besaranHonor || '0')
                    ]);
                    await connection.query(honorQuery, [honorValues]);
                }

                const progressType = ppl.tahap === 'pengumpulan-data' ? 'open' : 'belum_entry';
                if (totalBeban > 0) {
                   const progressQuery = 'INSERT INTO ppl_progress (ppl_id, progress_type, value) VALUES (?, ?, ?)';
                   await connection.execute(progressQuery, [pplId, progressType, totalBeban]);
                }
            }
        }
        
        if (documents && documents.length > 0) {
            const docQuery = 'INSERT INTO dokumen (kegiatanId, nama, link, jenis, tipe, uploadedAt, isWajib) VALUES ?';
            const docValues = documents.map((doc: Dokumen) => [
                kegiatanId, doc.nama, doc.link, doc.jenis, doc.tipe, new Date(), doc.isWajib || false
            ]);
            await connection.query(docQuery, [docValues]);
        }

        await connection.commit();
        const newKegiatan = await getKegiatanById(kegiatanId);
        if (!newKegiatan) throw new Error("Gagal mengambil kegiatan yang baru dibuat");
        return newKegiatan;

    } catch (error) {
        await connection.rollback();
        console.error("TRANSACTION ROLLED BACK:", error);
        throw new Error('Terjadi kesalahan di server saat menyimpan data.');
    } finally {
        connection.release();
    }
}

export const updateKegiatan = async (id: number, data: any): Promise<Kegiatan> => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const {
            namaKegiatan, ketua_tim_id, deskripsiKegiatan, adaListing, isFasih, bulanPembayaranHonor,
            tanggalMulaiPersiapan, tanggalSelesaiPersiapan,
            tanggalMulaiPengumpulanData, tanggalSelesaiPengumpulanData,
            tanggalMulaiPengolahanAnalisis, tanggalSelesaiPengolahanAnalisis,
            tanggalMulaiDiseminasiEvaluasi, tanggalSelesaiDiseminasiEvaluasi,
            ppl, dokumen, username
        } = data;

        const kegiatanQuery = `
            UPDATE kegiatan SET
            namaKegiatan = ?, ketua_tim_id = ?, deskripsiKegiatan = ?, adaListing = ?, isFasih = ?, bulanPembayaranHonor = ?,
            tanggalMulaiPersiapan = ?, tanggalSelesaiPersiapan = ?,
            tanggalMulaiPengumpulanData = ?, tanggalSelesaiPengumpulanData = ?,
            tanggalMulaiPengolahanAnalisis = ?, tanggalSelesaiPengolahanAnalisis = ?,
            tanggalMulaiDiseminasiEvaluasi = ?, tanggalSelesaiDiseminasiEvaluasi = ?,
            lastEdited = CURRENT_TIMESTAMP,
            lastEditedBy = ?
            WHERE id = ?
        `;
        await connection.execute(kegiatanQuery, [
            namaKegiatan, ketua_tim_id, deskripsiKegiatan, adaListing || false, isFasih || false, bulanPembayaranHonor || null,
            tanggalMulaiPersiapan || null, tanggalSelesaiPersiapan || null,
            tanggalMulaiPengumpulanData || null, tanggalSelesaiPengumpulanData || null,
            tanggalMulaiPengolahanAnalisis || null, tanggalSelesaiPengolahanAnalisis || null,
            tanggalMulaiDiseminasiEvaluasi || null, tanggalSelesaiDiseminasiEvaluasi || null,
            username,
            id
        ]);
        
        await connection.execute('DELETE FROM ppl WHERE kegiatanId = ?', [id]); // This will cascade delete progress and honorarium
        await connection.execute('DELETE FROM dokumen WHERE kegiatanId = ?', [id]);

        if (ppl && ppl.length > 0) {
            for (const p of ppl) {
                const totalHonor = p.honorarium?.reduce((sum: number, h: HonorariumDetail) => sum + (parseInt(h.besaranHonor || '0')), 0) || 0;
                const totalBeban = p.honorarium?.reduce((sum: number, h: HonorariumDetail) => sum + (parseInt(h.bebanKerja || '0')), 0) || 0;

                const pplQuery = 'INSERT INTO ppl (kegiatanId, ppl_master_id, namaPML, bebanKerja, besaranHonor, tahap) VALUES (?, ?, ?, ?, ?, ?)';
                const [pplResult] = await connection.execute<OkPacket>(pplQuery, [
                   id, p.ppl_master_id, p.namaPML, totalBeban, totalHonor, p.tahap
                ]);
                const pplId = pplResult.insertId;

                if (p.honorarium && p.honorarium.length > 0) {
                    const honorQuery = 'INSERT INTO ppl_honorarium (ppl_id, jenis_pekerjaan, bebanKerja, satuanBebanKerja, hargaSatuan, besaranHonor) VALUES ?';
                    const honorValues = p.honorarium.map((h: HonorariumDetail) => [
                        pplId, h.jenis_pekerjaan, parseInt(h.bebanKerja || '0'), h.satuanBebanKerja, parseInt(h.hargaSatuan || '0'), parseInt(h.besaranHonor || '0')
                    ]);
                    await connection.query(honorQuery, [honorValues]);
                }

                if (p.progress) {
                    const progressEntries = Object.entries(p.progress);
                    if (progressEntries.length > 0) {
                        const progressQuery = 'INSERT INTO ppl_progress (ppl_id, progress_type, value) VALUES ?';
                        const progressValues = progressEntries.map(([type, value]) => [pplId, type, value]);
                        await connection.query(progressQuery, [progressValues]);
                    }
                }
            }
        }

        if (dokumen && dokumen.length > 0) {
            const docQuery = 'INSERT INTO dokumen (kegiatanId, nama, link, jenis, tipe, uploadedAt, isWajib, status, lastApproved, lastApprovedBy) VALUES ?';
            const docValues = dokumen.map((doc: any) => [
                id, doc.nama, doc.link, doc.jenis, doc.tipe, doc.uploadedAt ? new Date(doc.uploadedAt) : new Date(), doc.isWajib || false, doc.status || 'Pending', doc.lastApproved ? new Date(doc.lastApproved) : null, doc.lastApprovedBy
            ]);
            await connection.query(docQuery, [docValues]);
        }
        
        await connection.commit();

        const updatedKegiatan = await getKegiatanById(id);
        if (!updatedKegiatan) throw new Error("Gagal mengambil kegiatan setelah update");
        return updatedKegiatan;

    } catch (error) {
        await connection.rollback();
        console.error("TRANSACTION ROLLED BACK:", error);
        throw new Error('Terjadi kesalahan di server saat memperbarui data.');
    } finally {
        connection.release();
    }
}

export const updatePplProgress = async (pplId: number, progressData: Partial<Record<ProgressType, number>>, username: string) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const [pplRows] = await connection.query<RowDataPacket[]>('SELECT * FROM ppl WHERE id = ?', [pplId]);
        if (pplRows.length === 0) throw new Error("PPL not found");
        const currentPpl = pplRows[0];
        const totalBebanKerja = parseInt(currentPpl.bebanKerja, 10) || 0;

        const totalProgress = Object.values(progressData).reduce((sum, val) => sum + (val || 0), 0);
        if (totalProgress > totalBebanKerja) {
            throw new Error("Total progress tidak bisa melebihi total beban kerja");
        }

        await connection.execute('DELETE FROM ppl_progress WHERE ppl_id = ?', [pplId]);
        const progressEntries = Object.entries(progressData);
        if (progressEntries.length > 0) {
            const progressQuery = 'INSERT INTO ppl_progress (ppl_id, progress_type, value) VALUES ?';
            const progressValues = progressEntries.map(([type, value]) => [pplId, type, value]);
            await connection.query(progressQuery, [progressValues]);
        }

        const kegiatanId = currentPpl.kegiatanId;
        // Recalculate main activity progress
        const [allPplForKegiatan] = await connection.query<PPLPacket[]>('SELECT * FROM ppl WHERE kegiatanId = ?', [kegiatanId]);
        if (allPplForKegiatan.length > 0) {
            const pplIds = allPplForKegiatan.map(p => p.id).filter(id => id !== undefined) as number[];
            const pplPlaceholders = pplIds.map(() => '?').join(',');
            const [progressRows] = await db.query<ProgressPacket[]>('SELECT * FROM ppl_progress WHERE ppl_id IN (' + pplPlaceholders + ')', pplIds);

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

        const progressPendataanApproved = calculateProgress(allPplForKegiatan, 'pengumpulan-data', 'Approved');
        const progressPengolahanApproved = calculateProgress(allPplForKegiatan, 'pengolahan-analisis', 'Approved');
        const progressPendataanSubmit = calculateProgress(allPplForKegiatan, 'pengumpulan-data', 'Submit');
        const progressPengolahanSubmit = calculateProgress(allPplForKegiatan, 'pengolahan-analisis', 'Submit');

        const totalBebanKerjaKegiatan = allPplForKegiatan.reduce((acc, p) => acc + (parseInt(p.bebanKerja, 10) || 0), 0);
        const totalApproved = allPplForKegiatan.reduce((acc, p) => {
            const approved = p.progress?.approved || p.progress?.clean || 0;
            return acc + approved;
        }, 0);
        const progressKeseluruhan = totalBebanKerjaKegiatan > 0 ? Math.round((totalApproved / totalBebanKerjaKegiatan) * 100) : 0;

        await connection.execute(
            'UPDATE kegiatan SET lastUpdated = CURRENT_TIMESTAMP, progressKeseluruhan = ?, progressPendataanApproved = ?, progressPengolahanApproved = ?, progressPendataanSubmit = ?, progressPengolahanSubmit = ?, lastUpdatedBy = ? WHERE id = ?',
            [progressKeseluruhan, progressPendataanApproved, progressPengolahanApproved, progressPendataanSubmit, progressPengolahanSubmit, username, kegiatanId]
        );

        await connection.commit();

        const [updatedPplRows] = await db.query<RowDataPacket[]>('SELECT * FROM ppl WHERE id = ?', [pplId]);
        const updatedPpl = updatedPplRows[0] as PPL;
        const [newProgressRows] = await db.query<ProgressPacket[]>('SELECT * FROM ppl_progress WHERE ppl_id = ?', [pplId]);
        updatedPpl.progress = {};
        newProgressRows.forEach(row => {
            updatedPpl.progress![row.progress_type] = row.value;
        });
        return updatedPpl;

    } catch (error) {
        await connection.rollback();
        console.error("TRANSACTION ROLLED BACK:", error);
        throw error;
    } finally {
        connection.release();
    }
};

export const deleteKegiatan = async (id: number): Promise<boolean> => {
    const [result] = await db.execute<OkPacket>('DELETE FROM kegiatan WHERE id = ?', [id]);
    return result.affectedRows > 0;
};

export const updateDocumentStatus = async (dokumenId: number, status: Dokumen['status'], username: string): Promise<Dokumen> => {
    if (status === 'Approved') {
        const query = 'UPDATE dokumen SET status = ?, lastApproved = CURRENT_TIMESTAMP, lastApprovedBy = ? WHERE id = ?';
        await db.execute(query, [status, username, dokumenId]);
    } else {
        const query = 'UPDATE dokumen SET status = ? WHERE id = ?';
        await db.execute(query, [status, dokumenId]);
    }

    const [rows] = await db.query<RowDataPacket[]>('SELECT * FROM dokumen WHERE id = ?', [dokumenId]);
    if (rows.length === 0) {
        throw new Error("Dokumen tidak ditemukan setelah update");
    }
    return rows[0] as Dokumen;
};

export const approveDocumentsByTipe = async (kegiatanId: number, tipe: Dokumen['tipe'], username: string): Promise<OkPacket> => {
    const query = 'UPDATE dokumen SET status = ?, lastApproved = CURRENT_TIMESTAMP, lastApprovedBy = ? WHERE kegiatanId = ? AND tipe = ? AND status != ?';
    const [result] = await db.execute<OkPacket>(query, ['Approved', username, kegiatanId, tipe, 'Approved']);
    return result;
};