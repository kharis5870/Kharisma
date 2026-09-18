// server/routes/utilRoute.ts

/**
 * Perkakas bersama untuk route Express.
 *
 * Berkas ini BUKAN router — tidak dipasang di `server/index.ts`. Isinya hal-hal
 * yang sebelumnya ditulis ulang di beberapa route dan mulai berbeda sedikit
 * demi sedikit.
 *
 * PENTING: hanya boleh mengimpor nilai runtime lewat jalur relatif
 * (`../../shared/...`), bukan `@shared/...` — alias itu tidak tersedia saat
 * `vite.config.ts` memuat kode server lewat Node.
 */

import type { RequestHandler, Response } from 'express';
import { pesanGalatSql, statusGalatSql } from '../../shared/pesanGalatSql';

/**
 * Membungkus handler async supaya galatnya diteruskan ke penangan galat Express.
 *
 * Express 4 TIDAK menangkap promise yang ditolak. Tanpa pembungkus ini, satu
 * galat database di handler tanpa try/catch (mis. menambah pengguna dengan id
 * yang sudah ada) menjadi unhandled rejection — dan Node 15+ menghentikan
 * seluruh proses server karenanya. Semua pengguna terputus, bukan hanya
 * permintaan yang gagal.
 */
export const tangani = (fn: RequestHandler): RequestHandler =>
    (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };

/**
 * Status dan pesan yang aman dikirim ke layar untuk sebuah galat.
 *
 * - Galat yang sengaja dilempar aplikasi dengan `statusCode` → apa adanya.
 * - Galat yang punya `code` (galat MySQL seperti ER_DUP_ENTRY, atau galat
 *   sistem seperti ECONNREFUSED) → pesannya DISEMBUNYIKAN. Teks aslinya memuat
 *   nama database, tabel, constraint, atau alamat server; yang dikirim adalah
 *   kalimat dari `pesanGalatSql`, dan kesalahan masukan dibalas 400.
 * - Galat biasa tanpa `code` (mis. `throw new Error('Dokumen tidak ditemukan.')`
 *   di service) → pesannya tetap diteruskan dengan status 500, sama seperti
 *   sebelumnya. Pesan-pesan itu ditulis untuk dibaca pengguna.
 */
export const galatUntukKlien = (error: any, bawaan: string): { status: number; message: string } => {
    if (error?.statusCode) {
        return { status: error.statusCode, message: error.message || bawaan };
    }
    if (error?.code) {
        return { status: statusGalatSql(error.code), message: pesanGalatSql(error.code, bawaan) };
    }
    return { status: 500, message: error?.message || bawaan };
};

/** Mengirim balasan galat memakai aturan `galatUntukKlien`. */
export const kirimGalat = (res: Response, error: any, bawaan: string) => {
    const { status, message } = galatUntukKlien(error, bawaan);
    return res.status(status).json({ message });
};

/** Tanggal berbentuk yyyy-MM-dd, bentuk yang dikirim semua pemilih tanggal. */
export const FORMAT_TANGGAL = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Periode opsional dari query string (`tanggalMulai` & `tanggalSelesai`), untuk
 * menyaring daftar menurut rentang honornya.
 *
 * Dianggap TIDAK ADA bila salah satu tanggalnya hilang atau bentuknya tidak
 * sah. Menyaring dengan tanggal yang separuh benar akan menghasilkan daftar
 * yang salah tanpa ada yang menyadarinya — lebih baik menampilkan semuanya.
 */
export const bacaPeriodeOpsional = (query: any): { mulai: string; selesai: string } | undefined => {
    const { tanggalMulai, tanggalSelesai } = query;
    if (!FORMAT_TANGGAL.test(tanggalMulai || '') || !FORMAT_TANGGAL.test(tanggalSelesai || '')) return undefined;
    if (tanggalMulai > tanggalSelesai) return undefined;
    return { mulai: tanggalMulai as string, selesai: tanggalSelesai as string };
};
