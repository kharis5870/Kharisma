// server/services/authService.ts

import { RowDataPacket } from 'mysql2';
import db from '../db';
import { UserData } from '@shared/api';

// Fungsi untuk mencari user berdasarkan username dan password
export const authenticateUser = async (username: string, password: string): Promise<UserData | null> => {
    // Di aplikasi production, password harus di-hash dan diverifikasi, bukan perbandingan teks biasa.
    const query = 'SELECT id, username, nama_lengkap AS namaLengkap, role FROM users WHERE username = ? AND password = ?';
    const [rows] = await db.query<RowDataPacket[]>(query, [username, password]);

    if (rows.length > 0) {
        return rows[0] as UserData;
    }
    return null;
};