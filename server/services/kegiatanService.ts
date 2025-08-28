// server/services/kegiatanService.ts

import { RowDataPacket, OkPacket } from 'mysql2';
import db from '../db';
import { Kegiatan, Dokumen, PPL } from '@shared/api';

interface KegiatanPacket extends Kegiatan, RowDataPacket {}

const calculateProgress = (ppl: PPL[], tahap: PPL['tahap'], type: 'Approved' | 'Submit'): number => {
    const pplTahap = ppl.filter(p => p.tahap === tahap);
    if (pplTahap.length === 0) return 0;

    const totalBebanKerja = pplTahap.reduce((acc, p) => acc + (parseInt(p.bebanKerja) || 0), 0);
    if (totalBebanKerja === 0) return 0;

    const totalProgress = pplTahap.reduce((acc, p) => {
        const approved = p.progressApproved || 0;
        if (type === 'Approved') {
            return acc + approved;
        }
        // Untuk 'Submit', kita hitung 'submit', 'diperiksa', dan 'approved'
        return acc + (p.progressSubmit || 0) + (p.progressDiperiksa || 0) + approved;
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

    for (const kegiatan of kegiatanRows) {
        const [dokumenRows] = await db.query<RowDataPacket[]>('SELECT * FROM dokumen WHERE kegiatanId = ?', [kegiatan.id]);
        const [pplRows] = await db.query<RowDataPacket[]>(`
            SELECT p.*, pm.namaPPL
            FROM ppl p
            JOIN ppl_master pm ON p.ppl_master_id = pm.id
            WHERE p.kegiatanId = ?
        `, [kegiatan.id]);

        kegiatan.dokumen = dokumenRows as Dokumen[];
        kegiatan.ppl = pplRows as PPL[];
        // Menghitung progress dan menambahkannya ke objek kegiatan
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
            namaKegiatan, ketua_tim_id, deskripsiKegiatan, adaListing,
            tanggalMulaiPersiapan, tanggalSelesaiPersiapan,
            tanggalMulaiPengumpulanData, tanggalSelesaiPengumpulanData,
            tanggalMulaiPengolahanAnalisis, tanggalSelesaiPengolahanAnalisis,
            tanggalMulaiDiseminasiEvaluasi, tanggalSelesaiDiseminasiEvaluasi,
            pplAllocations, documents, username
        } = data;

        const kegiatanQuery = `
            INSERT INTO kegiatan
            (namaKegiatan, ketua_tim_id, deskripsiKegiatan, adaListing,
             tanggalMulaiPersiapan, tanggalSelesaiPersiapan,
             tanggalMulaiPengumpulanData, tanggalSelesaiPengumpulanData,
             tanggalMulaiPengolahanAnalisis, tanggalSelesaiPengolahanAnalisis,
             tanggalMulaiDiseminasiEvaluasi, tanggalSelesaiDiseminasiEvaluasi,
             status, progressKeseluruhan, lastUpdatedBy, lastEditedBy, 
             progressPendataanApproved, progressPengolahanApproved, 
             progressPendataanSubmit, progressPengolahanSubmit)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Persiapan', 0, ?, ?, 0, 0, 0, 0)
        `;
        const [kegiatanResult] = await connection.execute<OkPacket>(kegiatanQuery, [
            namaKegiatan, ketua_tim_id, deskripsiKegiatan, adaListing || false,
            tanggalMulaiPersiapan || null, tanggalSelesaiPersiapan || null,
            tanggalMulaiPengumpulanData || null, tanggalSelesaiPengumpulanData || null,
            tanggalMulaiPengolahanAnalisis || null, tanggalSelesaiPengolahanAnalisis || null,
            tanggalMulaiDiseminasiEvaluasi || null, tanggalSelesaiDiseminasiEvaluasi || null,
            username, username
        ]);
        const kegiatanId = kegiatanResult.insertId;

        if (pplAllocations && pplAllocations.length > 0) {
            const pplQuery = 'INSERT INTO ppl (kegiatanId, ppl_master_id, namaPML, bebanKerja, satuanBebanKerja, hargaSatuan, besaranHonor, tahap, progressOpen) VALUES ?';
            const pplValues = pplAllocations.map((ppl: PPL) => {
                const bebanKerja = parseInt(ppl.bebanKerja) || 0;
                return [
                    kegiatanId,
                    ppl.ppl_master_id,
                    ppl.namaPML,
                    bebanKerja,
                    ppl.satuanBebanKerja,
                    parseInt(ppl.hargaSatuan) || 0,
                    parseInt(ppl.besaranHonor) || 0,
                    ppl.tahap,
                    bebanKerja,
                ];
            });
            await connection.query(pplQuery, [pplValues]);

            const persiapanPpls = pplAllocations.filter((p: PPL) => p.tahap === 'persiapan');
            if (persiapanPpls.length > 0) {
                const pengumpulanDataPpls = persiapanPpls.map((ppl: PPL) => [
                    kegiatanId,
                    ppl.ppl_master_id,
                    '', 
                    0, 
                    '', 
                    0, 
                    0, 
                    'pengumpulan-data',
                    0, 
                ]);
                await connection.query(pplQuery, [pengumpulanDataPpls]);
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
            namaKegiatan, ketua_tim_id, deskripsiKegiatan, adaListing,
            tanggalMulaiPersiapan, tanggalSelesaiPersiapan,
            tanggalMulaiPengumpulanData, tanggalSelesaiPengumpulanData,
            tanggalMulaiPengolahanAnalisis, tanggalSelesaiPengolahanAnalisis,
            tanggalMulaiDiseminasiEvaluasi, tanggalSelesaiDiseminasiEvaluasi,
            ppl, dokumen, username
        } = data;

        const kegiatanQuery = `
            UPDATE kegiatan SET
            namaKegiatan = ?, ketua_tim_id = ?, deskripsiKegiatan = ?, adaListing = ?,
            tanggalMulaiPersiapan = ?, tanggalSelesaiPersiapan = ?,
            tanggalMulaiPengumpulanData = ?, tanggalSelesaiPengumpulanData = ?,
            tanggalMulaiPengolahanAnalisis = ?, tanggalSelesaiPengolahanAnalisis = ?,
            tanggalMulaiDiseminasiEvaluasi = ?, tanggalSelesaiDiseminasiEvaluasi = ?,
            lastEdited = CURRENT_TIMESTAMP,
            lastEditedBy = ?
            WHERE id = ?
        `;
        await connection.execute(kegiatanQuery, [
            namaKegiatan, ketua_tim_id, deskripsiKegiatan, adaListing || false,
            tanggalMulaiPersiapan || null, tanggalSelesaiPersiapan || null,
            tanggalMulaiPengumpulanData || null, tanggalSelesaiPengumpulanData || null,
            tanggalMulaiPengolahanAnalisis || null, tanggalSelesaiPengolahanAnalisis || null,
            tanggalMulaiDiseminasiEvaluasi || null, tanggalSelesaiDiseminasiEvaluasi || null,
            username,
            id
        ]);
        
        const [existingPpls] = await connection.query<RowDataPacket[]>('SELECT * FROM ppl WHERE kegiatanId = ?', [id]);
        const existingPplsMap = new Map(existingPpls.map(p => [p.id, p]));

        await connection.execute('DELETE FROM ppl WHERE kegiatanId = ?', [id]);
        await connection.execute('DELETE FROM dokumen WHERE kegiatanId = ?', [id]);

        if (ppl && ppl.length > 0) {
            const pplQuery = 'INSERT INTO ppl (kegiatanId, ppl_master_id, namaPML, bebanKerja, satuanBebanKerja, hargaSatuan, besaranHonor, tahap, progressOpen, progressSubmit, progressDiperiksa, progressApproved) VALUES ?';
            const pplValues = ppl.map((p: PPL & {clientId?: string}) => {
                const existingPpl = existingPplsMap.get(p.id);
                const oldBebanKerja = existingPpl ? parseInt(existingPpl.bebanKerja) || 0 : 0;
                const newBebanKerja = parseInt(p.bebanKerja) || 0;
                const bebanKerjaDiff = newBebanKerja - oldBebanKerja;
                
                let progressOpen = p.progressOpen ?? 0;
                if(existingPpl) {
                    progressOpen = (parseInt(existingPpl.progressOpen) || 0) + bebanKerjaDiff;
                } else {
                    progressOpen = newBebanKerja;
                }

                 return [
                    id, p.ppl_master_id, p.namaPML,
                    newBebanKerja,
                    p.satuanBebanKerja,
                    parseInt(p.hargaSatuan) || 0,
                    parseInt(p.besaranHonor) || 0,
                    p.tahap,
                    progressOpen < 0 ? 0 : progressOpen,
                    p.progressSubmit ?? 0,
                    p.progressDiperiksa ?? 0,
                    p.progressApproved ?? 0
                ];
            });
            await connection.query(pplQuery, [pplValues]);
        }

        if (dokumen && dokumen.length > 0) {
            const docQuery = 'INSERT INTO dokumen (kegiatanId, nama, link, jenis, tipe, uploadedAt, isWajib, status) VALUES ?';
            const docValues = dokumen.map((doc: any) => [
                id, doc.nama, doc.link, doc.jenis, doc.tipe, doc.uploadedAt ? new Date(doc.uploadedAt) : new Date(), doc.isWajib || false, doc.status || 'Pending'
            ]);
            await connection.query(docQuery, [docValues]);
        }

        const [allPplForKegiatan] = await connection.query<RowDataPacket[]>('SELECT tahap, bebanKerja, progressApproved, progressSubmit, progressDiperiksa FROM ppl WHERE kegiatanId = ?', [id]);
        
        const progressPendataanApproved = calculateProgress(allPplForKegiatan as PPL[], 'pengumpulan-data', 'Approved');
        const progressPengolahanApproved = calculateProgress(allPplForKegiatan as PPL[], 'pengolahan-analisis', 'Approved');
        const progressPendataanSubmit = calculateProgress(allPplForKegiatan as PPL[], 'pengumpulan-data', 'Submit');
        const progressPengolahanSubmit = calculateProgress(allPplForKegiatan as PPL[], 'pengolahan-analisis', 'Submit');
        
        const totalBebanKerja = allPplForKegiatan.reduce((acc, p) => acc + (parseInt(p.bebanKerja) || 0), 0);
        const totalApproved = allPplForKegiatan.reduce((acc, p) => acc + (p.progressApproved || 0), 0);
        const progressKeseluruhan = totalBebanKerja > 0 ? Math.round((totalApproved / totalBebanKerja) * 100) : 0;

        await connection.execute(
            'UPDATE kegiatan SET progressKeseluruhan = ?, progressPendataanApproved = ?, progressPengolahanApproved = ?, progressPendataanSubmit = ?, progressPengolahanSubmit = ? WHERE id = ?',
            [progressKeseluruhan, progressPendataanApproved, progressPengolahanApproved, progressPendataanSubmit, progressPengolahanSubmit, id]
        );

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

export const updatePplProgress = async (pplId: number, progressData: { open: number; submit: number; diperiksa: number; approved: number; username: string; }) => {
    const { open, submit, diperiksa, approved, username } = progressData;

    const [pplRows] = await db.query<RowDataPacket[]>('SELECT * FROM ppl WHERE id = ?', [pplId]);
    if (pplRows.length === 0) {
        throw new Error("PPL not found");
    }
    const currentPpl = pplRows[0];
    const totalBebanKerja = parseInt(currentPpl.bebanKerja, 10) || 0;
    const totalProgress = open + submit + diperiksa + approved;

    if (totalProgress > totalBebanKerja) {
        throw new Error("Total progress tidak bisa melebihi total beban kerja");
    }

    const query = `
        UPDATE ppl
        SET progressOpen = ?, progressSubmit = ?, progressDiperiksa = ?, progressApproved = ?
        WHERE id = ?
    `;
    await db.execute(query, [open, submit, diperiksa, approved, pplId]);

    const kegiatanId = currentPpl.kegiatanId;

    const [allPplForKegiatan] = await db.query<RowDataPacket[]>('SELECT tahap, bebanKerja, progressApproved, progressSubmit, progressDiperiksa FROM ppl WHERE kegiatanId = ?', [kegiatanId]);
    
    const progressPendataanApproved = calculateProgress(allPplForKegiatan as PPL[], 'pengumpulan-data', 'Approved');
    const progressPengolahanApproved = calculateProgress(allPplForKegiatan as PPL[], 'pengolahan-analisis', 'Approved');
    const progressPendataanSubmit = calculateProgress(allPplForKegiatan as PPL[], 'pengumpulan-data', 'Submit');
    const progressPengolahanSubmit = calculateProgress(allPplForKegiatan as PPL[], 'pengolahan-analisis', 'Submit');

    const totalBebanKerjaKegiatan = allPplForKegiatan.reduce((acc, p) => acc + (parseInt(p.bebanKerja, 10) || 0), 0);
    const totalApproved = allPplForKegiatan.reduce((acc, p) => acc + (p.progressApproved || 0), 0);
    const progressKeseluruhan = totalBebanKerjaKegiatan > 0 ? Math.round((totalApproved / totalBebanKerjaKegiatan) * 100) : 0;

    await db.execute(
        'UPDATE kegiatan SET lastUpdated = CURRENT_TIMESTAMP, progressKeseluruhan = ?, progressPendataanApproved = ?, progressPengolahanApproved = ?, progressPendataanSubmit = ?, progressPengolahanSubmit = ?, lastUpdatedBy = ? WHERE id = ?',
        [progressKeseluruhan, progressPendataanApproved, progressPengolahanApproved, progressPendataanSubmit, progressPengolahanSubmit, username, kegiatanId]
    );

    const [updatedPpl] = await db.query<RowDataPacket[]>('SELECT * FROM ppl WHERE id = ?', [pplId]);
    return updatedPpl[0];
};

export const deleteKegiatan = async (id: number): Promise<boolean> => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        await connection.execute('DELETE FROM ppl WHERE kegiatanId = ?', [id]);
        await connection.execute('DELETE FROM dokumen WHERE kegiatanId = ?', [id]);

        const [result] = await connection.execute<OkPacket>('DELETE FROM kegiatan WHERE id = ?', [id]);

        await connection.commit();
        return result.affectedRows > 0;
    } catch (error) {
        await connection.rollback();
        console.error("Error deleting kegiatan:", error);
        throw error;
    } finally {
        connection.release();
    }
};

export const updateDocumentStatus = async (dokumenId: number, status: Dokumen['status']): Promise<Dokumen> => {
    const query = 'UPDATE dokumen SET status = ? WHERE id = ?';
    await db.execute(query, [status, dokumenId]);
    const [rows] = await db.query<RowDataPacket[]>('SELECT * FROM dokumen WHERE id = ?', [dokumenId]);
    if (rows.length === 0) {
        throw new Error("Dokumen tidak ditemukan setelah update");
    }
    return rows[0] as Dokumen;
};

export const approveDocumentsByTipe = async (kegiatanId: number, tipe: Dokumen['tipe']): Promise<OkPacket> => {
    const query = 'UPDATE dokumen SET status = ? WHERE kegiatanId = ? AND tipe = ?';
    const [result] = await db.execute<OkPacket>(query, ['Approved', kegiatanId, tipe]);
    return result;
};