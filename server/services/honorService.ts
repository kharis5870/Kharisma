// server/services/honorService.ts

import { RowDataPacket } from 'mysql2';
import db from '../db';
import { PPLHonorData, RincianHonorKegiatan } from '@shared/api';
// Jalur relatif, BUKAN '@shared/...': alias itu tidak tersedia saat
// vite.config.ts memuat kode server lewat Node, dan ini nilai runtime.
import { bulanDilalui } from '../../shared/pembebananHonor';
// Fragmen SQL rentang honor dipakai bersama beberapa layanan. Dulu disalin di
// berkas ini DAN di kontrakService; lihat rentangHonorSql.ts untuk alasannya.
import {
    kondisiOverlap, listingRange, pencacahanRange, pengolahanRange, JENIS_DARI_TAHAP,
} from './rentangHonorSql';

interface HonorRowResult extends RowDataPacket {
    id: string;
    nama: string;
    kegiatanId: number;
    namaKegiatan: string;
    tahap: 'listing' | 'pencacahan' | 'pengolahan-analisis';
    besaranHonor: number;
    bulanPembebanan: string | null;
    volume: number;
    satuan: string | null;
    hargaSatuan: number | null;
}

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
            b.bulan AS bulanPembebanan,
            -- Muatan porsi bulan ini, untuk rincian beban per kegiatan. Satuan
            -- dan harga satuan diambil lewat subkueri supaya satu baris
            -- pembebanan tidak pernah terduplikasi oleh JOIN.
            b.volume AS volume,
            (SELECT ph.satuanBebanKerja FROM ppl_honorarium ph
              WHERE ph.ppl_id = p.id AND ph.jenis_pekerjaan = ${JENIS_DARI_TAHAP} LIMIT 1) AS satuan,
            (SELECT ph.hargaSatuan FROM ppl_honorarium ph
              WHERE ph.ppl_id = p.id AND ph.jenis_pekerjaan = ${JENIS_DARI_TAHAP} LIMIT 1) AS hargaSatuan
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
        ORDER BY pm.namaPPL, k.namaKegiatan, p.tahap, b.bulan;
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
        // Rincian per kegiatan x tahap, dikumpulkan dari baris per bulan.
        rincianPerKunci: Map<string, RincianHonorKegiatan>;
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
                rincianKegiatan: [],
                kegiatanTerhitung: new Set(),
                rincianPerKunci: new Map(),
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

        // Rincian beban: muatan dan honor dijumlahkan dari porsi tiap bulan
        // pembebanan yang masuk rentang, jadi totalnya sama persis dengan honor
        // mitra di atas — termasuk honor lintas bulan yang hanya sebagian
        // jatuh di rentang ini.
        let rincian = mitra.rincianPerKunci.get(kunci);
        if (!rincian) {
            rincian = {
                kunci,
                kegiatanId: row.kegiatanId,
                namaKegiatan: row.namaKegiatan,
                tahap: labelTahap[row.tahap],
                muatan: 0,
                satuan: row.satuan ?? '',
                hargaSatuan: Number(row.hargaSatuan) || 0,
                honor: 0,
                honorPerBulan: {},
            };
            mitra.rincianPerKunci.set(kunci, rincian);
            mitra.rincianKegiatan!.push(rincian);
        }
        rincian.muatan += Number(row.volume) || 0;
        rincian.honor += honor;
        if (row.bulanPembebanan) {
            rincian.honorPerBulan[row.bulanPembebanan] = (rincian.honorPerBulan[row.bulanPembebanan] || 0) + honor;
        }

        if (row.bulanPembebanan) {
            mitra.honorPerBulanPembebanan[row.bulanPembebanan] =
                (mitra.honorPerBulanPembebanan[row.bulanPembebanan] || 0) + honor;
        }
    }

    return Array.from(perMitra.values()).map(({ kegiatanTerhitung, rincianPerKunci, ...mitra }) => mitra);
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
