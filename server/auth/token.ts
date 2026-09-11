// server/auth/token.ts

/**
 * Token sesi bertanda tangan.
 *
 * Sebelum ini, seluruh API memercayai `username` yang dikirim di badan
 * permintaan. Login memang memeriksa password, tetapi setelah itu tidak ada apa
 * pun yang membuktikan siapa pemanggilnya — jadi siapa saja yang bisa
 * menjangkau server dapat menyetujui dokumen atau menghapus nomor surat cukup
 * dengan menuliskan nama pengguna orang lain.
 *
 * Token ini yang menutup celah itu: diterbitkan sekali saat login, dilampirkan
 * di setiap permintaan, dan diverifikasi tanda tangannya di server.
 *
 * ISINYA SENGAJA HANYA `sub` (id pengguna) DAN `exp`.
 * Peran TIDAK ikut disimpan di dalam token. Kalau peran ikut, mencabut hak
 * seseorang baru berlaku setelah tokennya kedaluwarsa — orang yang baru
 * diturunkan dari supervisor masih bisa menyetujui dokumen berjam-jam. Dengan
 * hanya menyimpan id, middleware membaca peran terbaru dari database setiap
 * permintaan, sehingga perubahan peran dan penonaktifan akun langsung berlaku.
 * Biayanya satu pencarian primary key per permintaan — tidak berarti pada
 * skala aplikasi ini.
 *
 * HMAC-SHA256, bukan JWT: yang dibutuhkan hanya "payload ini benar dari server
 * dan belum kedaluwarsa". Itu 30 baris memakai `node:crypto` bawaan, tanpa
 * menambah dependensi dan tanpa membawa serta bagian JWT yang tidak dipakai.
 */

import { createHmac, timingSafeEqual, randomBytes } from 'node:crypto';

export interface IsiToken {
    /** id pengguna (users.id, pola USR###). */
    sub: string;
    /** Kedaluwarsa, detik sejak epoch. */
    exp: number;
}

/** Umur token. Cukup untuk satu hari kerja, tidak lebih. */
export const UMUR_TOKEN_DETIK = 12 * 60 * 60;

const b64url = (buf: Buffer): string =>
    buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const dariB64url = (teks: string): Buffer =>
    Buffer.from(teks.replace(/-/g, '+').replace(/_/g, '/'), 'base64');

const tandaTangan = (data: string, rahasia: string): string =>
    b64url(createHmac('sha256', rahasia).update(data).digest());

/**
 * Menerbitkan token untuk sebuah id pengguna.
 *
 * @param sekarangDetik dapat diisi di tes agar kedaluwarsa bisa diuji tanpa menunggu
 */
export const buatToken = (
    sub: string,
    rahasia: string,
    umurDetik = UMUR_TOKEN_DETIK,
    sekarangDetik = Math.floor(Date.now() / 1000),
): string => {
    const isi: IsiToken = { sub, exp: sekarangDetik + umurDetik };
    const muatan = b64url(Buffer.from(JSON.stringify(isi), 'utf8'));
    return `${muatan}.${tandaTangan(muatan, rahasia)}`;
};

/**
 * Memverifikasi token. Mengembalikan isinya bila sah, atau `null` bila tanda
 * tangannya salah, bentuknya rusak, atau sudah kedaluwarsa.
 *
 * Tidak pernah melempar: token yang tidak sah adalah keadaan yang wajar
 * (kedaluwarsa, dipalsukan), bukan kerusakan aplikasi.
 */
export const verifikasiToken = (
    token: unknown,
    rahasia: string,
    sekarangDetik = Math.floor(Date.now() / 1000),
): IsiToken | null => {
    if (typeof token !== 'string') return null;

    const pisah = token.split('.');
    if (pisah.length !== 2) return null;
    const [muatan, tanda] = pisah;
    if (!muatan || !tanda) return null;

    const diharapkan = Buffer.from(tandaTangan(muatan, rahasia), 'utf8');
    const diterima = Buffer.from(tanda, 'utf8');
    // Panjang harus dicek lebih dulu: timingSafeEqual melempar bila berbeda.
    if (diharapkan.length !== diterima.length) return null;
    if (!timingSafeEqual(diharapkan, diterima)) return null;

    let isi: IsiToken;
    try {
        isi = JSON.parse(dariB64url(muatan).toString('utf8'));
    } catch {
        return null;
    }

    if (typeof isi?.sub !== 'string' || !isi.sub) return null;
    if (typeof isi?.exp !== 'number' || isi.exp <= sekarangDetik) return null;

    return isi;
};

/**
 * Rahasia penanda tangan.
 *
 * Diambil dari `SESSION_SECRET`. Bila belum disetel, dibuat acak saat server
 * menyala dan diberi peringatan keras — TIDAK ada nilai bawaan yang ditulis di
 * dalam kode. Rahasia bawaan yang ikut masuk repo sama saja dengan tidak punya
 * tanda tangan sama sekali: siapa pun yang membaca kode bisa memalsukan token.
 *
 * Konsekuensi rahasia acak: semua orang harus login lagi setiap server
 * dinyalakan ulang. Itu memang mengganggu — dan justru itu yang mendorong
 * `SESSION_SECRET` benar-benar diisi sebelum aplikasi dipakai bersama.
 */
export const ambilRahasia = (): string => {
    const dariEnv = process.env.SESSION_SECRET;
    if (dariEnv && dariEnv.length >= 16) return dariEnv;

    if (dariEnv) {
        console.warn('[auth] SESSION_SECRET terlalu pendek (minimal 16 karakter); memakai rahasia acak.');
    } else {
        console.warn('[auth] SESSION_SECRET belum disetel di .env. Memakai rahasia acak: semua sesi akan terputus setiap server dinyalakan ulang.');
    }
    return randomBytes(32).toString('hex');
};

/**
 * Rahasia sesi aplikasi — dihitung SEKALI saat modul ini pertama dimuat.
 *
 * WAJIB dipakai bersama oleh penerbit token (routes/auth.ts) dan pemeriksanya
 * (auth/middleware.ts). Kalau masing-masing memanggil `ambilRahasia()` sendiri
 * sementara SESSION_SECRET belum disetel, keduanya mendapat rahasia acak yang
 * BERBEDA — dan tidak satu pun token hasil login akan lolos verifikasi.
 */
export const RAHASIA_SESI = ambilRahasia();
