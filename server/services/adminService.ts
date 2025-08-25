import { RowDataPacket, OkPacket } from 'mysql2';
import db from '../db';
import { UserData, KetuaTimData, PPLAdminData } from '@shared/api';

// --- User Management ---
export const getAllUsers = async (): Promise<UserData[]> => {
    // Perbaikan: Menggunakan nama kolom 'nama_lengkap' dari database
    const [rows] = await db.query<RowDataPacket[]>('SELECT id, username, nama_lengkap AS namaLengkap, role FROM users ORDER BY nama_lengkap ASC');
    return rows as UserData[];
};
export const createUser = async (user: UserData): Promise<UserData> => {
    // Di aplikasi nyata, password harus di-hash! Contoh: bcrypt.hash(user.password, 10)
    const { id, username, password, namaLengkap, role } = user;
    // Perbaikan: Menggunakan nama kolom 'nama_lengkap' saat INSERT
    await db.execute('INSERT INTO users (id, username, password, nama_lengkap, role) VALUES (?, ?, ?, ?, ?)', [id, username, password, namaLengkap, role]);
    return user;
};
export const updateUser = async (originalId: string, user: UserData): Promise<UserData> => {
    const { id, username, password, namaLengkap, role } = user;
    // Perbaikan: Menggunakan nama kolom 'nama_lengkap' saat UPDATE
    await db.execute('UPDATE users SET id = ?, username = ?, password = ?, nama_lengkap = ?, role = ? WHERE id = ?', [id, username, password, namaLengkap, role, originalId]);
    return user;
};
export const deleteUser = async (id: string): Promise<boolean> => {
    const [result] = await db.execute<OkPacket>('DELETE FROM users WHERE id = ?', [id]);
    return result.affectedRows > 0;
};

// --- Ketua Tim Management ---
export const getAllKetuaTim = async (): Promise<KetuaTimData[]> => {
    const [rows] = await db.query<RowDataPacket[]>('SELECT id, nama_ketua AS nama, nip FROM ketua_tim ORDER BY nama_ketua ASC');
    return rows as KetuaTimData[];
};
export const createKetuaTim = async (data: KetuaTimData): Promise<KetuaTimData> => {
    const { id, nama, nip } = data;
    await db.execute('INSERT INTO ketua_tim (id, nama_ketua, nip) VALUES (?, ?, ?)', [id, nama, nip]);
    return data;
};
export const updateKetuaTim = async (originalId: string, data: KetuaTimData): Promise<KetuaTimData> => {
    const { id, nama, nip } = data;
    await db.execute('UPDATE ketua_tim SET id = ?, nama_ketua = ?, nip = ? WHERE id = ?', [id, nama, nip, originalId]);
    return data;
};
export const deleteKetuaTim = async (id: string): Promise<boolean> => {
    const [result] = await db.execute<OkPacket>('DELETE FROM ketua_tim WHERE id = ?', [id]);
    return result.affectedRows > 0;
};

// --- PPL Management ---
export const getAllPPLAdmin = async (): Promise<PPLAdminData[]> => {
    const query = `
        SELECT 
            pm.id, 
            pm.namaPPL, 
            pm.alamat, 
            pm.noTelepon,
            COUNT(p.kegiatanId) AS totalKegiatan
        FROM ppl_master pm
        LEFT JOIN ppl p ON pm.id = p.ppl_master_id
        GROUP BY pm.id, pm.namaPPL, pm.alamat, pm.noTelepon
        ORDER BY pm.namaPPL ASC
    `;
    const [rows] = await db.query<RowDataPacket[]>(query);
    return rows as PPLAdminData[];
};
export const createPPLAdmin = async (data: PPLAdminData): Promise<PPLAdminData> => {
    const { id, namaPPL, alamat, noTelepon } = data;
    await db.execute('INSERT INTO ppl_master (id, namaPPL, alamat, noTelepon) VALUES (?, ?, ?, ?)', [id, namaPPL, alamat, noTelepon]);
    return data;
};
export const updatePPLAdmin = async (originalId: string, data: PPLAdminData): Promise<PPLAdminData> => {
    const { id, namaPPL, alamat, noTelepon } = data;
    await db.execute('UPDATE ppl_master SET id = ?, namaPPL = ?, alamat = ?, noTelepon = ? WHERE id = ?', [id, namaPPL, alamat, noTelepon, originalId]);
    return data;
};
export const deletePPLAdmin = async (id: string): Promise<boolean> => {
    const [result] = await db.execute<OkPacket>('DELETE FROM ppl_master WHERE id = ?', [id]);
    return result.affectedRows > 0;
};
