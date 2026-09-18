// Dipisah dari server/services/kegiatanService.ts tanpa mengubah isinya.

import { RowDataPacket, OkPacket } from 'mysql2';
import db from '../db';
import { catatRiwayat } from './riwayatService';
import { Dokumen } from '@shared/api';

// =================================================================
// END OF MODIFICATION: updateKegiatan function
// =================================================================

// ... (sisa file tidak berubah)

export const createSingleDocument = async (data: Partial<Dokumen>, username: string): Promise<Dokumen> => {
    const { kegiatanId, nama, link, jenis, tipe, isWajib, penanggungJawab } = data;

    if (!kegiatanId || !nama || !tipe) {
        throw new Error("Kegiatan ID, Nama, dan Tipe dokumen diperlukan.");
    }

    const query = `
        INSERT INTO dokumen
        (kegiatanId, nama, link, jenis, tipe, isWajib, penanggungJawab, status, uploadedAt, diunggahOleh_userId)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending', ?, ?)
    `;
    const [result] = await db.execute<OkPacket>(query, [
        kegiatanId,
        nama,
        link || null,
        jenis || 'link',
        tipe,
        isWajib || false,
        // Tim keuangan boleh menambahkan dokumen yang ia tahu diperlukan, tapi
        // yang mengisinya tetap ketua tim — itu nilai bawaannya.
        penanggungJawab === 'keuangan' ? 'keuangan' : 'ketua_tim',
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

export const updateSingleDocument = async (dokumenId: number, data: { link?: string, nama?: string }, username: string): Promise<Dokumen> => {
    const { link, nama } = data;

    if (link === undefined && nama === undefined) {
        const [rows] = await db.query<RowDataPacket[]>('SELECT * FROM dokumen WHERE id = ?', [dokumenId]);
        if (rows.length === 0) throw new Error("Dokumen tidak ditemukan.");
        return rows[0] as Dokumen;
    }

    const [oldDocRows] = await db.query<RowDataPacket[]>('SELECT * FROM dokumen WHERE id = ?', [dokumenId]);
    if (oldDocRows.length === 0) throw new Error("Dokumen tidak ditemukan untuk diupdate.");
    const oldDoc = oldDocRows[0];

    // Kalau dokumen yang diperbaiki tadinya DITOLAK, tandai sebagai unggah
    // ulang supaya supervisor mendapat notifikasi "sudah diperbaiki" dan bukan
    // sekadar "menunggu persetujuan" seperti dokumen baru.
    const diunggahUlang = oldDoc.status === 'Rejected';

    // Pengingat "dokumen ini belum diisi" kehilangan alasannya begitu link-nya
    // terisi. Dikosongkan di sini, bukan dibiarkan menggantung, supaya dokumen
    // yang kelak dikosongkan lagi bisa diingatkan sekali lagi.
    const linkBaru = link ?? oldDoc.link;
    const hapusPengingat = linkBaru
        ? ', pengingatDikirimPada = NULL, pengingatDikirimOleh = NULL'
        : '';

    const query = `
        UPDATE dokumen
        SET
            link = ?,
            nama = ?,
            status = 'Pending',
            updatedAt = CURRENT_TIMESTAMP,
            resubmittedAt = ${diunggahUlang ? 'CURRENT_TIMESTAMP' : 'resubmittedAt'},
            lastEditedBy_userId = ?${hapusPengingat}
        WHERE id = ?
    `;

    await db.execute(query, [
        linkBaru,
        nama ?? oldDoc.nama,
        username,
        dokumenId
    ]);

    const [updatedDocRows] = await db.query<RowDataPacket[]>('SELECT * FROM dokumen WHERE id = ?', [dokumenId]);
    if (updatedDocRows.length === 0) {
        throw new Error("Gagal mengambil dokumen setelah update.");
    }
    
    return updatedDocRows[0] as Dokumen;
};

/**
 * @param bolehHapusWajib dokumen WAJIB hanya boleh dihapus tim keuangan/admin.
 *   Ketua tim tetap tidak bisa menghilangkan syarat kelengkapan kegiatannya
 *   sendiri, tetapi tim keuangan perlu bisa membatalkan dokumen yang keliru ia
 *   tambahkan — dan dokumen tambahan itu selalu bertanda wajib.
 */
export const deleteSingleDocument = async (id: number, bolehHapusWajib = false): Promise<boolean> => {
    const query = bolehHapusWajib
        ? 'DELETE FROM dokumen WHERE id = ?'
        : 'DELETE FROM dokumen WHERE id = ? AND isWajib = false';
    const [result] = await db.execute<OkPacket>(query, [id]);
    return result.affectedRows > 0;
};

/**
 * Mengganti NAMA dokumen saja.
 *
 * Terpisah dari `updateSingleDocument` yang selalu mengembalikan status ke
 * 'Pending': mengganti nama bukan pengunggahan ulang, jadi dokumen yang sudah
 * disetujui tidak boleh kehilangan persetujuannya hanya karena namanya
 * dirapikan.
 */
export const ubahNamaDokumen = async (id: number, nama: string, username: string): Promise<Dokumen> => {
    const [lamaRows] = await db.query<RowDataPacket[]>(
        'SELECT id, kegiatanId, nama FROM dokumen WHERE id = ? LIMIT 1', [id]);
    const lama = lamaRows[0];
    if (!lama) throw new Error('Dokumen tidak ditemukan.');

    await db.execute(
        'UPDATE dokumen SET nama = ?, lastEditedBy_userId = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
        [nama, username, id]);

    await catatRiwayat(null, {
        kegiatanId: lama.kegiatanId,
        aksi: 'dokumen_diganti_nama',
        entitas: 'dokumen',
        entitasId: id,
        aktorNama: username,
        ringkasan: `Nama dokumen "${lama.nama}" diubah menjadi "${nama}"`,
    });

    const [baruRows] = await db.query<RowDataPacket[]>('SELECT * FROM dokumen WHERE id = ?', [id]);
    return baruRows[0] as Dokumen;
};

/**
 * Tim keuangan mengirim pengingat untuk dokumen yang link-nya masih kosong.
 *
 * Tidak ada baris notifikasi yang ditulis: notifikasi di aplikasi ini dihitung
 * saat dibaca. Yang disimpan di sini hanyalah FAKTA bahwa pengingatnya sudah
 * dikirim — dan fakta itu sekaligus jadi syarat kemunculan notifikasinya di
 * lonceng ketua tim dan pembuat kegiatan (lihat `qPengingatDokumen`).
 *
 * Dua penolakan yang disengaja:
 * - link sudah terisi → tidak ada yang perlu diingatkan lagi;
 * - pengingat sudah pernah dikirim → mencegah tombolnya dipakai berulang kali
 *   untuk membanjiri lonceng orang lain.
 *
 * Keduanya memakai keadaan yang dibaca ULANG dari database di dalam satu
 * UPDATE bersyarat, bukan dari hasil SELECT sebelumnya: dua permintaan yang
 * datang hampir bersamaan sama-sama akan lolos pemeriksaan SELECT, tetapi
 * hanya satu yang bisa membuat `affectedRows` menjadi 1.
 */
export const kirimPengingatDokumen = async (
    dokumenId: number,
    username: string,
): Promise<Dokumen> => {
    const [rows] = await db.query<RowDataPacket[]>(
        'SELECT id, kegiatanId, nama, link, jenis, pengingatDikirimPada FROM dokumen WHERE id = ? LIMIT 1',
        [dokumenId]);
    const doc = rows[0];
    if (!doc) {
        const galat: any = new Error('Dokumen tidak ditemukan.');
        galat.statusCode = 404;
        throw galat;
    }
    if (doc.jenis === 'catatan') {
        const galat: any = new Error('Catatan tidak punya link, jadi tidak ada yang perlu diingatkan.');
        galat.statusCode = 400;
        throw galat;
    }
    if (doc.link) {
        const galat: any = new Error(`Link dokumen "${doc.nama}" sudah diisi.`);
        galat.statusCode = 400;
        throw galat;
    }

    const [hasil] = await db.execute<OkPacket>(
        `UPDATE dokumen
            SET pengingatDikirimPada = CURRENT_TIMESTAMP, pengingatDikirimOleh = ?
          WHERE id = ?
            AND pengingatDikirimPada IS NULL
            AND (link IS NULL OR link = '')`,
        [username, dokumenId]);

    if (hasil.affectedRows === 0) {
        const galat: any = new Error(`Pengingat untuk dokumen "${doc.nama}" sudah pernah dikirim.`);
        galat.statusCode = 409;
        throw galat;
    }

    await catatRiwayat(null, {
        kegiatanId: doc.kegiatanId,
        aksi: 'pengingat_dokumen_dikirim',
        entitas: 'dokumen',
        entitasId: dokumenId,
        aktorNama: username,
        ringkasan: `Pengingat pengisian dokumen "${doc.nama}" dikirim ke ketua tim dan pembuat kegiatan`,
    });

    const [baru] = await db.query<RowDataPacket[]>('SELECT * FROM dokumen WHERE id = ?', [dokumenId]);
    return baru[0] as Dokumen;
};

export const updateDocumentStatus = async (
    dokumenId: number,
    status: Dokumen['status'],
    username: string,
    rejectionNote?: string,
): Promise<Dokumen> => {
    if (status === 'Approved') {
        const query = 'UPDATE dokumen SET status = ?, lastApproved = CURRENT_TIMESTAMP, lastApprovedBy = ? WHERE id = ?';
        await db.execute(query, [status, username, dokumenId]);
    } else if (status === 'Rejected') {
        // resubmittedAt dikosongkan supaya penolakan ULANG membuat dokumen
        // kembali jadi 'menunggu persetujuan' biasa, bukan tetap tercatat
        // sebagai "sudah diperbaiki".
        const query = `UPDATE dokumen
                          SET status = 'Rejected',
                              rejectionNote = ?,
                              rejectedAt = CURRENT_TIMESTAMP,
                              rejectedBy = ?,
                              resubmittedAt = NULL
                        WHERE id = ?`;
        await db.execute(query, [rejectionNote ?? null, username, dokumenId]);
    } else {
        const query = 'UPDATE dokumen SET status = ? WHERE id = ?';
        // `status!`: parameter wajib; tanda seru hanya untuk tipe mysql2 3.24.
        await db.execute(query, [status!, dokumenId]);
    }

    const [rows] = await db.query<RowDataPacket[]>('SELECT * FROM dokumen WHERE id = ?', [dokumenId]);
    if (rows.length === 0) {
        throw new Error("Dokumen tidak ditemukan setelah update");
    }
    const dok = rows[0] as Dokumen;

    const aksiPerStatus: Record<string, string> = {
        Approved: 'dokumen_disetujui',
        Rejected: 'dokumen_ditolak',
    };
    if (dok.kegiatanId && aksiPerStatus[status ?? '']) {
        await catatRiwayat(null, {
            kegiatanId: dok.kegiatanId,
            aksi: aksiPerStatus[status!],
            entitas: 'dokumen',
            entitasId: dokumenId,
            aktorNama: username,
            ringkasan: dok.nama,
        });
    }
    return dok;
};

export const approveDocumentsByTipe = async (kegiatanId: number, tipe: Dokumen['tipe'], username: string): Promise<OkPacket> => {
    const query = 'UPDATE dokumen SET status = ?, lastApproved = CURRENT_TIMESTAMP, lastApprovedBy = ? WHERE kegiatanId = ? AND tipe = ? AND status != ?';
    const [result] = await db.execute<OkPacket>(query, ['Approved', username, kegiatanId, tipe, 'Approved']);
    if (result.affectedRows > 0) {
        await catatRiwayat(null, {
            kegiatanId,
            aksi: 'dokumen_disetujui',
            entitas: 'dokumen',
            jumlah: result.affectedRows,
            aktorNama: username,
            ringkasan: `tahap ${tipe.replace(/-/g, ' ')}`,
        });
    }
    return result;
};
/**
 * Mengalihkan tanggung jawab pengisian sebuah dokumen.
 *
 * SENGAJA tidak menyentuh status, link, maupun resubmittedAt — dan karena itu
 * TIDAK menumpang `updateSingleDocument`, yang selalu memaksa status kembali
 * 'Pending'. Mengalihkan tanggung jawab bukan pengunggahan ulang; dokumen yang
 * sudah disetujui tidak boleh kehilangan persetujuannya hanya karena tim
 * keuangan mengambil alih pengisiannya di kemudian hari.
 */
export const ubahPenanggungJawabDokumen = async (
    dokumenId: number,
    penanggungJawab: 'ketua_tim' | 'keuangan',
    username: string,
): Promise<Dokumen> => {
    const [lamaRows] = await db.query<RowDataPacket[]>(
        'SELECT id, kegiatanId, nama, penanggungJawab FROM dokumen WHERE id = ?', [dokumenId]);
    const lama = lamaRows[0];
    if (!lama) throw new Error('Dokumen tidak ditemukan.');

    await db.execute(
        `UPDATE dokumen
            SET penanggungJawab = ?, penanggungJawabDiubahOleh = ?,
                penanggungJawabDiubahPada = CURRENT_TIMESTAMP
          WHERE id = ?`,
        [penanggungJawab, username, dokumenId]
    );

    // Di luar transaksi, jadi argumen pertamanya null (lihat riwayatService).
    await catatRiwayat(null, {
        kegiatanId: lama.kegiatanId,
        aksi: 'ubah_penanggung_jawab',
        entitas: 'dokumen',
        entitasId: dokumenId,
        aktorNama: username,
        ringkasan: `Penanggung jawab dokumen "${lama.nama}" diubah menjadi ${
            penanggungJawab === 'keuangan' ? 'Tim Keuangan' : 'Ketua Tim'}`,
    });

    const [barisBaru] = await db.query<RowDataPacket[]>('SELECT * FROM dokumen WHERE id = ?', [dokumenId]);
    return barisBaru[0] as Dokumen;
};
