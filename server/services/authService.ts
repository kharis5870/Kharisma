// server/services/authService.ts

import { RowDataPacket } from 'mysql2';
import db from '../db';
import { UserData } from '@shared/api';
import bcrypt from 'bcryptjs';

/**
 * Hash pengganti untuk username yang tidak ada.
 *
 * Tanpa ini, username yang tidak terdaftar dijawab SEKETIKA sementara username
 * yang ada harus menunggu bcrypt (~70 ms). Selisih waktu itu cukup untuk
 * mengetahui username mana yang benar-benar ada tanpa tahu password-nya.
 * Membandingkan dengan hash tiruan membuat kedua jalur sama lamanya.
 */
const BIAYA_HASH = 10;
const HASH_TIRUAN = bcrypt.hashSync('kharisma-hash-tiruan', BIAYA_HASH);

/**
 * Menulis ulang hash lama yang biayanya berbeda dari standar aplikasi.
 *
 * Data awal memuat akun dengan hash cost 12. Membandingkannya ~4× lebih lambat
 * daripada akun lain dan daripada username yang tidak ada (hash tiruan cost 10),
 * sehingga waktu jawab membocorkan bahwa username itu ada — terbukti: 396 ms vs
 * 90 ms. Dijalankan hanya setelah password terbukti benar; password-nya sendiri
 * tidak berubah, jadi versi token tidak dinaikkan.
 */
const samakanBiayaHash = async (id: string, password: string, hashLama: string) => {
    if (bcrypt.getRounds(hashLama) === BIAYA_HASH) return;
    try {
        await db.query('UPDATE users SET password = ? WHERE id = ?', [await bcrypt.hash(password, BIAYA_HASH), id]);
    } catch (error) {
        // Gagal menulis ulang tidak boleh menggagalkan login yang sah.
        console.error('[auth] Gagal menyamakan biaya hash:', error);
    }
};

export const authenticateUser = async (username: string, password: string): Promise<UserData | null> => {
    // Langkah 1: Ambil HANYA user berdasarkan username
    const query = 'SELECT * FROM users WHERE username = ?';
    const [rows] = await db.query<RowDataPacket[]>(query, [username]);
    const user = rows[0];

    // Langkah 2: Bandingkan password yang diinput dengan hash di database —
    // SELALU dijalankan, juga saat username tidak ada (lihat HASH_TIRUAN).
    const match = await bcrypt.compare(password, user?.password ?? HASH_TIRUAN);

    if (user) {
        if (match) {
            await samakanBiayaHash(user.id, password, user.password);
            // Jika cocok, kembalikan data user TANPA password hash
            return {
                id: user.id,
                username: user.username,
                namaLengkap: user.nama_lengkap, // Sesuaikan dengan nama kolom Anda
                role: user.role,
                // isPML sebelumnya tidak pernah ikut, sehingga user.isPML selalu
                // undefined di klien dan seluruh aplikasi terpaksa menyiasatinya
                // dengan membandingkan id ke ppl.pml_id.
                isPML: Boolean(user.isPML),
            };
        }
    }

    // Jika user tidak ditemukan ATAU password tidak cocok, kembalikan null
    return null;
};

/**
 * Ganti password sendiri.
 *
 * Sengaja TIDAK memakai ulang `updateUser` milik admin: endpoint itu menulis
 * password baru tanpa meminta password lama, jadi memakainya di sini akan
 * membuat siapa pun bisa mengganti password orang lain.
 */
export const gantiPassword = async (
    username: string,
    passwordLama: string,
    passwordBaru: string,
): Promise<{ ok: boolean; pesan?: string; userId?: string; tokenVersi?: number }> => {
    const [rows] = await db.query<RowDataPacket[]>(
        'SELECT id, password FROM users WHERE username = ?',
        [username],
    );

    if (rows.length === 0) {
        return { ok: false, pesan: 'Pengguna tidak ditemukan.' };
    }

    const cocok = await bcrypt.compare(passwordLama, rows[0].password);
    if (!cocok) {
        return { ok: false, pesan: 'Password lama salah.' };
    }

    const hashBaru = await bcrypt.hash(passwordBaru, 10);
    // tokenVersi naik: semua sesi lama akun ini — termasuk di perangkat lain
    // yang mungkin lupa logout — langsung ditolak. Route membalas dengan token
    // versi baru untuk sesi yang sedang dipakai.
    await db.query('UPDATE users SET password = ?, tokenVersi = tokenVersi + 1 WHERE id = ?', [hashBaru, rows[0].id]);

    return { ok: true, userId: rows[0].id, tokenVersi: await versiTokenPengguna(rows[0].id) };
};

/** Versi token akun saat ini (lihat `users.tokenVersi` dan auth/token.ts). */
export const versiTokenPengguna = async (id: string): Promise<number> => {
    const [rows] = await db.query<RowDataPacket[]>('SELECT tokenVersi FROM users WHERE id = ?', [id]);
    return Number(rows[0]?.tokenVersi) || 0;
};