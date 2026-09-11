// server/services/honorService.ts

import { RowDataPacket } from 'mysql2';
import db from '../db';
import { PPLHonorData } from '@shared/api';
import { getSetting } from './settingsService';
// Jalur relatif, BUKAN '@shared/...': alias itu tidak tersedia saat
// vite.config.ts memuat kode server lewat Node, dan ini nilai runtime.
import { bulanDilalui } from '../../shared/pembebananHonor';

interface HonorRowResult extends RowDataPacket {
    id: string;
    nama: string;
    kegiatanId: number;
    namaKegiatan: string;
    tahap: 'listing' | 'pencacahan' | 'pengolahan-analisis';
    besaranHonor: number;
    bulanPembebanan: string | null;
}

/**
 * Tanggal mulai/selesai honor untuk sebuah tahap, dengan fallback ke kolom
 * `bulanHonor*` yang lama. Fallback ini menjaga baris yang belum ter-backfill
 * (atau kegiatan lama yang hanya punya bulan) tetap ikut terbaca sebagai
 * rentang tanggal 1 s.d. akhir bulan.
 */
const rentangHonorSql = (tahap: 'Listing' | 'Pencacahan' | 'Pengolahan') => {
    const bulanKolom = `k.bulanHonor${tahap}`;
    const awalBulan = `STR_TO_DATE(CONCAT('01-', ${bulanKolom}), '%d-%m-%Y')`;
    return {
        mulai: `COALESCE(k.tanggalMulaiHonor${tahap}, ${awalBulan})`,
        selesai: `COALESCE(k.tanggalSelesaiHonor${tahap}, LAST_DAY(${awalBulan}))`,
        bulan: bulanKolom,
    };
};

const listingRange = rentangHonorSql('Listing');
const pencacahanRange = rentangHonorSql('Pencacahan');
const pengolahanRange = rentangHonorSql('Pengolahan');

/**
 * Sebuah kegiatan ikut terhitung bila rentang honornya BERIRISAN dengan
 * rentang filter, bukan harus termuat seluruhnya. Contoh: honor listing
 * 1-15 Januari tetap muncul saat difilter 10-31 Januari.
 */
const kondisiOverlap = (r: ReturnType<typeof rentangHonorSql>) =>
    `(${r.mulai} <= ? AND ${r.selesai} >= ?)`;

/**
 * Rekap honor per mitra untuk sebuah rentang tanggal.
 *
 * DUA SYARAT, dan keduanya perlu:
 *
 * 1. Rentang honor kegiatan harus BERIRISAN dengan rentang filter. Ini yang
 *    membuat honor 1-15 Januari tidak muncul saat difilter 16-31 Januari —
 *    rekap mengikuti periode honornya, bukan digenapkan per bulan.
 *
 * 2. Jumlahnya diambil dari `ppl_honor_bulan`, dibatasi pada bulan-bulan yang
 *    disentuh filter. Ini yang menghentikan hitungan ganda: honor 15 Februari -
 *    15 Maret dulu terbaca UTUH di Februari dan UTUH lagi di Maret. Sekarang
 *    tiap bulan hanya mendapat porsinya sesuai metode pembebanan yang dipilih
 *    untuk alokasi itu.
 *
 * Baris berjumlah 0 disaring: alokasi yang seluruh honornya dibebankan ke Maret
 * tidak perlu muncul pada filter Februari hanya karena periodenya menyentuh
 * Februari — tidak ada rupiah yang dibebankan di sana.
 *
 * Alokasi tanpa baris `ppl_honor_bulan` tidak ikut terhitung. Itu disengaja:
 * honor yang tidak bisa ditentukan bulannya juga tidak bisa dinilai terhadap
 * batas SBML yang memang berlaku per bulan. Jalur simpan selalu menuliskan
 * barisnya, dan migrasi 2026-09-18 sudah mengisi seluruh data lama.
 */
export const getHonorRekap = async (tanggalMulai: string, tanggalSelesai: string): Promise<PPLHonorData[]> => {
    const bulanFilter = bulanDilalui(tanggalMulai, tanggalSelesai);
    if (bulanFilter.length === 0) return [];

    const penampungBulan = bulanFilter.map(() => '?').join(',');

    const query = `
        SELECT
            p.ppl_master_id AS id,
            pm.namaPPL AS nama,
            k.id AS kegiatanId,
            k.namaKegiatan,
            p.tahap,
            b.jumlah AS besaranHonor,
            b.bulan AS bulanPembebanan
        FROM ppl_honor_bulan b
        JOIN ppl p ON p.id = b.ppl_id
        JOIN kegiatan k ON k.id = p.kegiatanId
        JOIN ppl_master pm ON pm.id = p.ppl_master_id
        WHERE b.bulan IN (${penampungBulan})
          AND b.jumlah <> 0
          AND (
            (p.tahap = 'listing' AND ${kondisiOverlap(listingRange)}) OR
            (p.tahap = 'pencacahan' AND ${kondisiOverlap(pencacahanRange)}) OR
            (p.tahap = 'pengolahan-analisis' AND ${kondisiOverlap(pengolahanRange)})
          )
        ORDER BY pm.namaPPL;
    `;

    // Tiap kondisi overlap butuh pasangan (tanggalSelesai, tanggalMulai).
    const params = [
        ...bulanFilter,
        tanggalSelesai, tanggalMulai,
        tanggalSelesai, tanggalMulai,
        tanggalSelesai, tanggalMulai,
    ];

    const [rows] = await db.query<HonorRowResult[]>(query, params);

    const labelTahap: Record<HonorRowResult['tahap'], string> = {
        'listing': 'Listing',
        'pencacahan': 'Pencacahan',
        'pengolahan-analisis': 'Pengolahan',
    };

    type Akumulasi = PPLHonorData & {
        honorPerBulanPembebanan: Record<string, number>;
        // Satu alokasi kini bisa menyumbang beberapa baris (satu per bulan
        // pembebanan), jadi kegiatannya harus tetap dihitung sekali saja.
        kegiatanTerhitung: Set<string>;
    };

    const perMitra = new Map<string, Akumulasi>();

    for (const row of rows) {
        let mitra = perMitra.get(row.id);
        if (!mitra) {
            mitra = {
                id: row.id,
                nama: row.nama,
                honorBulanIni: 0,
                activitiesCount: 0,
                kegiatanNames: [],
                honorPerBulan: [],
                honorPerBulanPembebanan: {},
                kegiatanTerhitung: new Set(),
            };
            perMitra.set(row.id, mitra);
        }

        const honor = Number(row.besaranHonor) || 0;
        mitra.honorBulanIni += honor;

        const kunci = `${row.kegiatanId}-${row.tahap}`;
        if (!mitra.kegiatanTerhitung.has(kunci)) {
            mitra.kegiatanTerhitung.add(kunci);
            mitra.activitiesCount += 1;
            mitra.kegiatanNames.push(`${row.namaKegiatan} (${labelTahap[row.tahap]})`);
        }

        if (row.bulanPembebanan) {
            mitra.honorPerBulanPembebanan[row.bulanPembebanan] =
                (mitra.honorPerBulanPembebanan[row.bulanPembebanan] || 0) + honor;
        }
    }

    return Array.from(perMitra.values()).map(({ kegiatanTerhitung, ...mitra }) => mitra);
};

/**
 * Honor bulanan seorang mitra sepanjang satu tahun, indeks 0 = Januari.
 *
 * Dibaca dari `ppl_honor_bulan`, bukan lagi dari UNION tiga cabang atas kolom
 * `bulanHonor*`. Selain jauh lebih pendek, ini satu-satunya cara agar honor
 * yang dipecah ke beberapa bulan muncul di bulan yang benar — kolom
 * `bulanHonor*` hanya bisa menyebut SATU bulan per tahap.
 */
export const getHonorDetail = async (pplMasterId: string, tahun: number): Promise<number[]> => {
    const honorPerBulan = Array(12).fill(0);

    const [rows] = await db.query<RowDataPacket[]>(`
        SELECT CAST(SUBSTRING_INDEX(b.bulan, '-', 1) AS UNSIGNED) AS bulan,
               SUM(b.jumlah) AS total
          FROM ppl_honor_bulan b
          JOIN ppl p ON p.id = b.ppl_id
         WHERE p.ppl_master_id = ?
           AND b.bulan LIKE CONCAT('%-', ?)
         GROUP BY bulan
    `, [pplMasterId, tahun]);

    rows.forEach(row => {
        const indeks = Number(row.bulan) - 1;
        if (indeks >= 0 && indeks < 12) {
            honorPerBulan[indeks] = Number(row.total) || 0;
        }
    });

    return honorPerBulan;
};

/**
 * Total honor seorang mitra pada satu bulan, untuk pemeriksaan batas SBML.
 *
 * Dibaca dari `ppl_honor_bulan` supaya honor yang dipecah dihitung sebesar
 * PORSI bulan itu saja. Query lama menjumlahkan `p.besaranHonor` utuh untuk
 * setiap kegiatan yang bulan honornya cocok, sehingga honor lintas bulan
 * terhitung penuh di bulan mana pun ia disebut.
 *
 * `kegiatanIdToExclude` dipakai saat menyimpan kegiatan: honor lama kegiatan
 * yang sedang disunting harus dikeluarkan lebih dulu, kalau tidak ia akan
 * dihitung dua kali bersama honor barunya.
 */
export const getTotalHonorPPLByMonth = async (
    pplMasterId: string,
    bulan: number,
    tahun: number,
    kegiatanIdToExclude: number | null = null,
): Promise<number> => {
    const kunci = `${String(bulan).padStart(2, '0')}-${tahun}`;

    let query = `
        SELECT SUM(b.jumlah) AS totalHonor
          FROM ppl_honor_bulan b
          JOIN ppl p ON p.id = b.ppl_id
         WHERE p.ppl_master_id = ?
           AND b.bulan = ?
    `;
    const params: (string | number)[] = [pplMasterId, kunci];

    if (kegiatanIdToExclude) {
        query += ' AND p.kegiatanId != ?';
        params.push(kegiatanIdToExclude);
    }

    const [rows] = await db.query<RowDataPacket[]>(query, params);
    return Number(rows[0]?.totalHonor) || 0;
};

// FUNGSI INI TIDAK BERUBAH
export const validatePplHonor = async (pplMasterId: string, bulan: number, tahun: number, currentActivityHonor: number, kegiatanIdToExclude: number | null) => {
  const honorLimitString = await getSetting('HONOR_LIMIT', '3000000');
  const honorLimit = parseInt(honorLimitString, 10);
  const existingHonor = await getTotalHonorPPLByMonth(pplMasterId, bulan, tahun, kegiatanIdToExclude);
  const projectedTotal = existingHonor + currentActivityHonor;

  if (projectedTotal > honorLimit) {
    const error: any = new Error(`Total honor untuk PPL akan menjadi ${projectedTotal}, melebihi batas ${honorLimit}.`);
    error.statusCode = 409; 
    error.details = {
        code: 'HONOR_LIMIT_EXCEEDED',
        ppl_master_id: pplMasterId,
        projectedTotal,
        limit: honorLimit,
    };
    throw error;
  }
  
  // Jika tidak ada error, kembalikan status sukses (opsional, karena fungsi ini sekarang fokus pada error)
  return {
    isOverLimit: false,
    limit: honorLimit,
    projectedTotal: projectedTotal
  };
};