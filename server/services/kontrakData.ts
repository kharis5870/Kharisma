// Dipisah dari server/services/kontrakService.ts tanpa mengubah isinya.

import { RowDataPacket } from 'mysql2';
import db from '../db';
import { bandingkanIsiSurat, type BarisIsiSurat } from '../../shared/penomoranSurat';
import { DataKontrakMitra, BarisKontrak } from '@shared/api';
import { bulanDilalui } from '../../shared/pembebananHonor';
import {
    KONDISI_PERIODE, MULAI_SESUAI_TAHAP, SELESAI_SESUAI_TAHAP, JENIS_DARI_TAHAP, paramPeriode,
} from './rentangHonorSql';
import { LABEL_TAHAP } from './kontrakBantu';

// ----------------------------- Data kontrak -----------------------------

/**
 * Menyusun data Surat PK per mitra untuk sebuah periode.
 *
 * Sumber angkanya sama persis dengan rekap honor: satu baris lampiran per
 * kombinasi kegiatan x tahap yang diikuti mitra, memakai beban kerja, satuan,
 * harga satuan, dan besaran honor dari `ppl_honorarium`.
 */
/**
 * Bentuk baris lampiran yang DISIMPAN sebagai salinan isi surat.
 *
 * Sengaja dipisahkan dari `BarisKontrak`: kode anggaran tidak ikut karena ia
 * urusan pembukuan, bukan isi perjanjian dengan mitra, dan perubahannya tidak
 * pantas memicu peringatan "surat sudah tidak sesuai".
 */
export const keBarisIsi = (b: BarisKontrak): BarisIsiSurat => ({
    kunci: b.kunci || b.uraianTugas,
    uraianTugas: b.uraianTugas,
    volume: b.volume,
    satuan: b.satuan,
    hargaSatuan: b.hargaSatuan,
    nilaiPerjanjian: b.nilaiPerjanjian,
    jangkaWaktuMulai: b.jangkaWaktuMulai ?? null,
    jangkaWaktuSelesai: b.jangkaWaktuSelesai ?? null,
});

/**
 * Membaca salinan isi surat dari kolom `isi_terbit`.
 *
 * Mengembalikan null bila kolomnya kosong (surat terbit sebelum fitur ini ada)
 * ATAU isinya rusak. Keduanya diperlakukan sama: yang bisa dibandingkan hanya
 * total honornya, dan layar harus jujur menyebutkan keterbatasan itu. Isi yang
 * rusak tidak boleh menjatuhkan permintaan — daftar surat harus tetap tampil.
 */
export const uraikanIsiTerbit = (mentah: unknown): BarisIsiSurat[] | null => {
    if (typeof mentah !== 'string' || mentah.trim() === '') return null;
    try {
        const isi = JSON.parse(mentah);
        return Array.isArray(isi) ? isi as BarisIsiSurat[] : null;
    } catch {
        console.error('[kontrak] isi_terbit tidak bisa dibaca sebagai JSON');
        return null;
    }
};

export const getDataKontrak = async (tanggalMulai: string, tanggalSelesai: string): Promise<DataKontrakMitra[]> => {
    // Honor lintas bulan dipecah per bulan menurut MUATAN (`ppl_honor_bulan`),
    // persis cara tim keuangan membuat Surat PK-nya: target 10 responden jadi
    // SPK bulan pertama 5 responden dan SPK bulan kedua 5 responden, masing-
    // masing dengan jangka waktunya sendiri. Karena itu volume dan nilai tiap
    // baris diambil dari porsi bulan-bulan yang tercakup periode surat ini.
    //
    // Dulu yang dipakai adalah beban kerja dan honor UTUH alokasinya, untuk
    // setiap periode yang disentuh rentang honornya. Satu pekerjaan 4,8 juta
    // yang melintasi September-Oktober tercetak penuh di SPK September DAN
    // penuh lagi di SPK Oktober — terkontrak dua kali.
    const bulanPeriode = bulanDilalui(tanggalMulai, tanggalSelesai);
    // `IN ()` kosong adalah SQL tidak sah; nilai yang mustahil cocok dipakai
    // sebagai pengganti supaya kuerinya tetap sah.
    const daftarBulan = bulanPeriode.length > 0 ? bulanPeriode : ['--'];

    const [rows] = await db.query<RowDataPacket[]>(
        `SELECT
            p.ppl_master_id AS pplMasterId,
            pm.namaPPL AS nama,
            pm.alamat,
            k.id AS kegiatanId,
            k.namaKegiatan,
            ${JENIS_DARI_TAHAP} AS jenis_pekerjaan,
            hk.uraian_tugas,
            hk.kode_anggaran,
            ph.bebanKerja,
            ph.satuanBebanKerja,
            ph.hargaSatuan,
            ph.besaranHonor,
            hb.volumePeriode,
            hb.jumlahPeriode,
            hb.bulanTerisi,
            ${MULAI_SESUAI_TAHAP} AS jangkaWaktuMulai,
            ${SELESAI_SESUAI_TAHAP} AS jangkaWaktuSelesai
         FROM ppl p
         JOIN kegiatan k ON p.kegiatanId = k.id
         JOIN ppl_master pm ON p.ppl_master_id = pm.id
         LEFT JOIN ppl_honorarium ph
                ON ph.ppl_id = p.id AND ph.jenis_pekerjaan = ${JENIS_DARI_TAHAP}
         LEFT JOIN honorarium_kegiatan hk
                ON hk.kegiatanId = k.id AND hk.jenis_pekerjaan = ${JENIS_DARI_TAHAP}
         LEFT JOIN (
             SELECT ppl_id,
                    SUM(CASE WHEN bulan IN (?) THEN volume ELSE 0 END) AS volumePeriode,
                    SUM(CASE WHEN bulan IN (?) THEN jumlah ELSE 0 END) AS jumlahPeriode,
                    SUM(CASE WHEN volume <> 0 OR jumlah <> 0 THEN 1 ELSE 0 END) AS bulanTerisi
               FROM ppl_honor_bulan
              GROUP BY ppl_id
         ) hb ON hb.ppl_id = p.id
         WHERE ${KONDISI_PERIODE}
         ORDER BY pm.namaPPL, k.namaKegiatan`,
        // Urutan penampung mengikuti teks SQL: dua `IN (?)` di subkueri,
        // baru pasangan tanggal milik KONDISI_PERIODE.
        [daftarBulan, daftarBulan, ...paramPeriode(tanggalMulai, tanggalSelesai)]
    );

    const perMitra = new Map<string, DataKontrakMitra>();

    for (const row of rows) {
        // `hb` kosong berarti alokasi ini belum pernah dibagi per bulan (data
        // lama). Nilai utuhnya dipakai seperti sebelumnya.
        const adaPembebanan = row.bulanTerisi !== null && row.bulanTerisi !== undefined;
        const bulanTerisi = Number(row.bulanTerisi) || 0;
        const volumePeriode = Number(row.volumePeriode) || 0;
        const jumlahPeriode = Number(row.jumlahPeriode) || 0;

        // Alokasi yang muatannya seluruhnya dibebankan ke bulan LAIN tidak
        // masuk surat periode ini — "seluruhnya di Oktober" tidak boleh muncul
        // di SPK September hanya karena rentang kerjanya menyentuh September.
        if (adaPembebanan && bulanTerisi > 0 && volumePeriode === 0 && jumlahPeriode === 0) continue;

        let mitra = perMitra.get(row.pplMasterId);
        if (!mitra) {
            mitra = {
                pplMasterId: row.pplMasterId,
                nama: row.nama,
                alamat: row.alamat,
                baris: [],
                totalHonor: 0,
            };
            perMitra.set(row.pplMasterId, mitra);
        }

        // Jangka waktu dipotong ke periode surat HANYA bila muatannya memang
        // terpecah ke lebih dari satu bulan: SPK tiap bulan berjangka waktu
        // porsinya sendiri (15-31 Jan, lalu 1-15 Feb). Alokasi yang seluruhnya
        // dibebankan ke satu bulan tetap satu surat dengan jangka kerja utuh.
        let jangkaMulai: string | null = row.jangkaWaktuMulai;
        let jangkaSelesai: string | null = row.jangkaWaktuSelesai;
        if (bulanTerisi > 1) {
            if (jangkaMulai && jangkaMulai < tanggalMulai) jangkaMulai = tanggalMulai;
            if (jangkaSelesai && jangkaSelesai > tanggalSelesai) jangkaSelesai = tanggalSelesai;
        }

        const baris: BarisKontrak = {
            // Penanda stabil satu baris; lihat BarisKontrak.kunci di shared/api.ts.
            kunci: `${row.kegiatanId}-${row.jenis_pekerjaan}`,
            uraianTugas: row.uraian_tugas || `${row.namaKegiatan} ${LABEL_TAHAP[row.jenis_pekerjaan] || ''}`.trim(),
            jangkaWaktuMulai: jangkaMulai,
            jangkaWaktuSelesai: jangkaSelesai,
            volume: adaPembebanan ? volumePeriode : (Number(row.bebanKerja) || 0),
            satuan: row.satuanBebanKerja || '',
            hargaSatuan: Number(row.hargaSatuan) || 0,
            nilaiPerjanjian: adaPembebanan ? jumlahPeriode : (Number(row.besaranHonor) || 0),
            kodeAnggaran: row.kode_anggaran || '',
        };
        mitra.baris.push(baris);
        mitra.totalHonor += baris.nilaiPerjanjian;

        // Jangka waktu di Pasal 3 adalah rentang terluar dari seluruh barisnya.
        if (baris.jangkaWaktuMulai && (!mitra.jangkaWaktuMulai || baris.jangkaWaktuMulai < mitra.jangkaWaktuMulai)) {
            mitra.jangkaWaktuMulai = baris.jangkaWaktuMulai;
        }
        if (baris.jangkaWaktuSelesai && (!mitra.jangkaWaktuSelesai || baris.jangkaWaktuSelesai > mitra.jangkaWaktuSelesai)) {
            mitra.jangkaWaktuSelesai = baris.jangkaWaktuSelesai;
        }
    }

    // Nomor surat yang sudah pernah dipesan untuk periode ini ikut dikembalikan
    // supaya tampilan konsisten tanpa perlu memesan ulang.
    const [nomorRows] = await db.query<RowDataPacket[]>(
        `SELECT id, ppl_master_id, nomor_urut, nomor_surat, nomor_bast,
                isi_terbit, total_honor,
                DATE_FORMAT(tanggal_surat, '%Y-%m-%d') AS tanggal_surat,
                DATE_FORMAT(tanggal_bast,  '%Y-%m-%d') AS tanggal_bast
           FROM kontrak_mitra
          WHERE periode_mulai = ? AND periode_selesai = ? AND status = 'aktif'`,
        [tanggalMulai, tanggalSelesai]
    );
    for (const n of nomorRows) {
        const mitra = perMitra.get(n.ppl_master_id);
        if (mitra) {
            mitra.suratId = Number(n.id);
            mitra.nomorUrut = n.nomor_urut;
            mitra.nomorSurat = n.nomor_surat;
            mitra.tanggalSurat = n.tanggal_surat;
            // Kosong bila BAST-nya belum pernah dibuat. Tab BAST memakai query
            // yang sama dengan tab SPK, jadi tidak ada permintaan tambahan.
            mitra.nomorBast = n.nomor_bast ?? undefined;
            mitra.tanggalBast = n.tanggal_bast ?? undefined;

            // Surat sudah terbit, jadi isinya dibandingkan dengan data sekarang.
            // Honor yang direvisi, muatan yang bertambah, atau kegiatan baru
            // yang masuk setelah surat ditandatangani harus terlihat DI LAYAR
            // GENERATE, bukan baru ketahuan saat pembayaran.
            const beda = bandingkanIsiSurat(
                uraikanIsiTerbit(n.isi_terbit),
                n.total_honor === null || n.total_honor === undefined ? null : Number(n.total_honor),
                mitra.baris.map(keBarisIsi),
            );
            if (beda.length > 0) mitra.perubahan = beda;
        }
    }

    return Array.from(perMitra.values());
};
