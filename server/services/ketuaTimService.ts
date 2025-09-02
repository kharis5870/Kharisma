import { RowDataPacket } from 'mysql2';
import db from '../db';
import { KetuaTim } from '@shared/api'; 

interface KetuaTimPacket extends KetuaTim, RowDataPacket {}

export const getAllKetuaTim = async (): Promise<KetuaTim[]> => {
    const [rows] = await db.query<KetuaTimPacket[]>('SELECT id, nama_ketua AS namaKetua, nip FROM ketua_tim ORDER BY nama_ketua ASC');
    return rows;
};
