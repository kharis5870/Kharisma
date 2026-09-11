// server/auth/kepemilikan.ts

/**
 * Penjaga kepemilikan data.
 *
 * Gerbang peran menjawab "apakah orang ini seorang admin". Berkas ini menjawab
 * pertanyaan yang berbeda dan tidak kalah penting: "apakah kegiatan ini
 * miliknya". Tanpa itu, seorang ketua tim yang login secara sah masih bisa
 * menyunting kegiatan ketua tim lain lewat pemanggilan API langsung — perannya
 * memang sama-sama `user`, jadi gerbang peran tidak bisa membedakannya.
 *
 * Aturannya sendiri ada di `shared/hakKegiatan.ts` supaya layar dan server
 * memakai kalimat yang sama; di sini hanya pencarian datanya.
 */

import type { Request, Response, NextFunction } from 'express';
import type { RowDataPacket } from 'mysql2';
import db from '../db';
import {
    bolehMenyuntingKegiatan,
    bolehMemperbaruiProgress,
    bolehMenilaiMitra,
    PESAN_BUKAN_PEMILIK_KEGIATAN,
    PESAN_BUKAN_PML,
    PESAN_BUKAN_PENILAI,
} from '../../shared/hakKegiatan';

/**
 * Mengambil dua kolom yang menentukan kepemilikan sebuah kegiatan.
 *
 * `ketua_tim.user_id`, BUKAN `kegiatan.ketua_tim_id`: yang dibandingkan dengan
 * `users.id` adalah akun yang ditautkan ke ketua tim, dan kedua kolom itu
 * memakai ruang ID yang berbeda (USR### versus KT###).
 */
const ambilPemilik = async (kegiatanId: number) => {
    const [rows] = await db.query<RowDataPacket[]>(
        `SELECT k.createdBy_userId, kt.user_id AS ketuaTimUserId
           FROM kegiatan k
           LEFT JOIN ketua_tim kt ON kt.id = k.ketua_tim_id
          WHERE k.id = ? LIMIT 1`,
        [kegiatanId]
    );
    return rows[0] ?? null;
};

/** Kegiatan pemilik sebuah dokumen. */
const kegiatanDariDokumen = async (dokumenId: number): Promise<number | null> => {
    const [rows] = await db.query<RowDataPacket[]>(
        'SELECT kegiatanId FROM dokumen WHERE id = ? LIMIT 1', [dokumenId]
    );
    return rows[0]?.kegiatanId ?? null;
};

/**
 * Menjaga route yang mengubah sebuah kegiatan atau dokumennya.
 *
 * @param ambilKegiatanId cara menemukan id kegiatannya dari permintaan; boleh
 *   async karena sebagian route hanya membawa id dokumen dan harus mencarinya.
 */
export const wajibPemilikKegiatan = (
    ambilKegiatanId: (req: Request) => number | null | Promise<number | null>,
) => async (req: Request, res: Response, next: NextFunction) => {
    try {
        const kegiatanId = await ambilKegiatanId(req);
        if (!kegiatanId || Number.isNaN(kegiatanId)) {
            return res.status(400).json({ message: 'Kegiatan tidak dikenali.' });
        }

        const pemilik = await ambilPemilik(kegiatanId);
        if (!pemilik) {
            return res.status(404).json({ message: 'Kegiatan tidak ditemukan.' });
        }

        if (!bolehMenyuntingKegiatan(req.user!, pemilik as any)) {
            return res.status(403).json({ message: PESAN_BUKAN_PEMILIK_KEGIATAN });
        }
        next();
    } catch (error) {
        console.error('Gagal memeriksa kepemilikan kegiatan:', error);
        res.status(500).json({ message: 'Gagal memeriksa hak akses.' });
    }
};

/** Sumber id kegiatan yang dipakai route-route yang ada. */
export const dariParamId = (req: Request) => Number(req.params.id);
export const dariParamKegiatanId = (req: Request) => Number(req.params.kegiatanId);
export const dariBodyDokumen = (req: Request) => Number(req.body?.documentData?.kegiatanId);
export const dariDokumenParamId = (req: Request) => kegiatanDariDokumen(Number(req.params.id));

/** Menjaga pembaruan progres: hanya PML mitra tersebut, ditambah admin. */
export const wajibPmlMitra = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const pplId = Number(req.params.pplId);
        if (!pplId || Number.isNaN(pplId)) {
            return res.status(400).json({ message: 'Mitra tidak dikenali.' });
        }

        const [rows] = await db.query<RowDataPacket[]>(
            'SELECT pml_id FROM ppl WHERE id = ? LIMIT 1', [pplId]
        );
        if (!rows[0]) {
            return res.status(404).json({ message: 'Mitra tidak ditemukan.' });
        }

        if (!bolehMemperbaruiProgress(req.user!, rows[0] as any)) {
            return res.status(403).json({ message: PESAN_BUKAN_PML });
        }
        next();
    } catch (error) {
        console.error('Gagal memeriksa PML mitra:', error);
        res.status(500).json({ message: 'Gagal memeriksa hak akses.' });
    }
};

/**
 * Menjaga penyimpanan penilaian: hanya PML mitra tersebut, ditambah admin.
 *
 * Berbeda dari `wajibPmlMitra`, id alokasinya ada di badan permintaan, bukan
 * di URL. Baris `ppl` yang ditemukan dititipkan ke `res.locals.pplDinilai`
 * supaya route memakai `kegiatanId` dan `pml_id` DARI DATABASE — keduanya
 * dulu diterima apa adanya dari klien, sehingga penilaian bisa ditempelkan
 * ke kegiatan lain atau diatasnamakan PML lain.
 */
export const wajibPenilaiMitra = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const pplId = Number(req.body?.pplId);
        if (!pplId || Number.isNaN(pplId)) {
            return res.status(400).json({ message: 'Mitra tidak dikenali.' });
        }

        const [rows] = await db.query<RowDataPacket[]>(
            'SELECT id, kegiatanId, pml_id FROM ppl WHERE id = ? LIMIT 1', [pplId]
        );
        if (!rows[0]) {
            return res.status(404).json({ message: 'Mitra tidak ditemukan.' });
        }

        if (!bolehMenilaiMitra(req.user!, rows[0] as any)) {
            return res.status(403).json({ message: PESAN_BUKAN_PENILAI });
        }
        res.locals.pplDinilai = rows[0];
        next();
    } catch (error) {
        console.error('Gagal memeriksa penilai mitra:', error);
        res.status(500).json({ message: 'Gagal memeriksa hak akses.' });
    }
};

/**
 * Menambah dokumen: pemilik kegiatan ATAU tim keuangan.
 *
 * Tim keuangan sengaja diizinkan menambah — ada dokumen yang mereka tahu
 * diperlukan sementara ketua tim tidak. Tapi HANYA menambah: menyunting dan
 * menghapus dokumen tetap milik pemilik kegiatan, supaya tim keuangan tidak
 * bisa mengubah isi yang nanti ia periksa sendiri.
 */
export const wajibBolehMenambahDokumen = (
    ambilKegiatanId: (req: Request) => number | null | Promise<number | null>,
) => async (req: Request, res: Response, next: NextFunction) => {
    const peran = req.user?.role;
    if (peran === 'admin' || peran === 'supervisor') return next();
    return wajibPemilikKegiatan(ambilKegiatanId)(req, res, next);
};

/**
 * Menyunting sebuah dokumen: pemilik kegiatan, ATAU tim keuangan bila dokumen
 * itu memang bertanda `penanggungJawab = 'keuangan'`.
 *
 * Pengecualian yang sempit ini diperlukan karena tim keuangan mengisi sendiri
 * link dokumen yang menjadi tanggung jawabnya, dari halaman View Documents.
 * Tanpa itu, penjaga kepemilikan menutup fitur tersebut — dan memang sempat
 * menutupnya sampai ketahuan saat diuji.
 *
 * Sengaja TIDAK berlaku untuk menghapus: tim keuangan mengisi dokumennya, tapi
 * tidak boleh menghilangkan dokumen dari daftar kelengkapan kegiatan.
 */
export const wajibBolehMenyuntingDokumen = async (
    req: Request, res: Response, next: NextFunction,
) => {
    const peran = req.user?.role;
    if (peran === 'admin' || peran === 'supervisor') {
        const [rows] = await db.query<RowDataPacket[]>(
            'SELECT penanggungJawab FROM dokumen WHERE id = ? LIMIT 1', [Number(req.params.id)]
        );
        if (rows[0]?.penanggungJawab === 'keuangan') return next();
    }
    return wajibPemilikKegiatan(dariDokumenParamId)(req, res, next);
};

/**
 * Mengelola dokumen (ganti nama / hapus): pemilik kegiatan ATAU tim keuangan.
 *
 * Tim keuangan diizinkan karena ia yang mendaftarkan dokumen tambahan, dan
 * harus bisa membetulkan atau membatalkannya bila keliru. Penghapusannya
 * dikonfirmasi di layar, dan tercatat di riwayat kegiatan.
 */
export const wajibBolehMengelolaDokumen = (
    req: Request, res: Response, next: NextFunction,
) => {
    const peran = req.user?.role;
    if (peran === 'admin' || peran === 'supervisor') return next();
    return wajibPemilikKegiatan(dariDokumenParamId)(req, res, next);
};
