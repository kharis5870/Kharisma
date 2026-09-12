// server/services/kontrakService.ts

import { RowDataPacket, OkPacket } from 'mysql2';
import type { PoolConnection } from 'mysql2/promise';
import db from '../db';
// Jalur relatif, BUKAN alias @shared: vite.config.ts memuat kode server lewat
// Node saat menyusun konfigurasi, dan alias belum terpasang pada saat itu.
// Impor tipe selama ini aman karena terhapus saat kompilasi — ini nilai runtime.
import { nomorPertama } from '../../shared/nomorAwal';
import { susunNomorSurat } from '../../shared/nomorSurat';
import {
    celahNomor, nomorBolehDipakai, rencanaRapikanNomor, bandingkanIsiSurat,
    type RencanaRapikan, type SuratBernomor, type BarisIsiSurat,
} from '../../shared/penomoranSurat';
import {
    TemplateSurat, UraianTugasKontrak, DataKontrakMitra, BarisKontrak,
    RiwayatSuratItem, RiwayatSuratTahun,
} from '@shared/api';

// Jalur relatif, BUKAN '@shared/...': alias itu tidak tersedia saat
// vite.config.ts memuat kode server lewat Node, dan ini nilai runtime.
import { bulanDilalui } from '../../shared/pembebananHonor';
// Fragmen SQL rentang honor dipakai bersama beberapa layanan. Dulu disalin di
// berkas ini DAN di honorService; lihat rentangHonorSql.ts untuk alasannya.
import {
    KONDISI_PERIODE, MULAI_SESUAI_TAHAP, SELESAI_SESUAI_TAHAP, paramPeriode,
} from './rentangHonorSql';
/**
 * Tahap pada tabel `ppl` bernama 'pengolahan-analisis', sedangkan
 * `honorarium_kegiatan.jenis_pekerjaan` memakai 'pengolahan'. Pemetaan ini
 * dipakai di banyak tempat, jadi didefinisikan sekali.
 */
const JENIS_DARI_TAHAP = `CASE p.tahap WHEN 'pengolahan-analisis' THEN 'pengolahan' ELSE p.tahap END`;

const LABEL_TAHAP: Record<string, string> = {
    listing: 'Listing',
    pencacahan: 'Pencacahan',
    pengolahan: 'Pengolahan',
};

/**
 * Rentang tanggal honor untuk sebuah tahap, dengan fallback ke kolom
 * `bulanHonor*` yang lama supaya kegiatan yang belum punya rentang tetap
 * terbaca. Sama persis dengan yang dipakai honorService.
 */
// ----------------------------- Template Surat -----------------------------

/** Harus sama dengan DEFAULT kolom di migrasi 2026-09-13-surat-bast.sql. */
const POLA_BAST_BAWAAN = '{nomor}/BAST/{BULAN}/{ROMAWI}/{tahun}';
const POLA_SPK_BAWAAN = '{nomor}/SPK/{BULAN}/{ROMAWI}/{tahun}';

export const getTemplateAktif = async (): Promise<TemplateSurat | null> => {
    const [rows] = await db.query<RowDataPacket[]>(
        'SELECT * FROM template_surat WHERE is_aktif = 1 ORDER BY id LIMIT 1'
    );
    return (rows[0] as TemplateSurat) || null;
};

export const updateTemplate = async (id: number, data: Partial<TemplateSurat>, username?: string): Promise<TemplateSurat | null> => {
    await db.execute(
        `UPDATE template_surat SET
            nama_template = ?, format_nomor = ?, format_nomor_bast = ?,
            ppk_nama = ?, ppk_nip = ?, ppk_jabatan = ?,
            satker_nama = ?, satker_alamat = ?, kota = ?, pengadilan_negeri = ?,
            updatedBy = ?
         WHERE id = ?`,
        [
            data.nama_template, data.format_nomor,
            // Kueri ini menulis SEMUA kolom tanpa syarat, jadi field yang tidak
            // dikirim klien akan bernilai undefined dan membuat mysql2 melempar
            // "Bind parameters must not contain undefined" — seluruh simpanan
            // gagal, bukan cuma kolom ini.
            data.format_nomor_bast || POLA_BAST_BAWAAN,
            data.ppk_nama, data.ppk_nip, data.ppk_jabatan,
            data.satker_nama, data.satker_alamat ?? null, data.kota ?? null, data.pengadilan_negeri ?? null,
            username ?? null, id,
        ]
    );
    const [rows] = await db.query<RowDataPacket[]>('SELECT * FROM template_surat WHERE id = ?', [id]);
    return (rows[0] as TemplateSurat) || null;
};

// -------------------- Uraian tugas & kode anggaran (MAK) --------------------

/**
 * Daftar kegiatan x tahap yang punya mitra pada periode tertentu, beserta
 * uraian tugas dan kode anggarannya. Uraian yang belum pernah diisi diberi
 * nilai bawaan "namaKegiatan + label tahap" supaya tim keuangan tinggal
 * menyesuaikan bila perlu.
 */
export const getUraianTugas = async (tanggalMulai: string, tanggalSelesai: string): Promise<UraianTugasKontrak[]> => {
    const [rows] = await db.query<RowDataPacket[]>(
        `SELECT
            k.id AS kegiatanId,
            k.namaKegiatan,
            ${JENIS_DARI_TAHAP} AS jenis_pekerjaan,
            hk.uraian_tugas,
            hk.kode_anggaran,
            COUNT(DISTINCT p.ppl_master_id) AS jumlahMitra,
            ${MULAI_SESUAI_TAHAP} AS tanggalMulaiHonor,
            ${SELESAI_SESUAI_TAHAP} AS tanggalSelesaiHonor
         FROM ppl p
         JOIN kegiatan k ON p.kegiatanId = k.id
         LEFT JOIN honorarium_kegiatan hk
                ON hk.kegiatanId = k.id AND hk.jenis_pekerjaan = ${JENIS_DARI_TAHAP}
         WHERE ${KONDISI_PERIODE}
         GROUP BY k.id, k.namaKegiatan, jenis_pekerjaan, hk.uraian_tugas, hk.kode_anggaran,
                  tanggalMulaiHonor, tanggalSelesaiHonor
         ORDER BY k.namaKegiatan, jenis_pekerjaan`,
        paramPeriode(tanggalMulai, tanggalSelesai)
    );

    return rows.map(row => ({
        kegiatanId: row.kegiatanId,
        namaKegiatan: row.namaKegiatan,
        jenis_pekerjaan: row.jenis_pekerjaan,
        uraian_tugas: row.uraian_tugas || `${row.namaKegiatan} ${LABEL_TAHAP[row.jenis_pekerjaan] || ''}`.trim(),
        kode_anggaran: row.kode_anggaran || '',
        jumlahMitra: Number(row.jumlahMitra) || 0,
        tanggalMulaiHonor: row.tanggalMulaiHonor,
        tanggalSelesaiHonor: row.tanggalSelesaiHonor,
    }));
};

/**
 * Menyimpan uraian tugas dan kode anggaran per kegiatan x tahap. Nilai ini
 * berlaku untuk SEMUA mitra pada kegiatan dan tahap tersebut, sesuai alur
 * "atur sekali, generate semua".
 */
export const simpanUraianTugas = async (
    daftar: { kegiatanId: number; jenis_pekerjaan: string; uraian_tugas: string; kode_anggaran: string }[]
): Promise<number> => {
    if (daftar.length === 0) return 0;

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        let tersimpan = 0;
        for (const item of daftar) {
            // Baris honorarium_kegiatan selalu dibuat saat kegiatan disimpan,
            // tapi UPDATE dipakai agar satuan & harga satuan tidak tersentuh.
            const [hasil] = await connection.execute<OkPacket>(
                'UPDATE honorarium_kegiatan SET uraian_tugas = ?, kode_anggaran = ? WHERE kegiatanId = ? AND jenis_pekerjaan = ?',
                [item.uraian_tugas || null, item.kode_anggaran || null, item.kegiatanId, item.jenis_pekerjaan]
            );
            if (hasil.affectedRows === 0) {
                await connection.execute(
                    'INSERT INTO honorarium_kegiatan (kegiatanId, jenis_pekerjaan, satuan_beban_kerja, harga_satuan, uraian_tugas, kode_anggaran) VALUES (?, ?, ?, ?, ?, ?)',
                    [item.kegiatanId, item.jenis_pekerjaan, '', '0', item.uraian_tugas || null, item.kode_anggaran || null]
                );
            }
            tersimpan += 1;
        }
        await connection.commit();
        return tersimpan;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

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
const keBarisIsi = (b: BarisKontrak): BarisIsiSurat => ({
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
const uraikanIsiTerbit = (mentah: unknown): BarisIsiSurat[] | null => {
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

/**
 * Memesan nomor urut surat untuk sekumpulan mitra pada satu periode.
 *
 * Idempoten: mitra yang sudah punya nomor untuk periode yang sama akan
 * memperoleh nomor yang sama lagi (dijamin UNIQUE KEY `unique_kontrak`),
 * sehingga generate ulang tidak menggeser penomoran.
 */
export const pesanNomorKontrak = async (
    periodeMulai: string,
    periodeSelesai: string,
    tanggalSurat: string,
    /**
     * `baris` adalah isi lampiran surat SAAT INI. Disimpan apa adanya sebagai
     * salinan isi saat terbit, supaya nanti bisa diketahui apa yang berubah
     * sejak surat ditandatangani. Boleh kosong untuk pemanggil lama; akibatnya
     * surat itu hanya bisa dibandingkan total honornya.
     */
    daftarMitra: { pplMasterId: string; totalHonor: number; baris?: BarisKontrak[] }[],
    username?: string,
    /**
     * Nomor urut awal yang diminta pengguna, mis. melanjutkan buku agenda
     * manual yang sudah sampai 89 sehingga surat pertama harus 90.
     * Hanya dipakai bila LEBIH BESAR dari nomor tertinggi yang sudah dipakai —
     * memundurkan nomor akan menabrak surat yang sudah terlanjur terbit.
     */
    nomorMulai?: number,
): Promise<Record<string, { nomorUrut: number; nomorSurat: string }>> => {
    const template = await getTemplateAktif();
    const pola = template?.format_nomor || POLA_SPK_BAWAAN;
    const tanggal = new Date(`${tanggalSurat}T00:00:00`);

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const [existing] = await connection.query<RowDataPacket[]>(
            // Hanya surat AKTIF yang dianggap "sudah punya nomor". Surat batal
            // memang masih memegang nomornya di Riwayat Surat, tapi tidak boleh
            // membuat mitra terlewat saat surat penggantinya digenerate.
            `SELECT ppl_master_id, nomor_urut, nomor_surat FROM kontrak_mitra
              WHERE periode_mulai = ? AND periode_selesai = ? AND status = 'aktif'`,
            [periodeMulai, periodeSelesai]
        );
        const sudahAda = new Map<string, { nomorUrut: number; nomorSurat: string }>(
            existing.map(r => [r.ppl_master_id, { nomorUrut: r.nomor_urut, nomorSurat: r.nomor_surat }])
        );

        // Nomor baru melanjutkan nomor tertinggi yang pernah dipakai di tahun
        // surat yang sama, supaya penomoran berurutan sepanjang tahun.
        const [maksRows] = await connection.query<RowDataPacket[]>(
            'SELECT COALESCE(MAX(nomor_urut), 0) AS maks FROM kontrak_mitra WHERE YEAR(tanggal_surat) = ?',
            [tanggal.getFullYear()]
        );
        const maksTerpakai = Number(maksRows[0]?.maks || 0);

        // Aturannya dipakai bersama dengan klien (@shared/nomorAwal) supaya
        // angka yang diperlihatkan di layar sebelum memesan benar-benar sama
        // dengan yang nanti tercatat. `berikutnya` adalah nomor SEBELUM yang
        // pertama, karena di dalam loop selalu dinaikkan lebih dulu.
        let berikutnya = nomorPertama(maksTerpakai, nomorMulai) - 1;

        const hasil: Record<string, { nomorUrut: number; nomorSurat: string }> = {};

        for (const mitra of daftarMitra) {
            const lama = sudahAda.get(mitra.pplMasterId);
            if (lama) {
                hasil[mitra.pplMasterId] = lama;
                continue;
            }
            berikutnya += 1;
            const nomorSurat = susunNomorSurat(pola, berikutnya, tanggal);
            const isi = (mitra.baris ?? []).map(keBarisIsi);
            await connection.execute(
                `INSERT INTO kontrak_mitra
                    (ppl_master_id, periode_mulai, periode_selesai, nomor_urut, nomor_surat, tanggal_surat, total_honor,
                     isi_terbit, total_volume, jumlah_baris, template_id, generatedBy)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [mitra.pplMasterId, periodeMulai, periodeSelesai, berikutnya, nomorSurat, tanggalSurat,
                 mitra.totalHonor,
                 isi.length > 0 ? JSON.stringify(isi) : null,
                 isi.reduce((j, b) => j + b.volume, 0),
                 isi.length,
                 template?.id ?? null, username ?? null]
            );
            hasil[mitra.pplMasterId] = { nomorUrut: berikutnya, nomorSurat };
        }

        await connection.commit();
        return hasil;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

/**
 * Menetapkan nomor Surat BAST untuk sekumpulan mitra pada satu periode.
 *
 * BAST TIDAK punya penomoran sendiri. Nomornya disusun dari `nomor_urut` milik
 * SPK mitra yang sama dengan pola `format_nomor_bast`, sehingga SPK dan BAST
 * seorang mitra selalu berpasangan tanpa perlu dicocokkan manual. Karena itu di
 * sini TIDAK ada `MAX(nomor_urut)` dan tidak ada `nomorMulai`: tidak ada nomor
 * baru yang lahir, hanya nomor yang sudah ada disusun ulang dengan pola lain.
 *
 * Penanda bulan/tahun diambil dari `tanggalBast`, bukan tanggal SPK — BAST yang
 * terbit Maret atas SPK Februari harus menyebut Maret.
 *
 * Mitra yang SPK-nya belum pernah digenerate dikembalikan lewat `tanpaSpk`, agar
 * layar bisa menyebut namanya alih-alih gagal diam-diam.
 *
 * Idempoten: mitra yang sudah punya `nomor_bast` menerima nomor yang sama lagi,
 * sehingga cetak ulang menghasilkan surat yang identik.
 */
export const pesanNomorBast = async (
    periodeMulai: string,
    periodeSelesai: string,
    tanggalBast: string,
    daftarPplMasterId: string[],
    username?: string,
): Promise<{
    hasil: Record<string, { nomorBast: string; tanggalBast: string }>;
    tanpaSpk: string[];
}> => {
    const template = await getTemplateAktif();
    const pola = template?.format_nomor_bast || POLA_BAST_BAWAAN;
    const tanggal = new Date(`${tanggalBast}T00:00:00`);

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const [existing] = await connection.query<RowDataPacket[]>(
            `SELECT ppl_master_id, nomor_urut, nomor_bast,
                    DATE_FORMAT(tanggal_bast, '%Y-%m-%d') AS tanggal_bast
               FROM kontrak_mitra
              WHERE periode_mulai = ? AND periode_selesai = ? AND status = 'aktif'`,
            [periodeMulai, periodeSelesai]
        );
        const kontrak = new Map<string, RowDataPacket>(
            existing.map(r => [r.ppl_master_id, r])
        );

        const hasil: Record<string, { nomorBast: string; tanggalBast: string }> = {};
        const tanpaSpk: string[] = [];

        for (const pplMasterId of daftarPplMasterId) {
            const baris = kontrak.get(pplMasterId);
            if (!baris) {
                tanpaSpk.push(pplMasterId);
                continue;
            }

            if (baris.nomor_bast) {
                hasil[pplMasterId] = {
                    nomorBast: baris.nomor_bast,
                    tanggalBast: baris.tanggal_bast,
                };
                continue;
            }

            const nomorBast = susunNomorSurat(pola, Number(baris.nomor_urut), tanggal);
            await connection.execute(
                `UPDATE kontrak_mitra
                    SET nomor_bast = ?, tanggal_bast = ?,
                        bastGeneratedAt = CURRENT_TIMESTAMP, bastGeneratedBy = ?
                  WHERE ppl_master_id = ? AND periode_mulai = ? AND periode_selesai = ?
                    AND status = 'aktif'`,
                [nomorBast, tanggalBast, username ?? null, pplMasterId, periodeMulai, periodeSelesai]
            );
            hasil[pplMasterId] = { nomorBast, tanggalBast };
        }

        await connection.commit();
        return { hasil, tanpaSpk };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

/**
 * Nomor urut tertinggi yang sudah terpakai pada sebuah tahun surat.
 *
 * Angka yang SAMA dipakai `pesanNomorKontrak` untuk menentukan nomor berikutnya.
 * Diekspor supaya layar bisa memperlihatkannya sebelum pengguna memesan nomor —
 * sebelumnya layar menghitung sendiri dari periode yang sedang tampil, sehingga
 * peringatan "nomor sudah terpakai" bisa diam-diam gagal muncul untuk nomor
 * yang terbit di periode lain pada tahun yang sama.
 */
export const getMaksNomorUrut = async (tahun: number): Promise<number> => {
    const [rows] = await db.query<RowDataPacket[]>(
        'SELECT COALESCE(MAX(nomor_urut), 0) AS maks FROM kontrak_mitra WHERE YEAR(tanggal_surat) = ?',
        [tahun]
    );
    return Number(rows[0]?.maks || 0);
};

export interface HasilAturUlangNomor {
    terhapus: number;
    jumlahBast: number;
    nomorSurat: string[];
    nomorBast: string[];
}

/**
 * Menghapus seluruh nomor surat pada satu periode sehingga bisa dinomori ulang.
 *
 * Nomor surat sengaja bersifat permanen: sekali seorang mitra punya baris di
 * `kontrak_mitra`, `pesanNomorKontrak` selalu mengembalikan nomor yang sama dan
 * mengabaikan "Mulai dari Nomor". Fungsi ini satu-satunya jalan keluarnya, dan
 * karena itu dijaga frasa konfirmasi di route.
 *
 * BARIS DIHAPUS, bukan kolomnya di-NULL-kan: `nomor_urut` dan `nomor_surat`
 * NOT NULL, jadi meng-NULL-kan butuh migrasi dan memaksa setiap pembaca
 * menoleransi baris setengah jadi. `total_honor` yang ikut hilang hanyalah
 * cuplikan yang bisa dihitung ulang dari `ppl_honorarium`.
 *
 * NOMOR BAST IKUT TERHAPUS karena menumpang baris yang sama — dilaporkan balik
 * lewat `jumlahBast` supaya layar bisa menyebutkannya, bukan mengejutkan
 * pengguna setelahnya.
 *
 * Tidak dicatat ke `riwayat_kegiatan`: tabel itu terikat SATU kegiatan
 * (`kegiatanId NOT NULL`), sedangkan satu periode kontrak membentang lintas
 * banyak kegiatan. Memilih salah satu sebagai pemiliknya akan memalsukan
 * riwayat kegiatan tersebut. Untuk sekarang cukup dicatat ke log server.
 */
export const aturUlangNomorPeriode = async (
    periodeMulai: string,
    periodeSelesai: string,
    username?: string,
): Promise<HasilAturUlangNomor> => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const [baris] = await connection.query<RowDataPacket[]>(
            `SELECT nomor_surat, nomor_bast FROM kontrak_mitra
              WHERE periode_mulai = ? AND periode_selesai = ? FOR UPDATE`,
            [periodeMulai, periodeSelesai]
        );

        const nomorSurat = baris.map(b => String(b.nomor_surat)).filter(Boolean);
        const nomorBast = baris.map(b => b.nomor_bast).filter(Boolean).map(String);

        const [hasil] = await connection.execute<OkPacket>(
            'DELETE FROM kontrak_mitra WHERE periode_mulai = ? AND periode_selesai = ?',
            [periodeMulai, periodeSelesai]
        );

        // Dicatat DI DALAM transaksi yang sama: kalau penghapusannya batal,
        // catatannya ikut batal, dan sebaliknya tidak akan ada penghapusan yang
        // lolos tanpa jejak. Inilah satu-satunya tempat nomor yang sudah
        // dihapus masih bisa ditelusuri — barisnya sendiri, berikut
        // `generatedBy`-nya, sudah lenyap.
        await connection.execute(
            `INSERT INTO riwayat_surat
                (aksi, periode_mulai, periode_selesai, jumlah, jumlah_bast, nomor_surat, nomor_bast, aktorNama)
             VALUES ('atur_ulang_nomor', ?, ?, ?, ?, ?, ?, ?)`,
            [periodeMulai, periodeSelesai, hasil.affectedRows, nomorBast.length,
             nomorSurat.join(', ') || null, nomorBast.join(', ') || null, username ?? null]
        );

        await connection.commit();

        // Log server tetap diisi sebagai lapis kedua, untuk kasus tabelnya
        // sendiri bermasalah.
        console.warn('[atur-ulang-nomor]', JSON.stringify({
            oleh: username ?? null, periodeMulai, periodeSelesai,
            terhapus: hasil.affectedRows, nomorSurat, nomorBast,
        }));

        return {
            terhapus: hasil.affectedRows,
            jumlahBast: nomorBast.length,
            nomorSurat,
            nomorBast,
        };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

/** Peran sebuah akun; dipakai penjaga endpoint yang destruktif. */
export const peranPengguna = async (username: string): Promise<string | null> => {
    const [rows] = await db.query<RowDataPacket[]>(
        'SELECT role FROM users WHERE username = ? LIMIT 1', [username]
    );
    return rows[0]?.role ?? null;
};

// =====================================================================
// Riwayat Penyuratan: melihat, membatalkan, menomori ulang
//
// Nomor surat adalah dokumen resmi, jadi tidak ada yang hilang diam-diam.
// Surat yang tidak jadi dipakai DIBATALKAN (status 'batal' + catatan) dan tetap
// tampil di riwayat, sehingga "nomor 005 ke mana" selalu terjawab. Penghapusan
// permanen hanya untuk surat yang SUDAH batal — dan penghapusan itu sendiri
// dicatat ke `riwayat_surat`.
// =====================================================================

/** Satu tahun penyuratan, surat batal ikut, beserta nomor yang kosong. */
export const getRiwayatSurat = async (tahun: number): Promise<RiwayatSuratTahun> => {
    const [rows] = await db.query<RowDataPacket[]>(
        `SELECT km.id, km.nomor_urut, km.nomor_surat, km.nomor_bast, km.isi_terbit,
                DATE_FORMAT(km.tanggal_surat, '%Y-%m-%d') AS tanggal_surat,
                DATE_FORMAT(km.tanggal_bast,  '%Y-%m-%d') AS tanggal_bast,
                DATE_FORMAT(km.periode_mulai,   '%Y-%m-%d') AS periode_mulai,
                DATE_FORMAT(km.periode_selesai, '%Y-%m-%d') AS periode_selesai,
                km.ppl_master_id, pm.namaPPL, km.total_honor, km.status, km.catatan,
                DATE_FORMAT(km.dibatalkanPada, '%Y-%m-%d %H:%i') AS dibatalkanPada,
                km.dibatalkanOleh, km.generatedBy
           FROM kontrak_mitra km
           LEFT JOIN ppl_master pm ON pm.id = km.ppl_master_id
          WHERE YEAR(km.tanggal_surat) = ?
          ORDER BY km.nomor_urut, km.id`,
        [tahun]
    );

    // Data sekarang diambil SEKALI per periode, bukan per surat: satu periode
    // biasanya memuat banyak surat, dan `getDataKontrak` adalah kueri berat.
    const periodeUnik = new Map<string, { mulai: string; selesai: string }>();
    for (const r of rows) {
        periodeUnik.set(`${r.periode_mulai}|${r.periode_selesai}`,
            { mulai: r.periode_mulai, selesai: r.periode_selesai });
    }
    const dataPerPeriode = new Map<string, Map<string, DataKontrakMitra>>();
    for (const [kunci, p] of periodeUnik) {
        const data = await getDataKontrak(p.mulai, p.selesai);
        dataPerPeriode.set(kunci, new Map(data.map(m => [m.pplMasterId, m])));
    }

    const surat: RiwayatSuratItem[] = rows.map(r => {
        const sekarang = dataPerPeriode
            .get(`${r.periode_mulai}|${r.periode_selesai}`)
            ?.get(r.ppl_master_id);
        const isiTerbit = uraikanIsiTerbit(r.isi_terbit);
        const isiSekarang = (sekarang?.baris ?? []).map(keBarisIsi);
        const batal = r.status === 'batal';

        // Surat batal TIDAK dibandingkan: ia arsip, dan isinya memang harus
        // memperlihatkan keadaan saat surat itu dibatalkan. Menandainya "butuh
        // konfirmasi" hanya akan menuntut tindakan atas surat yang sudah tidak
        // berlaku.
        const beda = batal
            ? []
            : bandingkanIsiSurat(
                isiTerbit,
                r.total_honor === null || r.total_honor === undefined ? null : Number(r.total_honor),
                isiSekarang);

        return {
            id: Number(r.id),
            nomorUrut: Number(r.nomor_urut),
            nomorSurat: r.nomor_surat,
            nomorBast: r.nomor_bast ?? null,
            tanggalSurat: r.tanggal_surat,
            tanggalBast: r.tanggal_bast ?? null,
            pplMasterId: r.ppl_master_id,
            namaPPL: r.namaPPL ?? r.ppl_master_id,
            periodeMulai: r.periode_mulai,
            periodeSelesai: r.periode_selesai,
            totalHonor: Number(r.total_honor) || 0,
            status: batal ? 'batal' : 'aktif',
            catatan: r.catatan ?? null,
            dibatalkanPada: r.dibatalkanPada ?? null,
            dibatalkanOleh: r.dibatalkanOleh ?? null,
            generatedBy: r.generatedBy ?? null,
            // Yang tertulis di surat, bukan keadaan hari ini — kecuali untuk
            // surat lama yang tidak menyimpan salinan isinya.
            baris: isiTerbit ?? isiSekarang,
            perubahan: beda.length > 0 ? beda : undefined,
        };
    });

    return {
        tahun,
        surat,
        celah: celahNomor(surat.map(s => ({ id: s.id, nomorUrut: s.nomorUrut, status: s.status }))),
    };
};

/** Semua surat setahun dalam bentuk ringkas yang dipakai aturan penomoran. */
const suratBernomorTahun = async (
    connection: PoolConnection,
    tahun: number,
    kunci: boolean,
): Promise<SuratBernomor[]> => {
    const [rows] = await connection.query<RowDataPacket[]>(
        `SELECT id, nomor_urut, status FROM kontrak_mitra
          WHERE YEAR(tanggal_surat) = ? ORDER BY nomor_urut, id${kunci ? ' FOR UPDATE' : ''}`,
        [tahun]
    );
    return rows.map(r => ({
        id: Number(r.id),
        nomorUrut: Number(r.nomor_urut),
        status: r.status === 'batal' ? 'batal' : 'aktif',
    }));
};

/**
 * Menyusun ulang teks nomor surat (dan BAST bila ada) dari nomor urut baru.
 *
 * Teks nomornya TIDAK boleh sekadar diganti angkanya: polanya memuat bulan dan
 * tahun, jadi ia disusun ulang dengan pola yang sama seperti saat terbit.
 */
const tulisNomorBaru = async (
    connection: PoolConnection,
    id: number,
    nomorBaru: number,
    polaSpk: string,
    polaBast: string,
): Promise<void> => {
    const [rows] = await connection.query<RowDataPacket[]>(
        `SELECT DATE_FORMAT(tanggal_surat, '%Y-%m-%d') AS tanggal_surat,
                DATE_FORMAT(tanggal_bast,  '%Y-%m-%d') AS tanggal_bast, nomor_bast
           FROM kontrak_mitra WHERE id = ?`,
        [id]
    );
    const baris = rows[0];
    if (!baris) return;
    const nomorSurat = susunNomorSurat(polaSpk, nomorBaru, new Date(`${baris.tanggal_surat}T00:00:00`));
    const nomorBast = baris.nomor_bast && baris.tanggal_bast
        ? susunNomorSurat(polaBast, nomorBaru, new Date(`${baris.tanggal_bast}T00:00:00`))
        : null;
    await connection.execute(
        `UPDATE kontrak_mitra
            SET nomor_urut = ?, nomor_surat = ?, nomor_bast = COALESCE(?, nomor_bast)
          WHERE id = ?`,
        [nomorBaru, nomorSurat, nomorBast, id]
    );
};

export type HasilUbahNomor =
    | { ok: true; nomorSurat: string; nomorBast: string | null }
    | { ok: false; alasan: 'tidak-ada' | 'dipakai' };

/**
 * Mengganti nomor urut sebuah surat dengan nomor yang diketik tim keuangan,
 * mis. menyesuaikan buku agenda manual.
 *
 * Nomor yang sudah dipegang surat AKTIF lain ditolak. Bentrok dengan surat
 * BATAL diizinkan — surat batal tidak lagi berlaku — dan layar yang
 * memberitahukannya.
 */
export const ubahNomorSurat = async (
    id: number,
    nomorBaru: number,
    username?: string,
): Promise<HasilUbahNomor> => {
    const template = await getTemplateAktif();
    const polaSpk = template?.format_nomor || POLA_SPK_BAWAAN;
    const polaBast = template?.format_nomor_bast || POLA_BAST_BAWAAN;

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const [barisRows] = await connection.query<RowDataPacket[]>(
            `SELECT YEAR(tanggal_surat) AS tahun, nomor_urut, nomor_surat
               FROM kontrak_mitra WHERE id = ? FOR UPDATE`,
            [id]
        );
        const baris = barisRows[0];
        if (!baris) {
            await connection.rollback();
            return { ok: false, alasan: 'tidak-ada' };
        }
        const setahun = await suratBernomorTahun(connection, Number(baris.tahun), true);
        if (!nomorBolehDipakai(nomorBaru, setahun, id)) {
            await connection.rollback();
            return { ok: false, alasan: 'dipakai' };
        }
        await tulisNomorBaru(connection, id, nomorBaru, polaSpk, polaBast);
        const [sesudah] = await connection.query<RowDataPacket[]>(
            'SELECT nomor_surat, nomor_bast FROM kontrak_mitra WHERE id = ?', [id]
        );
        await connection.execute(
            `INSERT INTO riwayat_surat
                (aksi, periode_mulai, periode_selesai, jumlah, jumlah_bast, nomor_surat, nomor_bast, aktorNama)
             SELECT 'ubah_nomor', periode_mulai, periode_selesai, 1, 0, ?, ?, ?
               FROM kontrak_mitra WHERE id = ?`,
            [`${baris.nomor_surat} -> ${sesudah[0]?.nomor_surat}`, null, username ?? null, id]
        );
        await connection.commit();
        return {
            ok: true,
            nomorSurat: sesudah[0]?.nomor_surat,
            nomorBast: sesudah[0]?.nomor_bast ?? null,
        };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

/**
 * Membatalkan sebuah surat: nomornya tetap tercatat, tapi tidak lagi berlaku.
 *
 * Setelah ini mitra yang bersangkutan dianggap BELUM punya surat untuk periode
 * itu, sehingga surat penggantinya bisa digenerate dengan nomor baru.
 */
export const batalkanSurat = async (
    id: number,
    catatan: string,
    username?: string,
): Promise<boolean> => {
    const [hasil] = await db.execute<OkPacket>(
        `UPDATE kontrak_mitra
            SET status = 'batal', catatan = ?, dibatalkanPada = NOW(), dibatalkanOleh = ?
          WHERE id = ? AND status = 'aktif'`,
        [catatan || null, username ?? null, id]
    );
    if (hasil.affectedRows === 0) return false;
    await db.execute(
        `INSERT INTO riwayat_surat
            (aksi, periode_mulai, periode_selesai, jumlah, jumlah_bast, nomor_surat, nomor_bast, aktorNama)
         SELECT 'batalkan_surat', periode_mulai, periode_selesai, 1,
                IF(nomor_bast IS NULL, 0, 1), nomor_surat, nomor_bast, ?
           FROM kontrak_mitra WHERE id = ?`,
        [username ?? null, id]
    );
    return true;
};

/** Menyunting catatan sebuah surat batal, mis. memperjelas alasannya. */
export const ubahCatatanSurat = async (id: number, catatan: string): Promise<boolean> => {
    const [hasil] = await db.execute<OkPacket>(
        'UPDATE kontrak_mitra SET catatan = ? WHERE id = ?',
        [catatan || null, id]
    );
    return hasil.affectedRows > 0;
};

/**
 * Menghapus permanen sebuah surat yang SUDAH batal, supaya riwayat tidak penuh
 * nomor ganda yang membingungkan.
 *
 * Surat aktif tidak bisa dihapus lewat sini — batalkan dulu, supaya tidak ada
 * nomor berlaku yang lenyap dalam satu langkah. Nomor dan pemiliknya dicatat ke
 * `riwayat_surat` SEBELUM barisnya hilang: setelah ini, catatan itulah satu-
 * satunya jejak yang tersisa.
 */
export const hapusSuratBatal = async (id: number, username?: string): Promise<boolean> => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const [rows] = await connection.query<RowDataPacket[]>(
            `SELECT nomor_surat, nomor_bast, periode_mulai, periode_selesai, status, catatan
               FROM kontrak_mitra WHERE id = ? FOR UPDATE`,
            [id]
        );
        const baris = rows[0];
        if (!baris || baris.status !== 'batal') {
            await connection.rollback();
            return false;
        }
        await connection.execute(
            `INSERT INTO riwayat_surat
                (aksi, periode_mulai, periode_selesai, jumlah, jumlah_bast, nomor_surat, nomor_bast, aktorNama)
             VALUES ('hapus_surat_batal', ?, ?, 1, ?, ?, ?, ?)`,
            [baris.periode_mulai, baris.periode_selesai, baris.nomor_bast ? 1 : 0,
             baris.nomor_surat, baris.nomor_bast ?? null, username ?? null]
        );
        await connection.execute('DELETE FROM kontrak_mitra WHERE id = ?', [id]);
        await connection.commit();
        return true;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

/**
 * Merapatkan nomor surat AKTIF satu tahun menjadi 1, 2, 3, ... tanpa lubang.
 *
 * `pratinjau` mengembalikan rencananya tanpa mengubah apa pun, supaya layar bisa
 * memperlihatkan "004 jadi 003, 005 jadi 004" sebelum pengguna menyetujui.
 *
 * Nomor ditulis dalam DUA tahap lewat nomor sementara bertanda negatif: menulis
 * langsung bisa menabrak nomor yang belum sempat bergeser (mengubah 4 jadi 3
 * saat 3 masih ada). Nomor negatif tidak mungkin dipakai surat sungguhan.
 */
export const rapikanNomorTahun = async (
    tahun: number,
    pratinjau: boolean,
    username?: string,
): Promise<RencanaRapikan & { diterapkan: number }> => {
    const template = await getTemplateAktif();
    const polaSpk = template?.format_nomor || POLA_SPK_BAWAAN;
    const polaBast = template?.format_nomor_bast || POLA_BAST_BAWAAN;

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const setahun = await suratBernomorTahun(connection, tahun, !pratinjau);
        const rencana = rencanaRapikanNomor(setahun);

        if (pratinjau || rencana.perubahan.length === 0) {
            await connection.rollback();
            return { ...rencana, diterapkan: 0 };
        }

        for (const p of rencana.perubahan) {
            await connection.execute(
                'UPDATE kontrak_mitra SET nomor_urut = ? WHERE id = ?', [-p.baru, p.id]);
        }
        for (const p of rencana.perubahan) {
            await tulisNomorBaru(connection, p.id, p.baru, polaSpk, polaBast);
        }

        await connection.execute(
            `INSERT INTO riwayat_surat
                (aksi, periode_mulai, periode_selesai, jumlah, jumlah_bast, nomor_surat, nomor_bast, aktorNama)
             VALUES ('rapikan_nomor', ?, ?, ?, 0, ?, NULL, ?)`,
            [`${tahun}-01-01`, `${tahun}-12-31`, rencana.perubahan.length,
             rencana.perubahan.map(p => `${p.lama} -> ${p.baru}`).join(', '), username ?? null]
        );
        await connection.commit();
        return { ...rencana, diterapkan: rencana.perubahan.length };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

export type HasilPerbaruiIsi = 'ok' | 'tidak-ada' | 'tidak-aktif' | 'tanpa-data';

/**
 * "Perbarui kontrak": isi surat disegarkan mengikuti data sekarang, DENGAN
 * NOMOR YANG SAMA.
 *
 * Dipakai saat honor atau muatan berubah setelah surat terbit, atau ada
 * kegiatan baru yang masuk. Nomor sengaja tidak berubah — bagi tim keuangan
 * ini surat yang sama yang dicetak ulang, bukan surat baru; menerbitkan nomor
 * baru justru menciptakan dua surat untuk satu pekerjaan, persis masalah yang
 * baru saja ditutup.
 *
 * Setelah ini peringatan "isi berubah" hilang dengan sendirinya, karena
 * salinan isi yang dibandingkan sudah sama dengan data sekarang.
 */
export const perbaruiIsiSurat = async (id: number, username?: string): Promise<HasilPerbaruiIsi> => {
    const [rows] = await db.query<RowDataPacket[]>(
        `SELECT ppl_master_id, status, nomor_surat,
                DATE_FORMAT(periode_mulai,   '%Y-%m-%d') AS periode_mulai,
                DATE_FORMAT(periode_selesai, '%Y-%m-%d') AS periode_selesai
           FROM kontrak_mitra WHERE id = ?`,
        [id]
    );
    const surat = rows[0];
    if (!surat) return 'tidak-ada';
    // Surat batal tidak diperbarui: ia arsip, dan isinya harus tetap
    // memperlihatkan keadaan saat ia dibatalkan.
    if (surat.status !== 'aktif') return 'tidak-aktif';

    const data = await getDataKontrak(surat.periode_mulai, surat.periode_selesai);
    const mitra = data.find(m => m.pplMasterId === surat.ppl_master_id);
    // Mitra sudah tidak punya honor sama sekali di periode ini: memperbarui
    // akan menghasilkan surat kosong. Yang benar adalah membatalkan suratnya,
    // dan itu keputusan manusia, bukan efek samping tombol perbarui.
    if (!mitra || mitra.baris.length === 0) return 'tanpa-data';

    const isi = mitra.baris.map(keBarisIsi);
    await db.execute(
        `UPDATE kontrak_mitra
            SET total_honor = ?, isi_terbit = ?, total_volume = ?, jumlah_baris = ?,
                diperbaruiPada = NOW(), diperbaruiOleh = ?
          WHERE id = ?`,
        [mitra.totalHonor, JSON.stringify(isi), isi.reduce((j, b) => j + b.volume, 0),
         isi.length, username ?? null, id]
    );
    await db.execute(
        `INSERT INTO riwayat_surat
            (aksi, periode_mulai, periode_selesai, jumlah, jumlah_bast, nomor_surat, nomor_bast, aktorNama)
         VALUES ('perbarui_kontrak', ?, ?, 1, 0, ?, NULL, ?)`,
        [surat.periode_mulai, surat.periode_selesai, surat.nomor_surat, username ?? null]
    );
    return 'ok';
};

export interface SuratBerubah {
    suratId: number;
    nomorSurat: string;
    pplMasterId: string;
    namaPPL: string;
    periodeMulai: string;
    periodeSelesai: string;
    /** Kegiatan penyebab perubahan; null bila tidak bisa ditelusuri. */
    kegiatanId: number | null;
    namaKegiatan: string;
    /** Kalimat singkat perubahannya, mis. "Muatan 10 → 12 Dokumen". */
    ringkasan: string;
    occurredAt: string;
}

/**
 * Surat yang SUDAH terbit tetapi isinya tidak lagi sesuai data sekarang.
 *
 * Menjadi dasar notifikasi untuk tim keuangan. Sengaja memakai `getDataKontrak`
 * yang sama dengan layar Generate Surat, bukan kueri agregat tersendiri:
 * notifikasi yang memakai perhitungan sendiri cepat atau lambat akan berbeda
 * dari yang terlihat di layar, dan yang salah justru sulit dikenali karena
 * keduanya sama-sama "masuk akal".
 *
 * Biayanya satu `getDataKontrak` per periode yang punya surat aktif. Karena
 * surat dibuat per bulan, itu berarti segelintir periode saja.
 *
 * `occurredAt` memakai waktu surat terbit atau terakhir diperbarui, BUKAN waktu
 * perubahan datanya — kapan tepatnya honor diubah tidak tercatat di sini.
 * Akibatnya notifikasi ini tidak naik ke atas saat perubahan baru terjadi, dan
 * itu disengaja: yang penting ia ADA selama ketidaksesuaiannya belum dibereskan.
 */
export const suratBerubahSejakTerbit = async (): Promise<SuratBerubah[]> => {
    const [periode] = await db.query<RowDataPacket[]>(
        `SELECT DISTINCT
                DATE_FORMAT(periode_mulai,   '%Y-%m-%d') AS mulai,
                DATE_FORMAT(periode_selesai, '%Y-%m-%d') AS selesai
           FROM kontrak_mitra WHERE status = 'aktif'`
    );

    const [suratAktif] = await db.query<RowDataPacket[]>(
        `SELECT km.id, km.ppl_master_id, km.nomor_surat,
                COALESCE(pm.namaPPL, km.ppl_master_id) AS namaPPL,
                DATE_FORMAT(km.periode_mulai,   '%Y-%m-%d') AS periode_mulai,
                DATE_FORMAT(km.periode_selesai, '%Y-%m-%d') AS periode_selesai,
                COALESCE(km.diperbaruiPada, km.tanggal_surat) AS waktu
           FROM kontrak_mitra km
           LEFT JOIN ppl_master pm ON pm.id = km.ppl_master_id
          WHERE km.status = 'aktif'`
    );
    const waktuSurat = new Map<number, string>(
        suratAktif.map(r => [Number(r.id), new Date(r.waktu).toISOString()])
    );

    /** Data sekarang per periode, disimpan untuk dipakai lagi di bawah. */
    const dataPerPeriode = new Map<string, DataKontrakMitra[]>();
    const kunciPeriode = (mulai: string, selesai: string) => `${mulai}|${selesai}`;

    const hasil: SuratBerubah[] = [];
    for (const p of periode) {
        const data = await getDataKontrak(p.mulai, p.selesai);
        dataPerPeriode.set(kunciPeriode(p.mulai, p.selesai), data);
        for (const mitra of data) {
            if (!mitra.suratId || !mitra.perubahan?.length) continue;
            for (const beda of mitra.perubahan) {
                // `kunci` berbentuk "<kegiatanId>-<jenis>"; lihat BarisKontrak.kunci.
                const dariKunci = mitra.baris.find(b => b.uraianTugas === beda.judul)?.kunci;
                const kegiatanId = dariKunci ? Number(dariKunci.split('-')[0]) : NaN;
                hasil.push({
                    suratId: mitra.suratId,
                    nomorSurat: mitra.nomorSurat ?? '',
                    pplMasterId: mitra.pplMasterId,
                    namaPPL: mitra.nama,
                    periodeMulai: p.mulai,
                    periodeSelesai: p.selesai,
                    kegiatanId: Number.isInteger(kegiatanId) ? kegiatanId : null,
                    namaKegiatan: beda.judul,
                    ringkasan: beda.rincian.join(' '),
                    occurredAt: waktuSurat.get(mitra.suratId) ?? new Date().toISOString(),
                });
            }
        }
    }
    // Surat yang mitranya sudah TIDAK punya pekerjaan sama sekali pada periode
    // itu — kegiatannya dihapus, alokasinya dicabut, atau muatannya berpindah
    // seluruhnya ke bulan lain.
    //
    // Tidak mungkin tertangkap di atas: perbandingan berjalan per mitra yang
    // MASIH muncul di data sekarang, sedangkan mitra ini sudah lenyap dari
    // daftar. Padahal justru inilah perubahan terbesar yang bisa terjadi pada
    // sebuah surat, dan tanpa bagian ini ia satu-satunya yang lolos tanpa
    // peringatan — surat tetap berlaku untuk pekerjaan yang sudah tidak ada.
    for (const s of suratAktif) {
        const data = dataPerPeriode.get(kunciPeriode(s.periode_mulai, s.periode_selesai)) ?? [];
        const mitra = data.find(m => m.pplMasterId === s.ppl_master_id);
        if (mitra && mitra.baris.length > 0) continue;
        hasil.push({
            suratId: Number(s.id),
            nomorSurat: s.nomor_surat,
            pplMasterId: s.ppl_master_id,
            namaPPL: s.namaPPL,
            periodeMulai: s.periode_mulai,
            periodeSelesai: s.periode_selesai,
            kegiatanId: null,
            namaKegiatan: 'Tidak ada pekerjaan tersisa',
            ringkasan: 'Mitra sudah tidak punya honor sama sekali pada periode ini. Surat ini sebaiknya dibatalkan, bukan diperbarui.',
            occurredAt: waktuSurat.get(Number(s.id)) ?? new Date().toISOString(),
        });
    }

    return hasil;
};
