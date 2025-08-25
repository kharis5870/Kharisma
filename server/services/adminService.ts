// server/services/adminService.ts

import { RowDataPacket, OkPacket } from 'mysql2';
import db from '../db';
import { UserData, KetuaTimData, PPLAdminData } from '@shared/api';

// --- User Management --- (Tidak ada perubahan)
export const getAllUsers = async (): Promise<UserData[]> => {
    const [rows] = await db.query<RowDataPacket[]>('SELECT id, username, nama_lengkap AS namaLengkap, role FROM users ORDER BY nama_lengkap ASC');
    return rows as UserData[];
};
export const createUser = async (user: UserData): Promise<UserData> => {
    const { id, username, password, namaLengkap, role } = user;
    await db.execute('INSERT INTO users (id, username, password, nama_lengkap, role) VALUES (?, ?, ?, ?, ?)', [id, username, password, namaLengkap, role]);
    return user;
};
export const updateUser = async (id: string, user: UserData): Promise<UserData> => {
    const { username, password, namaLengkap, role } = user;
    if (password) {
        await db.execute('UPDATE users SET username = ?, password = ?, nama_lengkap = ?, role = ? WHERE id = ?', [username, password, namaLengkap, role, id]);
    } else {
        await db.execute('UPDATE users SET username = ?, nama_lengkap = ?, role = ? WHERE id = ?', [username, namaLengkap, role, id]);
    }
    return user;
};
export const deleteUser = async (id: string): Promise<boolean> => {
    const [result] = await db.execute<OkPacket>('DELETE FROM users WHERE id = ?', [id]);
    return result.affectedRows > 0;
};

// --- Ketua Tim Management --- (Tidak ada perubahan)
export const getAllKetuaTim = async (): Promise<KetuaTimData[]> => {
    const [rows] = await db.query<RowDataPacket[]>('SELECT id, nama_ketua AS nama, nip FROM ketua_tim ORDER BY nama_ketua ASC');
    return rows as KetuaTimData[];
};
export const createKetuaTim = async (data: KetuaTimData): Promise<KetuaTimData> => {
    const { id, nama, nip } = data;
    await db.execute('INSERT INTO ketua_tim (id, nama_ketua, nip) VALUES (?, ?, ?)', [id, nama, nip]);
    return data;
};
export const updateKetuaTim = async (id: string, data: KetuaTimData): Promise<KetuaTimData> => {
    const { nama, nip } = data;
    await db.execute('UPDATE ketua_tim SET nama_ketua = ?, nip = ? WHERE id = ?', [nama, nip, id]);
    return data;
};
export const deleteKetuaTim = async (id: string): Promise<boolean> => {
    const [result] = await db.execute<OkPacket>('DELETE FROM ketua_tim WHERE id = ?', [id]);
    return result.affectedRows > 0;
};

// --- PPL Management ---
export const getAllPPLAdmin = async (): Promise<PPLAdminData[]> => {
    // PERBAIKAN: Menambahkan JOIN dan GROUP_CONCAT untuk mengambil nama kegiatan
    const query = `
        SELECT 
            pm.id, 
            pm.namaPPL, 
            pm.alamat, 
            pm.noTelepon,
            COUNT(DISTINCT p.kegiatanId) AS totalKegiatan,
            GROUP_CONCAT(DISTINCT k.namaKegiatan SEPARATOR ';;') as kegiatanNames
        FROM ppl_master pm
        LEFT JOIN ppl p ON pm.id = p.ppl_master_id
        LEFT JOIN kegiatan k ON p.kegiatanId = k.id
        GROUP BY pm.id, pm.namaPPL, pm.alamat, pm.noTelepon
        ORDER BY pm.namaPPL ASC
    `;
    const [rows] = await db.query<RowDataPacket[]>(query);
    // PERBAIKAN: Memproses kegiatanNames menjadi array
    return rows.map(row => ({
        ...row,
        kegiatanNames: row.kegiatanNames ? row.kegiatanNames.split(';;') : []
    })) as PPLAdminData[];
};
export const createPPLAdmin = async (data: PPLAdminData): Promise<PPLAdminData> => {
    const { id, namaPPL, alamat, noTelepon } = data;
    await db.execute('INSERT INTO ppl_master (id, namaPPL, alamat, noTelepon) VALUES (?, ?, ?, ?)', [id, namaPPL, alamat, noTelepon]);
    return data;
};
export const updatePPLAdmin = async (id: string, data: PPLAdminData): Promise<PPLAdminData> => {
    const { namaPPL, alamat, noTelepon } = data;
    await db.execute('UPDATE ppl_master SET namaPPL = ?, alamat = ?, noTelepon = ? WHERE id = ?', [namaPPL, alamat, noTelepon, id]);
    return data;
};
export const deletePPLAdmin = async (id: string): Promise<boolean> => {
    const [result] = await db.execute<OkPacket>('DELETE FROM ppl_master WHERE id = ?', [id]);
    return result.affectedRows > 0;
};