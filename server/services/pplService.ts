import { RowDataPacket, OkPacket } from 'mysql2';
import db from '../db';
import { PPLMaster } from '@shared/api';

interface PPLMasterPacket extends PPLMaster, RowDataPacket {}

export const getAllMasterPPL = async (): Promise<PPLMaster[]> => {
    const [rows] = await db.query<PPLMasterPacket[]>('SELECT * FROM ppl_master ORDER BY namaPPL ASC');
    return rows;
};

export const createMasterPPL = async (ppl: PPLMaster): Promise<PPLMaster> => {
    const { id, namaPPL } = ppl;
    const query = 'INSERT INTO ppl_master (id, namaPPL) VALUES (?, ?)';
    await db.execute(query, [id, namaPPL]);
    return ppl;
};

export const updateMasterPPL = async (originalId: string, pplData: PPLMaster): Promise<PPLMaster> => {
    const { id, namaPPL } = pplData;
    const query = 'UPDATE ppl_master SET id = ?, namaPPL = ? WHERE id = ?';
    await db.execute(query, [id, namaPPL, originalId]);
    return pplData;
};

export const deleteMasterPPL = async (id: string): Promise<boolean> => {
    const query = 'DELETE FROM ppl_master WHERE id = ?';
    const [result] = await db.execute<OkPacket>(query, [id]);
    return result.affectedRows > 0;
};
