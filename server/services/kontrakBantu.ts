// Dipisah dari server/services/kontrakService.ts tanpa mengubah isinya.

import type { RowDataPacket } from 'mysql2';
import type { PoolConnection } from 'mysql2/promise';

/** Berapa lama menunggu penomoran yang sedang dipakai orang lain, dalam detik. */
const TUNGGU_KUNCI_NOMOR_DETIK = 15;

/**
 * Menjalankan `kerja` sambil memegang kunci penomoran surat untuk SATU tahun.
 *
 * Penomoran membaca nomor tertinggi lalu menulis nomor berikutnya. Tanpa kunci,
 * dua tim keuangan yang menekan Generate bersamaan membaca angka yang sama dan
 * menerbitkan nomor ganda — terbukti: 15 nomor ganda dalam 5 kali percobaan.
 * `SELECT ... FOR UPDATE` tidak cukup: pada tahun yang belum punya surat tidak
 * ada baris yang bisa dikunci, jadi kedua transaksi tetap lolos bersamaan.
 *
 * Kunci bernama MySQL (GET_LOCK) dipakai karena mengunci "penomoran tahun X"
 * itu sendiri, bukan baris. Namanya diberi awalan nama database: kunci bernama
 * berlaku untuk seluruh server MySQL, dan di cPanel server itu dipakai bersama
 * akun lain. Kunci WAJIB dilepas di `finally` — ia melekat pada koneksi, dan
 * koneksi kembali ke pool untuk dipakai permintaan lain.
 */
export const denganKunciNomorTahun = async <T>(
    connection: PoolConnection,
    tahun: number,
    kerja: () => Promise<T>,
): Promise<T> => {
    const [baris] = await connection.query<RowDataPacket[]>(
        "SELECT GET_LOCK(CONCAT(DATABASE(), ':nomor-surat:', ?), ?) AS dapat",
        [tahun, TUNGGU_KUNCI_NOMOR_DETIK]);
    if (Number(baris[0]?.dapat) !== 1) {
        throw Object.assign(
            new Error('Penomoran surat sedang dipakai orang lain. Tunggu sebentar, lalu coba lagi.'),
            { statusCode: 409 });
    }
    try {
        return await kerja();
    } finally {
        await connection.query("SELECT RELEASE_LOCK(CONCAT(DATABASE(), ':nomor-surat:', ?))", [tahun]);
    }
};


export const LABEL_TAHAP: Record<string, string> = {
    listing: 'Listing',
    pencacahan: 'Pencacahan',
    pengolahan: 'Pengolahan',
};

/**
 * Rentang tanggal honor untuk sebuah tahap, dengan fallback ke kolom
 * `bulanHonor*` yang lama supaya kegiatan yang belum punya rentang tetap
 * terbaca. Sama persis dengan yang dipakai honorService.
 */
// ----------------------------- Template Surat -----------------------------

/** Harus sama dengan DEFAULT kolom di migrasi 2026-09-13-surat-bast.sql. */
export const POLA_BAST_BAWAAN = '{nomor}/BAST/{BULAN}/{ROMAWI}/{tahun}';
export const POLA_SPK_BAWAAN = '{nomor}/SPK/{BULAN}/{ROMAWI}/{tahun}';
