// server/services/settingsService.ts
import db from '../db';
import { RowDataPacket } from 'mysql2';

// Fungsi untuk mengambil satu nilai pengaturan dari database
export const getSetting = async (key: string, defaultValue: string): Promise<string> => {
    const query = 'SELECT setting_value FROM system_settings WHERE setting_key = ?';
    const [rows] = await db.query<RowDataPacket[]>(query, [key]);

    if (rows.length > 0) {
        return rows[0].setting_value;
    }
    return defaultValue;
};

export const updateSetting = async (key: string, value: string): Promise<boolean> => {
    const query = `
        INSERT INTO system_settings (setting_key, setting_value) VALUES (?, ?)
        ON DUPLICATE KEY UPDATE setting_value = ?
    `;
    const [result] = await db.execute<any>(query, [key, value, value]);
    return result.affectedRows > 0;
};
