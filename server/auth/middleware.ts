// server/auth/middleware.ts

/**
 * Gerbang identitas untuk seluruh API.
 *
 * Satu tempat yang menentukan "siapa pemanggil ini", menggantikan kebiasaan
 * lama membaca `username` dari badan permintaan. Selama nama pengguna datang
 * dari badan permintaan, siapa pun bisa mengaku sebagai orang lain hanya dengan
 * mengetik namanya — termasuk menyetujui dokumen atau menghapus nomor surat
 * atas nama supervisor.
 *
 * Route tidak boleh lagi memercayai `req.body.username`. Pakai `req.user`.
 */

import type { Request, Response, NextFunction } from 'express';
import type { RowDataPacket } from 'mysql2';
import db from '../db';
import { verifikasiToken, RAHASIA_SESI } from './token';

export interface PenggunaPermintaan {
    id: string;
    username: string;
    namaLengkap: string;
    role: 'admin' | 'supervisor' | 'user';
    isPML: boolean;
}

// Melebarkan tipe Request Express supaya `req.user` dikenali TypeScript di
// seluruh route tanpa perlu di-cast satu per satu.
declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Express {
        interface Request {
            user?: PenggunaPermintaan;
        }
    }
}

const bacaToken = (req: Request): string | null => {
    const header = req.headers.authorization;
    if (typeof header !== 'string') return null;
    const [skema, nilai] = header.split(' ');
    if (skema?.toLowerCase() !== 'bearer' || !nilai) return null;
    return nilai;
};

/**
 * Mencari pengguna dari id di dalam token.
 *
 * Sengaja membaca database tiap permintaan, bukan memercayai peran yang
 * disimpan di token: dengan begini menurunkan peran atau menghapus akun
 * langsung berlaku, tidak menunggu tokennya kedaluwarsa.
 */
const cariPengguna = async (id: string): Promise<PenggunaPermintaan | null> => {
    const [rows] = await db.query<RowDataPacket[]>(
        'SELECT id, username, nama_lengkap, role, isPML FROM users WHERE id = ? LIMIT 1', [id]
    );
    const u = rows[0];
    if (!u) return null;
    return {
        id: u.id,
        username: u.username,
        namaLengkap: u.nama_lengkap,
        role: u.role,
        isPML: Boolean(u.isPML),
    };
};

/** Menolak permintaan tanpa token yang sah. */
export const wajibLogin = async (req: Request, res: Response, next: NextFunction) => {
    const token = bacaToken(req);
    const isi = token ? verifikasiToken(token, RAHASIA_SESI) : null;
    if (!isi) {
        // 401, bukan 403: klien memakainya untuk memaksa login ulang.
        return res.status(401).json({ message: 'Sesi tidak valid atau sudah berakhir. Silakan login kembali.' });
    }

    const pengguna = await cariPengguna(isi.sub);
    if (!pengguna) {
        return res.status(401).json({ message: 'Akun tidak ditemukan. Silakan login kembali.' });
    }

    req.user = pengguna;
    next();
};

/**
 * Membatasi route ke peran tertentu. Dipasang SETELAH `wajibLogin`.
 *
 * Ini menempatkan aturan peran di server, sejajar dengan yang selama ini hanya
 * ditegakkan di layar — tombol yang disembunyikan tidak menghentikan siapa pun
 * yang memanggil endpoint-nya langsung.
 */
export const wajibPeran = (...peran: PenggunaPermintaan['role'][]) =>
    (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Sesi tidak valid. Silakan login kembali.' });
        }
        if (!peran.includes(req.user.role)) {
            return res.status(403).json({ message: 'Anda tidak berhak melakukan tindakan ini.' });
        }
        next();
    };

/** Tim keuangan di aplikasi ini diwakili role supervisor, ditambah admin. */
export const wajibKeuangan = wajibPeran('admin', 'supervisor');

/**
 * Hanya admin.
 *
 * Dipakai untuk kelola pengguna/ketua tim/PPL master, pengaturan aplikasi, dan
 * penghapusan kegiatan — semuanya sudah admin-saja di layar (menu "Manajemen
 * Admin" hanya tampil bagi admin), tetapi sampai sekarang tidak dijaga di
 * server. Akibatnya akun berperan `user` bisa memanggil endpointnya langsung
 * dan MENAIKKAN PERANNYA SENDIRI menjadi admin — yang membatalkan seluruh
 * sistem peran ini. Sudah diuji dan terbukti bisa sebelum penjaga ini dipasang.
 */
export const wajibAdmin = wajibPeran('admin');
