// server/services/kegiatanService.ts

import { RowDataPacket, OkPacket } from 'mysql2';
import db from '../db';
import { Kegiatan, Dokumen, PPL, ProgressType, HonorariumDetail } from '@shared/api';

// --- TYPE DEFINITIONS ---
interface HonorariumSettings {
    satuanBebanKerja: string;
    hargaSatuan: string;
}

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
// --- END OF TYPE DEFINITIONS ---


const calculateProgress = (ppl: PPL[], tahap: PPL['tahap'], type: 'Approved' | 'Submitted'): number => {
    const pplTahap = ppl.filter(p => p.tahap === tahap);
    if (pplTahap.length === 0) return 0;

    const totalBebanKerja = pplTahap.reduce((acc, p) => acc + (parseInt(p.bebanKerja) || 0), 0);
    if (totalBebanKerja === 0) return 0;

    const totalProgress = pplTahap.reduce((acc, p) => {
        const progress = p.progress || {};
        if (tahap === 'pengumpulan-data') {
            if (type === 'Approved') {
                return acc + (progress.approved || 0);
            }
            if (type === 'Submitted') {
                return acc + (progress.submit || 0) + (progress.diperiksa || 0);
            }
        }
        if (tahap === 'pengolahan-analisis') {
            const clean = progress.clean || 0;
            if (type === 'Approved') {
                return acc + clean;
            }
             return acc + (progress.sudah_entry || 0) + (progress.validasi || 0);
        }
        return acc;
    }, 0);
    
    return Math.round((totalProgress / totalBebanKerja) * 100);
};

interface HonorariumSettingPacket extends RowDataPacket {
    kegiatanId: number;
    jenis_pekerjaan: 'listing' | 'pencacahan' | 'pengolahan';
    satuan_beban_kerja: string;
    harga_satuan: string;
}

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
    const [pplRows] = await db.query<PPLPacket[]>('SELECT p.*, pm.namaPPL FROM ppl p LEFT JOIN ppl_master pm ON p.ppl_master_id = pm.id WHERE p.kegiatanId IN (' + placeholders + ')', kegiatanIds);
    
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
        
        kegiatan.progressPendataanApproved = calculateProgress(kegiatan.ppl, 'pengumpulan-data', 'Approved');
        kegiatan.progressPengolahanApproved = calculateProgress(kegiatan.ppl, 'pengolahan-analisis', 'Approved');
        kegiatan.progressPendataanSubmit = calculateProgress(kegiatan.ppl, 'pengumpulan-data', 'Submitted');
        kegiatan.progressPengolahanSubmit = calculateProgress(kegiatan.ppl, 'pengolahan-analisis', 'Submitted');
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

// =================================================================
// START OF FIX: createKegiatan function
// =================================================================
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
            ppl: pplAllocations,
            documents, username,
            honorariumSettings
        } = data;
        
        const {
            'pengumpulan-data-listing': listingSettings,
            'pengumpulan-data-pencacahan': pencacahanSettings,
            'pengolahan-analisis': pengolahanSettings
        } = honorariumSettings;

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

        // Simpan honorarium settings ke tabel baru
        const honorSettingsQuery = 'INSERT INTO honorarium_kegiatan (kegiatanId, jenis_pekerjaan, satuan_beban_kerja, harga_satuan) VALUES ?';
        const honorSettingsValues = [    ['listing', listingSettings],    ['pencacahan', pencacahanSettings],    ['pengolahan', pengolahanSettings]  ].map(([jenis, settings]) => [kegiatanId, jenis, settings.satuanBebanKerja, settings.hargaSatuan]);
        await connection.query(honorSettingsQuery, [honorSettingsValues]);

        if (pplAllocations && pplAllocations.length > 0) {
            for (const ppl of pplAllocations) {
                if (!ppl.ppl_master_id) {
                    console.warn("Melewatkan PPL tanpa ppl_master_id:", ppl);
                    continue;
                }
                const totalHonor = ppl.honorarium?.reduce((sum: number, h: HonorariumDetail) => sum + (parseInt(h.besaranHonor || '0')), 0) || 0;
                const totalBeban = ppl.honorarium?.reduce((sum: number, h: HonorariumDetail) => sum + (parseInt(h.bebanKerja || '0')), 0) || 0;

                const pplQuery = 'INSERT INTO ppl (kegiatanId, ppl_master_id, namaPML, bebanKerja, besaranHonor, tahap) VALUES (?, ?, ?, ?, ?, ?)';
                const [pplResult] = await connection.execute<OkPacket>(pplQuery, [
                   kegiatanId, ppl.ppl_master_id, ppl.namaPML, totalBeban, totalHonor, ppl.tahap
                ]);
                const pplId = pplResult.insertId;

                if (ppl.honorarium && ppl.honorarium.length > 0) {
                    const honorQuery = 'INSERT INTO ppl_honorarium (ppl_id, jenis_pekerjaan, bebanKerja, satuanBebanKerja, hargaSatuan, besaranHonor) VALUES ?';
                    
                    const honorValues = ppl.honorarium.map((h: HonorariumDetail) => {
                        let settings: HonorariumSettings | undefined;
                        if (h.jenis_pekerjaan === 'listing') settings = listingSettings;
                        if (h.jenis_pekerjaan === 'pencacahan') settings = pencacahanSettings;
                        if (h.jenis_pekerjaan === 'pengolahan') settings = pengolahanSettings;

                        return [
                            pplId, 
                            h.jenis_pekerjaan, 
                            parseInt(h.bebanKerja || '0'), 
                            settings?.satuanBebanKerja || '', 
                            parseInt(settings?.hargaSatuan || '0'), 
                            parseInt(h.besaranHonor || '0')
                        ];
                    });

                    if (honorValues.length > 0) {
                        await connection.query(honorQuery, [honorValues]);
                    }
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
            const docValues = documents.map(( doc :  Dokumen ) => [
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
// =================================================================
// END OF FIX: createKegiatan function
// =================================================================


// =================================================================
// START OF FIX: updateKegiatan function
// =================================================================
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
            ppl, documents, lastEditedBy,
            honorariumSettings
        } = data;

        const {
            'pengumpulan-data-listing': listingSettings,
            'pengumpulan-data-pencacahan': pencacahanSettings,
            'pengolahan-analisis': pengolahanSettings
        } = honorariumSettings;

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
            lastEditedBy,
            id
        ]);
        
        await connection.execute('DELETE FROM honorarium_kegiatan WHERE kegiatanId = ?', [id]);
        const honorSettingsQuery = 'INSERT INTO honorarium_kegiatan (kegiatanId, jenis_pekerjaan, satuan_beban_kerja, harga_satuan) VALUES ?';
        const honorSettingsValues = [    ['listing', listingSettings],    ['pencacahan', pencacahanSettings],    ['pengolahan', pengolahanSettings]  ].map(([jenis, settings]) => [id, jenis, settings.satuanBebanKerja, settings.hargaSatuan]);
        await connection.query(honorSettingsQuery, [honorSettingsValues]);

        // ================== DOCUMENT LOGIC FIX START ==================
        if (documents) {
            // 1. Get IDs of documents submitted from the client
            const submittedDocIds = documents.map((doc: any) => doc.id).filter(Boolean);

            // 2. Delete non-mandatory documents that were removed by the user
            if (submittedDocIds.length > 0) {
                 const placeholders = submittedDocIds.map(() => '?').join(',');
                 await connection.execute(
                    `DELETE FROM dokumen WHERE kegiatanId = ? AND isWajib = false AND id NOT IN (${placeholders})`,
                    [id, ...submittedDocIds]
                );
            } else {
                // If no existing documents are submitted, delete all non-mandatory ones for this activity
                await connection.execute(
                    'DELETE FROM dokumen WHERE kegiatanId = ? AND isWajib = false',
                    [id]
                );
            }

            // 3. Iterate to INSERT new documents or UPDATE existing ones
            for (const doc of documents) {
                if (doc.id) { // If ID exists, it's an existing document
                    const [existingDoc] = await connection.query<RowDataPacket[]>('SELECT link FROM dokumen WHERE id = ?', [doc.id]);
                if (existingDoc.length > 0 && !existingDoc[0].link && doc.link) {
                    // Jika link sebelumnya KOSONG dan link baru ADA, rekam siapa yang mengunggah
                    const updateDocQuery = 'UPDATE dokumen SET nama = ?, link = ?, status = ?, diunggahOleh_userId = ? WHERE id = ?';
                    await connection.execute(updateDocQuery, [doc.nama, doc.link, doc.status || 'Pending', lastEditedBy, doc.id]);
                } else {
                    // Jika tidak, jalankan update seperti biasa
                    const updateDocQuery = 'UPDATE dokumen SET nama = ?, link = ?, status = ? WHERE id = ?';
                    await connection.execute(updateDocQuery, [doc.nama, doc.link, doc.status || 'Pending', doc.id]);
                }
                } else { // No ID means it's a new document
                const insertDocQuery = 'INSERT INTO dokumen (kegiatanId, nama, link, jenis, tipe, uploadedAt, isWajib, status, diunggahOleh_userId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
                await connection.execute(insertDocQuery, [
                    id,
                    doc.nama,
                    doc.link,
                    doc.jenis || 'link',
                    doc.tipe,
                    new Date(),
                    doc.isWajib || false,
                    doc.status || 'Pending',
                    lastEditedBy // Gunakan lastEditedBy sebagai pengunggah
                ]);
                }
            }
        }
        // ================== DOCUMENT LOGIC FIX END ==================

        // The PPL logic below might have a similar issue, but we focus on the document problem first.
        await connection.execute('DELETE FROM ppl WHERE kegiatanId = ?', [id]);

        if (ppl && ppl.length > 0) {
            for (const p of ppl) {
                if (!p.ppl_master_id) continue;

                const totalHonor = p.honorarium?.reduce((sum: number, h: HonorariumDetail) => sum + (parseInt(h.besaranHonor || '0')), 0) || 0;
                const totalBeban = p.honorarium?.reduce((sum: number, h: HonorariumDetail) => sum + (parseInt(h.bebanKerja || '0')), 0) || 0;

                const pplQuery = 'INSERT INTO ppl (kegiatanId, ppl_master_id, namaPML, bebanKerja, besaranHonor, tahap) VALUES (?, ?, ?, ?, ?, ?)';
                const [pplResult] = await connection.execute<OkPacket>(pplQuery, [
                   id, p.ppl_master_id, p.namaPML, totalBeban, totalHonor, p.tahap
                ]);
                const pplId = pplResult.insertId;

                if (p.honorarium && p.honorarium.length > 0) {
                    const honorQuery = 'INSERT INTO ppl_honorarium (ppl_id, jenis_pekerjaan, bebanKerja, satuanBebanKerja, hargaSatuan, besaranHonor) VALUES ?';
                    
                    const honorValues = p.honorarium.map((h: HonorariumDetail) => {
                        let settings: HonorariumSettings | undefined;
                        if (h.jenis_pekerjaan === 'listing') settings = listingSettings;
                        if (h.jenis_pekerjaan === 'pencacahan') settings = pencacahanSettings;
                        if (h.jenis_pekerjaan === 'pengolahan') settings = pengolahanSettings;
                        
                        return [
                            pplId, 
                            h.jenis_pekerjaan, 
                            parseInt(h.bebanKerja || '0'), 
                            settings?.satuanBebanKerja || '', 
                            parseInt(settings?.hargaSatuan || '0'), 
                            parseInt(h.besaranHonor || '0')
                        ];
                    });
                    
                    if (honorValues.length > 0) {
                      await connection.query(honorQuery, [honorValues]);
                    }
                }

                if (p.progress && Object.keys(p.progress).length > 0) {
                  const progressEntries = Object.entries(p.progress);
                  if (progressEntries.length > 0) {
                        const progressQuery = 'INSERT INTO ppl_progress (ppl_id, progress_type, value) VALUES ?';
                        const progressValues = progressEntries.map(([type, value]) => [pplId, type, value]);
                        await connection.query(progressQuery, [progressValues]);
                    }
                } else {
                  if (totalBeban > 0) {
                    const progressType = p.tahap === 'pengumpulan-data' ? 'open' : 'belum_entry';
                    const progressQuery = 'INSERT INTO ppl_progress (ppl_id, progress_type, value) VALUES (?, ?, ?)';
                    await connection.execute(progressQuery, [pplId, progressType, totalBeban]);
                  }
                }
            }
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
// =================================================================
// END OF FIX: updateKegiatan function
// =================================================================

export const createSingleDocument = async (data: Partial<Dokumen>, username: string): Promise<Dokumen> => {
    const { kegiatanId, nama, link, jenis, tipe, isWajib } = data;

    if (!kegiatanId || !nama || !tipe) {
        throw new Error("Kegiatan ID, Nama, dan Tipe dokumen diperlukan.");
    }

    const query = `
        INSERT INTO dokumen 
        (kegiatanId, nama, link, jenis, tipe, isWajib, status, uploadedAt, diunggahOleh_userId) 
        VALUES (?, ?, ?, ?, ?, ?, 'Pending', ?, ?)
    `;
    const [result] = await db.execute<OkPacket>(query, [
        kegiatanId,
        nama,
        link || null,
        jenis || 'link',
        tipe,
        isWajib || false,
        new Date(),
        username // Menyimpan siapa yang menambah
    ]);

    const newDocId = result.insertId;
    const [rows] = await db.query<RowDataPacket[]>('SELECT * FROM dokumen WHERE id = ?', [newDocId]);
    if (rows.length === 0) {
        throw new Error("Gagal mengambil dokumen yang baru dibuat.");
    }
    return rows[0] as Dokumen;
};

// --- TAMBAHKAN FUNGSI BARU INI ---
export const updateSingleDocument = async (dokumenId: number, data: { link?: string, nama?: string }, username: string): Promise<Dokumen> => {
    const { link, nama } = data;

    if (link === undefined && nama === undefined) {
        const [rows] = await db.query<RowDataPacket[]>('SELECT * FROM dokumen WHERE id = ?', [dokumenId]);
        if (rows.length === 0) throw new Error("Dokumen tidak ditemukan.");
        return rows[0] as Dokumen;
    }

    const query = `
        UPDATE dokumen 
        SET 
            link = ?, 
            nama = ?, 
            status = 'Pending', 
            updatedAt = CURRENT_TIMESTAMP,
            lastEditedBy_userId = ? -- Tambahkan baris ini
        WHERE id = ?
    `;

    const [oldDocRows] = await db.query<RowDataPacket[]>('SELECT * FROM dokumen WHERE id = ?', [dokumenId]);
    if (oldDocRows.length === 0) throw new Error("Dokumen tidak ditemukan untuk diupdate.");
    const oldDoc = oldDocRows[0];

    await db.execute(query, [
        link ?? oldDoc.link,
        nama ?? oldDoc.nama,
        username, // Simpan username sebagai editor terakhir
        dokumenId
    ]);

    const [updatedDocRows] = await db.query<RowDataPacket[]>('SELECT * FROM dokumen WHERE id = ?', [dokumenId]);
    if (updatedDocRows.length === 0) {
        throw new Error("Gagal mengambil dokumen setelah update.");
    }
    
    // Di sini Anda bisa memicu notifikasi
    // await createNotification({ message: `${username} telah mengubah dokumen ${nama}` });

    return updatedDocRows[0] as Dokumen;
};
// --- AKHIR DARI FUNGSI BARU ---

export const deleteSingleDocument = async (id: number): Promise<boolean> => {
    const [result] = await db.execute<OkPacket>('DELETE FROM dokumen WHERE id = ? AND isWajib = false', [id]);
    return result.affectedRows > 0;
};

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
        const progressPendataanSubmit = calculateProgress(allPplForKegiatan, 'pengumpulan-data', 'Submitted');
        const progressPengolahanSubmit = calculateProgress(allPplForKegiatan, 'pengolahan-analisis', 'Submitted');

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