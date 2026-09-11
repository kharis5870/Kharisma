// server/services/authService.ts

import { RowDataPacket } from 'mysql2';
import db from '../db';
import { UserData } from '@shared/api';
import bcrypt from 'bcryptjs';

export const authenticateUser = async (username: string, password: string): Promise<UserData | null> => {
    // Langkah 1: Ambil HANYA user berdasarkan username
    const query = 'SELECT * FROM users WHERE username = ?';
    const [rows] = await db.query<RowDataPacket[]>(query, [username]);

    if (rows.length > 0) {
        const user = rows[0];

        // Langkah 2: Bandingkan password yang diinput dengan hash di database
        const match = await bcrypt.compare(password, user.password);

        if (match) {
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
): Promise<{ ok: boolean; pesan?: string }> => {
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
    await db.query('UPDATE users SET password = ? WHERE id = ?', [hashBaru, rows[0].id]);

    return { ok: true };
};