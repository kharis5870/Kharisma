// server/services/adminService.ts

import { RowDataPacket, OkPacket } from 'mysql2';
import db from '../db';
import { UserData, KetuaTimData, PPLAdminData } from '@shared/api';
import bcrypt from 'bcryptjs'; 

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
    const query = `
        SELECT 
            pm.id, 
            pm.namaPPL, 
            pm.alamat, 
            pm.noTelepon,
            COUNT(DISTINCT CONCAT(p.kegiatanId, '-', p.tahap)) AS totalKegiatan,
            GROUP_CONCAT(DISTINCT 
                CASE 
                    WHEN p.tahap = 'listing' THEN CONCAT(k.namaKegiatan, ' (Listing)')
                    WHEN p.tahap = 'pencacahan' THEN CONCAT(k.namaKegiatan, ' (Pencacahan)')
                    WHEN p.tahap = 'pengolahan-analisis' THEN CONCAT(k.namaKegiatan, ' (Pengolahan)')
                    ELSE k.namaKegiatan 
                END 
            SEPARATOR ';;') as kegiatanNames
        FROM ppl_master pm
        LEFT JOIN ppl p ON pm.id = p.ppl_master_id
        LEFT JOIN kegiatan k ON p.kegiatanId = k.id
        GROUP BY pm.id, pm.namaPPL, pm.alamat, pm.noTelepon
        ORDER BY pm.namaPPL ASC
    `;
    const [rows] = await db.query<RowDataPacket[]>(query);
    return rows.map(row => ({
        ...row,
        kegiatanNames: row.kegiatanNames ? row.kegiatanNames.split(';;') : []
    })) as PPLAdminData[];
};
// =================================================================
// END OF MODIFICATION: Fungsi getAllPPLAdmin
// =================================================================

// --- PPL Master Management (Tidak ada perubahan) ---
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