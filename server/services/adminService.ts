// server/services/adminService.ts

import { RowDataPacket, OkPacket } from 'mysql2';
import db from '../db';
import { UserData, KetuaTimData, PPLAdminData } from '@shared/api';
import bcrypt from 'bcryptjs'; 
import * as pplService from './pplService';

const SALT_ROUNDS = 10;

// --- User Management (Tidak ada perubahan) ---
export const getAllUsers = async (): Promise<UserData[]> => {
    const [rows] = await db.query<RowDataPacket[]>('SELECT id, username, nama_lengkap AS namaLengkap, role, isPML FROM users ORDER BY nama_lengkap ASC');
    return rows as UserData[];
};

export const createUser = async (user: UserData): Promise<UserData> => {
    const { id, username, password, namaLengkap, role, isPML } = user;
    if (!password) throw new Error("Password is required for new user");
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    await db.execute('INSERT INTO users (id, username, password, nama_lengkap, role, isPML) VALUES (?, ?, ?, ?, ?, ?)', [id, username, hashedPassword, namaLengkap, role, isPML || false]);
    return { ...user, password: '' };
};

export const updateUser = async (id: string, user: UserData): Promise<UserData> => {
    const { username, password, namaLengkap, role, isPML } = user;
    if (password) {
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
        await db.execute('UPDATE users SET username = ?, password = ?, nama_lengkap = ?, role = ?, isPML = ? WHERE id = ?', [username, hashedPassword, namaLengkap, role, isPML || false, id]);
    } else {
        await db.execute('UPDATE users SET username = ?, nama_lengkap = ?, role = ?, isPML = ? WHERE id = ?', [username, namaLengkap, role, isPML || false, id]);
    }
    return { ...user, password: '' };
};

export const deleteUser = async (id: string): Promise<boolean> => {
    const [result] = await db.execute<OkPacket>('DELETE FROM users WHERE id = ?', [id]);
    return result.affectedRows > 0;
};

export const getAllPMLs = async (): Promise<UserData[]> => {
    const [rows] = await db.query<RowDataPacket[]>("SELECT id, nama_lengkap AS namaLengkap FROM users WHERE isPML = TRUE ORDER BY nama_lengkap ASC");
    return rows as UserData[];
};

// --- Ketua Tim Management (Tidak ada perubahan) ---
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


// =================================================================
// START OF MODIFICATION: Fungsi getAllPPLAdmin diperbarui
// =================================================================
export const getAllPPLAdmin = async (): Promise<PPLAdminData[]> => {
    return pplService.getPplAdminData();
};

export const createPPLAdmin = async (data: PPLAdminData): Promise<PPLAdminData> => {
    return pplService.createMasterPPL(data);
};

export const updatePPLAdmin = async (id: string, data: PPLAdminData): Promise<PPLAdminData> => {
    return pplService.updateMasterPPL(id, data);
};

export const deletePPLAdmin = async (id: string): Promise<boolean> => {
    return pplService.deleteMasterPPL(id);
};