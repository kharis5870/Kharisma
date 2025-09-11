// Di dalam file: server/services/alamatService.ts
import db from '../db';
import { RowDataPacket } from 'mysql2';

export const getAllKecamatan = async () => {
    const [rows] = await db.query<RowDataPacket[]>('SELECT id, nama FROM kecamatan ORDER BY nama ASC');
    return rows;
};

export const getDesaByKecamatan = async (kecamatanId: number) => {
    const [rows] = await db.query<RowDataPacket[]>('SELECT id, nama FROM desa WHERE kecamatan_id = ? ORDER BY nama ASC', [kecamatanId]);
    return rows;
};