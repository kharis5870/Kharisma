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
                role: user.role
            };
        }
    }

    // Jika user tidak ditemukan ATAU password tidak cocok, kembalikan null
    return null;
};