// server/services/adminService.ts

import { RowDataPacket, OkPacket } from 'mysql2';
import db from '../db';
import { UserData, KetuaTimData, PPLAdminData } from '@shared/api';
import bcrypt from 'bcryptjs'; 
import * as pplService from './pplService';
// Jalur relatif, BUKAN @shared — nilai runtime di kode server.
import { periksaPassword } from '../../shared/aturanPassword';

const SALT_ROUNDS = 10;

// --- User Management (Tidak ada perubahan) ---
export const getAllUsers = async (): Promise<UserData[]> => {
    const [rows] = await db.query<RowDataPacket[]>('SELECT id, username, nama_lengkap AS namaLengkap, role, isPML FROM users ORDER BY nama_lengkap ASC');
    return rows as UserData[];
};

export const createUser = async (user: UserData): Promise<UserData> => {
    const { id, username, password, namaLengkap, role, isPML } = user;
    // Aturan password ditegakkan DI SERVER, bukan hanya di form Manajemen
    // Admin: permintaan yang dikirim langsung ke API tidak melewati form.
    const galatPassword = periksaPassword(password, username);
    if (galatPassword || !password) {
        throw Object.assign(new Error(galatPassword ?? 'Password wajib diisi.'), { statusCode: 400 });
    }
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    await db.execute('INSERT INTO users (id, username, password, nama_lengkap, role, isPML) VALUES (?, ?, ?, ?, ?, ?)', [id, username, hashedPassword, namaLengkap, role, isPML || false]);
    return { ...user, password: '' };
};

export const updateUser = async (id: string, user: UserData): Promise<UserData> => {
    const { username, password, namaLengkap, role, isPML } = user;
    if (password) {
        const galatPassword = periksaPassword(password, username);
        if (galatPassword) throw Object.assign(new Error(galatPassword), { statusCode: 400 });
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
        // tokenVersi naik: password yang direset admin mencabut semua sesi
        // yang masih terbuka dengan password lama.
        await db.execute('UPDATE users SET username = ?, password = ?, tokenVersi = tokenVersi + 1, nama_lengkap = ?, role = ?, isPML = ? WHERE id = ?', [username, hashedPassword, namaLengkap, role, isPML || false, id]);
    } else {
        await db.execute('UPDATE users SET username = ?, nama_lengkap = ?, role = ?, isPML = ? WHERE id = ?', [username, namaLengkap, role, isPML || false, id]);
    }
    return { ...user, password: '' };
};

/**
 * Menghapus akun — DITOLAK bila akun itu masih dipakai sebagai PML atau
 * ditautkan ke ketua tim.
 *
 * `ppl.pml_id` tidak punya foreign key. Menghapus akun PML yang masih
 * mengawasi mitra meninggalkan mitra "yatim": kolom PML-nya menunjuk akun
 * yang tidak ada, tidak ada PML yang bisa memperbarui progresnya (hanya
 * admin), dan jumlahnya diam-diam hilang dari Daftar PML. Tautan ketua tim
 * memang SET NULL, tetapi akibatnya ketua tim itu berhenti menerima
 * notifikasi kegiatan timnya tanpa ada yang tahu.
 */
export const deleteUser = async (id: string): Promise<boolean> => {
    const [[pakai]] = await db.query<RowDataPacket[]>(
        `SELECT (SELECT COUNT(*) FROM ppl WHERE pml_id = ?) AS alokasi,
                (SELECT COUNT(DISTINCT kegiatanId) FROM ppl WHERE pml_id = ?) AS kegiatan,
                (SELECT GROUP_CONCAT(nama_ketua ORDER BY nama_ketua SEPARATOR ', ') FROM ketua_tim WHERE user_id = ?) AS ketuaTim`,
        [id, id, id]);
    const alasan: string[] = [];
    const langkah: string[] = [];
    if (Number(pakai.alokasi) > 0) {
        alasan.push(`masih menjadi PML untuk ${pakai.alokasi} alokasi mitra di ${pakai.kegiatan} kegiatan`);
        langkah.push('pindahkan mitra tersebut ke PML lain lewat Edit Kegiatan');
    }
    if (pakai.ketuaTim) {
        alasan.push(`masih ditautkan ke ketua tim ${pakai.ketuaTim}`);
        langkah.push('lepaskan tautannya di tab Ketua Tim');
    }
    if (alasan.length > 0) {
        throw Object.assign(
            new Error(`User ini tidak bisa dihapus karena ${alasan.join(' dan ')}. Sebelum menghapus, ${langkah.join(', lalu ')}.`),
            { statusCode: 409 });
    }

    const [result] = await db.execute<OkPacket>('DELETE FROM users WHERE id = ?', [id]);
    return result.affectedRows > 0;
};

export const getAllPMLs = async (): Promise<UserData[]> => {
    const [rows] = await db.query<RowDataPacket[]>("SELECT id, nama_lengkap AS namaLengkap FROM users WHERE isPML = TRUE ORDER BY nama_lengkap ASC");
    return rows as UserData[];
};

// --- Ketua Tim Management (Tidak ada perubahan) ---
export const getAllKetuaTim = async (): Promise<KetuaTimData[]> => {
    const [rows] = await db.query<RowDataPacket[]>(`SELECT kt.id, kt.nama_ketua AS nama, kt.nip, kt.tim, kt.user_id AS userId,
                 u.nama_lengkap AS namaUser
            FROM ketua_tim kt
            LEFT JOIN users u ON u.id = kt.user_id
           ORDER BY kt.nama_ketua ASC`);
    return rows as KetuaTimData[];
};
export const createKetuaTim = async (data: KetuaTimData): Promise<KetuaTimData> => {
    const { id, nama, nip, tim, userId } = data;
    await db.execute('INSERT INTO ketua_tim (id, nama_ketua, nip, tim, user_id) VALUES (?, ?, ?, ?, ?)', [id, nama, nip, tim || null, userId || null]);
    return data;
};
export const updateKetuaTim = async (id: string, data: KetuaTimData): Promise<KetuaTimData> => {
    const { nama, nip, tim, userId } = data;
    await db.execute('UPDATE ketua_tim SET nama_ketua = ?, nip = ?, tim = ?, user_id = ? WHERE id = ?', [nama, nip, tim || null, userId || null, id]);
    return data;
};
export const deleteKetuaTim = async (id: string): Promise<boolean> => {
    const [result] = await db.execute<OkPacket>('DELETE FROM ketua_tim WHERE id = ?', [id]);
    return result.affectedRows > 0;
};


// =================================================================
// START OF MODIFICATION: Fungsi getAllPPLAdmin diperbarui
// =================================================================
export const getAllPPLAdmin = async (
    periode?: pplService.PeriodeFilter,
): Promise<PPLAdminData[]> => {
    return pplService.getPplAdminData(periode);
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