// Dipisah dari server/services/kontrakService.ts tanpa mengubah isinya.

import { RowDataPacket, OkPacket } from 'mysql2';
import type { PoolConnection } from 'mysql2/promise';
import db from '../db';
import { susunNomorSurat } from '../../shared/nomorSurat';
import { celahNomor, nomorBolehDipakai, rencanaRapikanNomor, bandingkanIsiSurat, type RencanaRapikan, type SuratBernomor } from '../../shared/penomoranSurat';
import { DataKontrakMitra, RiwayatSuratItem, RiwayatSuratTahun } from '@shared/api';
import { POLA_BAST_BAWAAN, POLA_SPK_BAWAAN, denganKunciNomorTahun } from './kontrakBantu';
import { getTemplateAktif } from './kontrakTemplate';
import { keBarisIsi, uraikanIsiTerbit, getDataKontrak } from './kontrakData';

// =====================================================================
// Riwayat Penyuratan: melihat, membatalkan, menomori ulang
//
// Nomor surat adalah dokumen resmi, jadi tidak ada yang hilang diam-diam.
// Surat yang tidak jadi dipakai DIBATALKAN (status 'batal' + catatan) dan tetap
// tampil di riwayat, sehingga "nomor 005 ke mana" selalu terjawab. Penghapusan
// permanen hanya untuk surat yang SUDAH batal — dan penghapusan itu sendiri
// dicatat ke `riwayat_surat`.
// =====================================================================

/** Satu tahun penyuratan, surat batal ikut, beserta nomor yang kosong. */
export const getRiwayatSurat = async (tahun: number): Promise<RiwayatSuratTahun> => {
    const [rows] = await db.query<RowDataPacket[]>(
        `SELECT km.id, km.nomor_urut, km.nomor_surat, km.nomor_bast, km.isi_terbit,
                DATE_FORMAT(km.tanggal_surat, '%Y-%m-%d') AS tanggal_surat,
                DATE_FORMAT(km.tanggal_bast,  '%Y-%m-%d') AS tanggal_bast,
                DATE_FORMAT(km.periode_mulai,   '%Y-%m-%d') AS periode_mulai,
                DATE_FORMAT(km.periode_selesai, '%Y-%m-%d') AS periode_selesai,
                km.ppl_master_id, pm.namaPPL, km.total_honor, km.status, km.catatan,
                DATE_FORMAT(km.dibatalkanPada, '%Y-%m-%d %H:%i') AS dibatalkanPada,
                km.dibatalkanOleh, km.generatedBy
           FROM kontrak_mitra km
           LEFT JOIN ppl_master pm ON pm.id = km.ppl_master_id
          WHERE YEAR(km.tanggal_surat) = ?
          ORDER BY km.nomor_urut, km.id`,
        [tahun]
    );

    // Data sekarang diambil SEKALI per periode, bukan per surat: satu periode
    // biasanya memuat banyak surat, dan `getDataKontrak` adalah kueri berat.
    const periodeUnik = new Map<string, { mulai: string; selesai: string }>();
    for (const r of rows) {
        periodeUnik.set(`${r.periode_mulai}|${r.periode_selesai}`,
            { mulai: r.periode_mulai, selesai: r.periode_selesai });
    }
    const dataPerPeriode = new Map<string, Map<string, DataKontrakMitra>>();
    for (const [kunci, p] of periodeUnik) {
        const data = await getDataKontrak(p.mulai, p.selesai);
        dataPerPeriode.set(kunci, new Map(data.map(m => [m.pplMasterId, m])));
    }

    const surat: RiwayatSuratItem[] = rows.map(r => {
        const sekarang = dataPerPeriode
            .get(`${r.periode_mulai}|${r.periode_selesai}`)
            ?.get(r.ppl_master_id);
        const isiTerbit = uraikanIsiTerbit(r.isi_terbit);
        const isiSekarang = (sekarang?.baris ?? []).map(keBarisIsi);
        const batal = r.status === 'batal';

        // Surat batal TIDAK dibandingkan: ia arsip, dan isinya memang harus
        // memperlihatkan keadaan saat surat itu dibatalkan. Menandainya "butuh
        // konfirmasi" hanya akan menuntut tindakan atas surat yang sudah tidak
        // berlaku.
        const beda = batal
            ? []
            : bandingkanIsiSurat(
                isiTerbit,
                r.total_honor === null || r.total_honor === undefined ? null : Number(r.total_honor),
                isiSekarang);

        return {
            id: Number(r.id),
            nomorUrut: Number(r.nomor_urut),
            nomorSurat: r.nomor_surat,
            nomorBast: r.nomor_bast ?? null,
            tanggalSurat: r.tanggal_surat,
            tanggalBast: r.tanggal_bast ?? null,
            pplMasterId: r.ppl_master_id,
            namaPPL: r.namaPPL ?? r.ppl_master_id,
            periodeMulai: r.periode_mulai,
            periodeSelesai: r.periode_selesai,
            totalHonor: Number(r.total_honor) || 0,
            status: batal ? 'batal' : 'aktif',
            catatan: r.catatan ?? null,
            dibatalkanPada: r.dibatalkanPada ?? null,
            dibatalkanOleh: r.dibatalkanOleh ?? null,
            generatedBy: r.generatedBy ?? null,
            // Yang tertulis di surat, bukan keadaan hari ini — kecuali untuk
            // surat lama yang tidak menyimpan salinan isinya.
            baris: isiTerbit ?? isiSekarang,
            perubahan: beda.length > 0 ? beda : undefined,
        };
    });

    return {
        tahun,
        surat,
        celah: celahNomor(surat.map(s => ({ id: s.id, nomorUrut: s.nomorUrut, status: s.status }))),
    };
};

/** Semua surat setahun dalam bentuk ringkas yang dipakai aturan penomoran. */
export const suratBernomorTahun = async (
    connection: PoolConnection,
    tahun: number,
    kunci: boolean,
): Promise<SuratBernomor[]> => {
    const [rows] = await connection.query<RowDataPacket[]>(
        `SELECT id, nomor_urut, status FROM kontrak_mitra
          WHERE YEAR(tanggal_surat) = ? ORDER BY nomor_urut, id${kunci ? ' FOR UPDATE' : ''}`,
        [tahun]
    );
    return rows.map(r => ({
        id: Number(r.id),
        nomorUrut: Number(r.nomor_urut),
        status: r.status === 'batal' ? 'batal' : 'aktif',
    }));
};

/**
 * Menyusun ulang teks nomor surat (dan BAST bila ada) dari nomor urut baru.
 *
 * Teks nomornya TIDAK boleh sekadar diganti angkanya: polanya memuat bulan dan
 * tahun, jadi ia disusun ulang dengan pola yang sama seperti saat terbit.
 */
export const tulisNomorBaru = async (
    connection: PoolConnection,
    id: number,
    nomorBaru: number,
    polaSpk: string,
    polaBast: string,
): Promise<void> => {
    const [rows] = await connection.query<RowDataPacket[]>(
        `SELECT DATE_FORMAT(tanggal_surat, '%Y-%m-%d') AS tanggal_surat,
                DATE_FORMAT(tanggal_bast,  '%Y-%m-%d') AS tanggal_bast, nomor_bast
           FROM kontrak_mitra WHERE id = ?`,
        [id]
    );
    const baris = rows[0];
    if (!baris) return;
    const nomorSurat = susunNomorSurat(polaSpk, nomorBaru, new Date(`${baris.tanggal_surat}T00:00:00`));
    const nomorBast = baris.nomor_bast && baris.tanggal_bast
        ? susunNomorSurat(polaBast, nomorBaru, new Date(`${baris.tanggal_bast}T00:00:00`))
        : null;
    await connection.execute(
        `UPDATE kontrak_mitra
            SET nomor_urut = ?, nomor_surat = ?, nomor_bast = COALESCE(?, nomor_bast)
          WHERE id = ?`,
        [nomorBaru, nomorSurat, nomorBast, id]
    );
};

export type HasilUbahNomor =
    | { ok: true; nomorSurat: string; nomorBast: string | null }
    | { ok: false; alasan: 'tidak-ada' | 'dipakai' };

/**
 * Mengganti nomor urut sebuah surat dengan nomor yang diketik tim keuangan,
 * mis. menyesuaikan buku agenda manual.
 *
 * Nomor yang sudah dipegang surat AKTIF lain ditolak. Bentrok dengan surat
 * BATAL diizinkan — surat batal tidak lagi berlaku — dan layar yang
 * memberitahukannya.
 */
export const ubahNomorSurat = async (
    id: number,
    nomorBaru: number,
    username?: string,
): Promise<HasilUbahNomor> => {
    const template = await getTemplateAktif();
    const polaSpk = template?.format_nomor || POLA_SPK_BAWAAN;
    const polaBast = template?.format_nomor_bast || POLA_BAST_BAWAAN;

    const connection = await db.getConnection();
    try {
        // Tahun suratnya dibaca lebih dulu untuk menentukan kunci penomoran
        // yang dipegang; barisnya dibaca ulang dengan FOR UPDATE di dalam kunci.
        const [tahunRows] = await connection.query<RowDataPacket[]>(
            'SELECT YEAR(tanggal_surat) AS tahun FROM kontrak_mitra WHERE id = ?', [id]);
        if (!tahunRows[0]) return { ok: false, alasan: 'tidak-ada' };
        return await denganKunciNomorTahun(connection, Number(tahunRows[0].tahun), async (): Promise<HasilUbahNomor> => {
        await connection.beginTransaction();
        const [barisRows] = await connection.query<RowDataPacket[]>(
            `SELECT YEAR(tanggal_surat) AS tahun, nomor_urut, nomor_surat
               FROM kontrak_mitra WHERE id = ? FOR UPDATE`,
            [id]
        );
        const baris = barisRows[0];
        if (!baris) {
            await connection.rollback();
            return { ok: false, alasan: 'tidak-ada' };
        }
        const setahun = await suratBernomorTahun(connection, Number(baris.tahun), true);
        if (!nomorBolehDipakai(nomorBaru, setahun, id)) {
            await connection.rollback();
            return { ok: false, alasan: 'dipakai' };
        }
        await tulisNomorBaru(connection, id, nomorBaru, polaSpk, polaBast);
        const [sesudah] = await connection.query<RowDataPacket[]>(
            'SELECT nomor_surat, nomor_bast FROM kontrak_mitra WHERE id = ?', [id]
        );
        await connection.execute(
            `INSERT INTO riwayat_surat
                (aksi, periode_mulai, periode_selesai, jumlah, jumlah_bast, nomor_surat, nomor_bast, aktorNama)
             SELECT 'ubah_nomor', periode_mulai, periode_selesai, 1, 0, ?, ?, ?
               FROM kontrak_mitra WHERE id = ?`,
            [`${baris.nomor_surat} -> ${sesudah[0]?.nomor_surat}`, null, username ?? null, id]
        );
        await connection.commit();
        return {
            ok: true,
            nomorSurat: sesudah[0]?.nomor_surat,
            nomorBast: sesudah[0]?.nomor_bast ?? null,
        };
        });
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

/**
 * Membatalkan sebuah surat: nomornya tetap tercatat, tapi tidak lagi berlaku.
 *
 * Setelah ini mitra yang bersangkutan dianggap BELUM punya surat untuk periode
 * itu, sehingga surat penggantinya bisa digenerate dengan nomor baru.
 */
export const batalkanSurat = async (
    id: number,
    catatan: string,
    username?: string,
): Promise<boolean> => {
    const [hasil] = await db.execute<OkPacket>(
        `UPDATE kontrak_mitra
            SET status = 'batal', catatan = ?, dibatalkanPada = NOW(), dibatalkanOleh = ?
          WHERE id = ? AND status = 'aktif'`,
        [catatan || null, username ?? null, id]
    );
    if (hasil.affectedRows === 0) return false;
    await db.execute(
        `INSERT INTO riwayat_surat
            (aksi, periode_mulai, periode_selesai, jumlah, jumlah_bast, nomor_surat, nomor_bast, aktorNama)
         SELECT 'batalkan_surat', periode_mulai, periode_selesai, 1,
                IF(nomor_bast IS NULL, 0, 1), nomor_surat, nomor_bast, ?
           FROM kontrak_mitra WHERE id = ?`,
        [username ?? null, id]
    );
    return true;
};

/** Menyunting catatan sebuah surat batal, mis. memperjelas alasannya. */
export const ubahCatatanSurat = async (id: number, catatan: string): Promise<boolean> => {
    const [hasil] = await db.execute<OkPacket>(
        'UPDATE kontrak_mitra SET catatan = ? WHERE id = ?',
        [catatan || null, id]
    );
    return hasil.affectedRows > 0;
};

/**
 * Menghapus permanen sebuah surat yang SUDAH batal, supaya riwayat tidak penuh
 * nomor ganda yang membingungkan.
 *
 * Surat aktif tidak bisa dihapus lewat sini — batalkan dulu, supaya tidak ada
 * nomor berlaku yang lenyap dalam satu langkah. Nomor dan pemiliknya dicatat ke
 * `riwayat_surat` SEBELUM barisnya hilang: setelah ini, catatan itulah satu-
 * satunya jejak yang tersisa.
 */
export const hapusSuratBatal = async (id: number, username?: string): Promise<boolean> => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const [rows] = await connection.query<RowDataPacket[]>(
            `SELECT nomor_surat, nomor_bast, periode_mulai, periode_selesai, status, catatan
               FROM kontrak_mitra WHERE id = ? FOR UPDATE`,
            [id]
        );
        const baris = rows[0];
        if (!baris || baris.status !== 'batal') {
            await connection.rollback();
            return false;
        }
        await connection.execute(
            `INSERT INTO riwayat_surat
                (aksi, periode_mulai, periode_selesai, jumlah, jumlah_bast, nomor_surat, nomor_bast, aktorNama)
             VALUES ('hapus_surat_batal', ?, ?, 1, ?, ?, ?, ?)`,
            [baris.periode_mulai, baris.periode_selesai, baris.nomor_bast ? 1 : 0,
             baris.nomor_surat, baris.nomor_bast ?? null, username ?? null]
        );
        await connection.execute('DELETE FROM kontrak_mitra WHERE id = ?', [id]);
        await connection.commit();
        return true;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

/**
 * Merapatkan nomor surat AKTIF satu tahun menjadi 1, 2, 3, ... tanpa lubang.
 *
 * `pratinjau` mengembalikan rencananya tanpa mengubah apa pun, supaya layar bisa
 * memperlihatkan "004 jadi 003, 005 jadi 004" sebelum pengguna menyetujui.
 *
 * Nomor ditulis dalam DUA tahap lewat nomor sementara bertanda negatif: menulis
 * langsung bisa menabrak nomor yang belum sempat bergeser (mengubah 4 jadi 3
 * saat 3 masih ada). Nomor negatif tidak mungkin dipakai surat sungguhan.
 */
export const rapikanNomorTahun = async (
    tahun: number,
    pratinjau: boolean,
    username?: string,
): Promise<RencanaRapikan & { diterapkan: number }> => {
    const template = await getTemplateAktif();
    const polaSpk = template?.format_nomor || POLA_SPK_BAWAAN;
    const polaBast = template?.format_nomor_bast || POLA_BAST_BAWAAN;

    const connection = await db.getConnection();
    try {
        // Satu penomoran per tahun pada satu waktu — lihat denganKunciNomorTahun.
        return await denganKunciNomorTahun(connection, tahun, async () => {
        await connection.beginTransaction();
        const setahun = await suratBernomorTahun(connection, tahun, !pratinjau);
        const rencana = rencanaRapikanNomor(setahun);

        if (pratinjau || rencana.perubahan.length === 0) {
            await connection.rollback();
            return { ...rencana, diterapkan: 0 };
        }

        for (const p of rencana.perubahan) {
            await connection.execute(
                'UPDATE kontrak_mitra SET nomor_urut = ? WHERE id = ?', [-p.baru, p.id]);
        }
        for (const p of rencana.perubahan) {
            await tulisNomorBaru(connection, p.id, p.baru, polaSpk, polaBast);
        }

        await connection.execute(
            `INSERT INTO riwayat_surat
                (aksi, periode_mulai, periode_selesai, jumlah, jumlah_bast, nomor_surat, nomor_bast, aktorNama)
             VALUES ('rapikan_nomor', ?, ?, ?, 0, ?, NULL, ?)`,
            [`${tahun}-01-01`, `${tahun}-12-31`, rencana.perubahan.length,
             rencana.perubahan.map(p => `${p.lama} -> ${p.baru}`).join(', '), username ?? null]
        );
        await connection.commit();
        return { ...rencana, diterapkan: rencana.perubahan.length };
        });
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};
