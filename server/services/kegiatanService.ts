import { RowDataPacket, OkPacket } from 'mysql2';
import db from '../db';
import { Kegiatan, Dokumen, PPL } from '@shared/api';

interface KegiatanPacket extends Kegiatan, RowDataPacket {}

// ... (getAllKegiatan dan getKegiatanById tidak berubah)
export const getAllKegiatan = async (): Promise<Kegiatan[]> => {
    const [kegiatanRows] = await db.query<KegiatanPacket[]>('SELECT * FROM kegiatan ORDER BY id DESC');
    for (const kegiatan of kegiatanRows) {
        const [dokumenRows] = await db.query<RowDataPacket[]>('SELECT * FROM dokumen WHERE kegiatanId = ?', [kegiatan.id]);
        const [pplRows] = await db.query<RowDataPacket[]>('SELECT * FROM ppl WHERE kegiatanId = ?', [kegiatan.id]);
        kegiatan.dokumen = dokumenRows as Dokumen[];
        kegiatan.ppl = pplRows as PPL[];
    }
    return kegiatanRows;
};

export const getKegiatanById = async (id: number): Promise<Kegiatan | null> => {
    const [kegiatanRows] = await db.query<KegiatanPacket[]>('SELECT * FROM kegiatan WHERE id = ?', [id]);
    if (kegiatanRows.length === 0) return null;
    const kegiatan = kegiatanRows[0];
    const [dokumenRows] = await db.query<RowDataPacket[]>('SELECT * FROM dokumen WHERE kegiatanId = ?', [id]);
    const [pplRows] = await db.query<RowDataPacket[]>('SELECT * FROM ppl WHERE kegiatanId = ?', [id]);
    kegiatan.dokumen = dokumenRows as Dokumen[];
    kegiatan.ppl = pplRows as PPL[];
    return kegiatan;
};


export const createKegiatan = async (data: any): Promise<Kegiatan> => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const {
            namaKegiatan, ketuaTim, timKerja, tipeKegiatan,
            tanggalMulaiPelatihan, tanggalSelesaiPelatihan,
            tanggalMulaiPendataan, tanggalSelesaiPendataan,
            pplAllocations, documents
        } = data;

        const kegiatanQuery = `
            INSERT INTO kegiatan 
            (namaKegiatan, ketuaTim, timKerja, tipeKegiatan, 
             tanggalMulaiPelatihan, tanggalSelesaiPelatihan, 
             tanggalMulaiPendataan, tanggalSelesaiPendataan, 
             status, progressKeseluruhan) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Persiapan', 0)
        `;
        const [kegiatanResult] = await connection.execute<OkPacket>(kegiatanQuery, [
            namaKegiatan, ketuaTim, timKerja, tipeKegiatan,
            tanggalMulaiPelatihan || null,
            tanggalSelesaiPelatihan || null,
            tanggalMulaiPendataan || null,
            tanggalSelesaiPendataan || null
        ]);
        const kegiatanId = kegiatanResult.insertId;

        if (pplAllocations && pplAllocations.length > 0) {
            const pplQuery = 'INSERT INTO ppl (kegiatanId, namaPPL, namaPML, bebanKerja, besaranHonor, satuanBebanKerja, progressOpen, progressSubmit, progressDiperiksa, progressApproved) VALUES ?';
            const pplValues = pplAllocations.map((ppl: PPL) => {
                const bebanKerja = parseInt(ppl.bebanKerja) || 0;
                return [
                    kegiatanId,
                    ppl.namaPPL,
                    ppl.namaPML,
                    bebanKerja,
                    parseInt(ppl.besaranHonor) || 0,
                    ppl.satuanBebanKerja,
                    bebanKerja,
                    0, 0, 0
                ];
            });
            await connection.query(pplQuery, [pplValues]);
        }
        
        if (documents && documents.length > 0) {
            // FIX: Corrected the SQL query to match the database schema
            const docQuery = 'INSERT INTO dokumen (kegiatanId, nama, link, jenis) VALUES ?';
            const docValues = documents.map((doc: Dokumen) => [
                kegiatanId, doc.nama, doc.link, doc.jenis
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

// ... (Sisa service tetap sama)
export const updatePplProgress = async (pplId: number, progressData: { open: number; submit: number; diperiksa: number; approved: number; }) => {
    const { open, submit, diperiksa, approved } = progressData;
    const query = `
        UPDATE ppl 
        SET progressOpen = ?, progressSubmit = ?, progressDiperiksa = ?, progressApproved = ? 
        WHERE id = ?
    `;
    await db.execute(query, [open, submit, diperiksa, approved, pplId]);
    
    const [pplRows] = await db.query<RowDataPacket[]>('SELECT kegiatanId FROM ppl WHERE id = ?', [pplId]);
    if (pplRows.length > 0) {
        const kegiatanId = pplRows[0].kegiatanId;
        
        const [allPplForKegiatan] = await db.query<RowDataPacket[]>('SELECT bebanKerja, progressApproved FROM ppl WHERE kegiatanId = ?', [kegiatanId]);
        const totalBebanKerja = allPplForKegiatan.reduce((acc, p) => acc + (p.bebanKerja || 0), 0);
        const totalApproved = allPplForKegiatan.reduce((acc, p) => acc + (p.progressApproved || 0), 0);
        const progressKeseluruhan = totalBebanKerja > 0 ? Math.round((totalApproved / totalBebanKerja) * 100) : 0;

        await db.execute(
            'UPDATE kegiatan SET lastUpdated = CURRENT_TIMESTAMP, progressKeseluruhan = ? WHERE id = ?', 
            [progressKeseluruhan, kegiatanId]
        );
    }

    const [updatedPpl] = await db.query<RowDataPacket[]>('SELECT * FROM ppl WHERE id = ?', [pplId]);
    return updatedPpl[0];
};

export const updateKegiatan = async (id: number, data: any): Promise<Kegiatan> => {
    const connection = await db.getConnection();
    console.log(`SERVER RECEIVED UPDATE FOR ID ${id}:`, JSON.stringify(data, null, 2));
    try {
        await connection.beginTransaction();

        const {
            namaKegiatan, ketuaTim, timKerja, tipeKegiatan,
            tanggalMulaiPelatihan, tanggalSelesaiPelatihan,
            tanggalMulaiPendataan, tanggalSelesaiPendataan,
            ppl, dokumen // Renamed for clarity
        } = data;

        const kegiatanQuery = `
            UPDATE kegiatan SET 
            namaKegiatan = ?, ketuaTim = ?, timKerja = ?, tipeKegiatan = ?, 
            tanggalMulaiPelatihan = ?, tanggalSelesaiPelatihan = ?, 
            tanggalMulaiPendataan = ?, tanggalSelesaiPendataan = ?,
            lastUpdated = CURRENT_TIMESTAMP
            WHERE id = ?
        `;
        await connection.execute(kegiatanQuery, [
            namaKegiatan, ketuaTim, timKerja, tipeKegiatan,
            tanggalMulaiPelatihan || null, tanggalSelesaiPelatihan || null,
            tanggalMulaiPendataan || null, tanggalSelesaiPendataan || null,
            id
        ]);

        // Clear existing related data
        await connection.execute('DELETE FROM ppl WHERE kegiatanId = ?', [id]);
        await connection.execute('DELETE FROM dokumen WHERE kegiatanId = ?', [id]);

        // Re-insert PPL data
        if (ppl && ppl.length > 0) {
            const pplQuery = 'INSERT INTO ppl (kegiatanId, namaPPL, namaPML, bebanKerja, besaranHonor, satuanBebanKerja) VALUES ?';
            const pplValues = ppl.map((p: PPL) => [
                id, p.namaPPL, p.namaPML,
                parseInt(p.bebanKerja) || 0,
                parseInt(p.besaranHonor) || 0,
                p.satuanBebanKerja
            ]);
            await connection.query(pplQuery, [pplValues]);
        }
        
        // Re-insert document data
        if (dokumen && dokumen.length > 0) {
            // FIX: Corrected the SQL query to match the database schema
            const docQuery = 'INSERT INTO dokumen (kegiatanId, nama, link, jenis) VALUES ?';
            const docValues = dokumen.map((doc: any) => [
                id, doc.nama, doc.link, doc.jenis
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
