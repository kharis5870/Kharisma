// server/services/pembebananService.ts

/**
 * Menetapkan honor tiap alokasi PPL ke bulan-bulannya, lalu menyimpan hasilnya.
 *
 * KENAPA HASILNYA DISIMPAN, BUKAN DIHITUNG SAAT DIBACA
 * Metode 'luber' bergantung pada sisa kuota SBML mitra di bulan itu — dan sisa
 * kuota ditentukan oleh honornya di kegiatan LAIN. Kalau pembagian dihitung
 * ulang setiap kali halaman honor dibuka, keputusan yang sudah diambil bisa
 * berubah sendiri hanya karena orang lain menambah kegiatan baru, dan SPJ yang
 * sudah dicetak tidak lagi cocok. Karena itu hasilnya dibekukan ke
 * `ppl_honor_bulan` saat kegiatan disimpan.
 *
 * Konsekuensi yang disengaja: mengubah batas SBML TIDAK membagi ulang kegiatan
 * lama. Pembagiannya baru diperbarui saat kegiatan itu disimpan ulang.
 *
 * Impor `../../shared/pembebananHonor` sengaja memakai jalur relatif, bukan
 * `@shared/...`: alias itu tidak tersedia saat `vite.config.ts` memuat kode
 * server lewat Node, dan yang diimpor di sini adalah nilai runtime.
 */

import { PoolConnection } from 'mysql2/promise';
import {
    bebankanVolume,
    bulanDilalui,
    kunciBulan,
    type KunciBulan,
    type MetodePembebanan,
    type PembebananPerBulan,
} from '../../shared/pembebananHonor';
import { getSetting } from './settingsService';
import { getTotalHonorPPLByMonth } from './honorService';

type Tahap = 'listing' | 'pencacahan' | 'pengolahan-analisis';

/** Akhiran kolom tanggal/bulan honor di tabel `kegiatan`, per tahap alokasi. */
const AKHIRAN_KOLOM: Record<Tahap, 'Listing' | 'Pencacahan' | 'Pengolahan'> = {
    'listing': 'Listing',
    'pencacahan': 'Pencacahan',
    'pengolahan-analisis': 'Pengolahan',
};

export interface RentangHonor {
    mulai: string | null;
    selesai: string | null;
}

/**
 * Rentang honor sebuah tahap, dari payload kegiatan.
 *
 * Tanggal didahulukan karena itulah yang sekarang diisi pengguna. Kolom
 * `bulanHonor*` yang lama dipakai sebagai cadangan dan diperlebar menjadi
 * tanggal 1 s.d. akhir bulan — kegiatan lama hanya menyimpan bulan, dan tanpa
 * cadangan ini honornya tidak akan terbebankan ke bulan mana pun.
 */
export const rentangHonorTahap = (data: any, tahap: Tahap): RentangHonor => {
    const akhiran = AKHIRAN_KOLOM[tahap];
    const mulai = data[`tanggalMulaiHonor${akhiran}`] ?? null;
    const selesai = data[`tanggalSelesaiHonor${akhiran}`] ?? null;
    if (mulai && selesai) return { mulai: String(mulai).slice(0, 10), selesai: String(selesai).slice(0, 10) };

    const bulan: string | undefined = data[`bulanHonor${akhiran}`];
    if (!bulan) return { mulai: null, selesai: null };

    const [bl, th] = bulan.split('-');
    const b = Number(bl);
    const t = Number(th);
    if (!b || !t) return { mulai: null, selesai: null };
    // Hari 0 bulan berikutnya = hari terakhir bulan ini, termasuk tahun kabisat.
    const akhirBulan = new Date(t, b, 0).getDate();
    return {
        mulai: `${t}-${String(b).padStart(2, '0')}-01`,
        selesai: `${t}-${String(b).padStart(2, '0')}-${String(akhirBulan).padStart(2, '0')}`,
    };
};

export interface AlokasiUntukPembebanan {
    ppl_master_id: string;
    tahap: Tahap;
    /**
     * Unit beban kerja alokasi ini (dokumen, responden). INILAH yang dibagi ke
     * bulan-bulan, bukan rupiahnya — Surat PK dipecah per bulan menurut muatan.
     */
    volume: number;
    /** Harga satuan tahap ini, dalam rupiah. Rupiah tiap bulan = volume x harga. */
    hargaSatuan: number;
    metode: MetodePembebanan;
    bulanDipilih: KunciBulan | null;
}

export interface HasilPembebanan {
    /** Volume dan rupiah per bulan; volumenya menjumlah persis beban kerja alokasi. */
    perBulan: PembebananPerBulan;
    /** Bulan yang totalnya (bersama kegiatan lain) melewati batas SBML. */
    bulanMelanggar: Array<{ bulan: KunciBulan; total: number }>;
}

/**
 * Menghitung pembebanan satu alokasi, sekaligus menandai bulan yang melanggar.
 *
 * TIDAK melempar galat. Pemanggilnya yang memutuskan apakah pelanggaran itu
 * menghentikan penyimpanan — halaman kegiatan punya tombol "lanjutkan saja"
 * (`bypassHonorLimit`), dan keputusan itu bukan urusan fungsi ini.
 */
export const hitungPembebanan = async (
    alokasi: AlokasiUntukPembebanan,
    rentang: RentangHonor,
    kegiatanIdDikecualikan: number | null,
    /** Batas SBML. Dioper, bukan diambil sendiri, supaya menyimpan kegiatan
     *  dengan 20 alokasi tidak menembak tabel settings 20 kali. */
    batas: number,
): Promise<HasilPembebanan> => {
    const bulan = bulanDilalui(rentang.mulai, rentang.selesai);
    if (bulan.length === 0) return { perBulan: {}, bulanMelanggar: [] };

    // Honor mitra ini di bulan-bulan tersebut DARI KEGIATAN LAIN. Dipakai dua
    // kali: menentukan sisa kuota untuk metode 'luber', dan menilai pelanggaran.
    const honorLain: Record<KunciBulan, number> = {};
    for (const k of bulan) {
        const [bl, th] = k.split('-');
        honorLain[k] = await getTotalHonorPPLByMonth(
            alokasi.ppl_master_id, Number(bl), Number(th), kegiatanIdDikecualikan);
    }

    const sisaKuota: Record<KunciBulan, number> = {};
    for (const k of bulan) sisaKuota[k] = Math.max(0, batas - honorLain[k]);

    const perBulan = bebankanVolume(alokasi.volume, alokasi.hargaSatuan, rentang.mulai, rentang.selesai, {
        metode: alokasi.metode,
        bulanDipilih: alokasi.bulanDipilih,
        sisaKuota,
    });

    const bulanMelanggar: HasilPembebanan['bulanMelanggar'] = [];
    for (const [k, bagian] of Object.entries(perBulan)) {
        const total = (honorLain[k] ?? 0) + bagian.jumlah;
        if (total > batas) bulanMelanggar.push({ bulan: k, total });
    }

    return { perBulan, bulanMelanggar };
};

/**
 * Menulis ulang pembebanan satu alokasi.
 *
 * Dihapus lebih dulu, bukan di-UPSERT: bulan yang tidak lagi dilalui periode
 * harus benar-benar hilang. UPSERT akan meninggalkan baris bulan lama dengan
 * jumlah lamanya, dan honor mitra jadi terhitung di bulan yang sudah tidak ada
 * dasarnya.
 */
export const simpanPembebanan = async (
    koneksi: PoolConnection,
    pplId: number,
    perBulan: PembebananPerBulan,
): Promise<void> => {
    await koneksi.execute('DELETE FROM ppl_honor_bulan WHERE ppl_id = ?', [pplId]);

    const baris = Object.entries(perBulan)
        .filter(([, b]) => Number.isFinite(b.volume) && Number.isFinite(b.jumlah));
    if (baris.length === 0) return;

    // Volume ikut disimpan: Surat PK tiap bulan mencetak berapa unit yang
    // dikerjakan di bulan itu, bukan hanya rupiahnya.
    await koneksi.query(
        'INSERT INTO ppl_honor_bulan (ppl_id, bulan, volume, jumlah) VALUES ?',
        [baris.map(([bulan, b]) => [pplId, bulan, Math.round(b.volume), Math.round(b.jumlah)])],
    );
};

/**
 * Galat batas honor. Bentuknya — `statusCode` 409 dan
 * `details.code = 'HONOR_LIMIT_EXCEEDED'` — WAJIB dipertahankan: halaman Input
 * dan Edit Kegiatan membaca kode itu untuk memunculkan dialog "lanjutkan
 * saja" (`bypassHonorLimit`), bukan pesan galat biasa.
 */
export const galatBatasHonor = (
    pplMasterId: string,
    bulan: KunciBulan,
    total: number,
    batas: number,
) => {
    const galat: any = new Error(
        `Total honor untuk PPL pada ${bulan} akan menjadi ${total}, melebihi batas ${batas}.`);
    galat.statusCode = 409;
    galat.details = {
        code: 'HONOR_LIMIT_EXCEEDED',
        ppl_master_id: pplMasterId,
        bulan,
        projectedTotal: total,
        limit: batas,
    };
    return galat;
};

/** Batas SBML saat ini. Dipisah supaya pemanggil tidak perlu tahu kunci settingnya. */
export const batasHonorBulanan = async (): Promise<number> =>
    parseInt(await getSetting('HONOR_LIMIT', '3000000'), 10) || 0;

/** Bulan sebuah tanggal, untuk mengisi kolom `bulanHonor*` dari rentang. */
export const bulanDariTanggal = (tanggal: string | null): KunciBulan | null => {
    if (!tanggal) return null;
    const cocok = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(tanggal));
    if (!cocok) return null;
    return kunciBulan(new Date(Number(cocok[1]), Number(cocok[2]) - 1, Number(cocok[3])));
};
