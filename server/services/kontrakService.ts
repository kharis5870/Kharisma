// server/services/kontrakService.ts

import { RowDataPacket, OkPacket } from 'mysql2';
import db from '../db';
// Jalur relatif, BUKAN alias @shared: vite.config.ts memuat kode server lewat
// Node saat menyusun konfigurasi, dan alias belum terpasang pada saat itu.
// Impor tipe selama ini aman karena terhapus saat kompilasi — ini nilai runtime.
import { nomorPertama } from '../../shared/nomorAwal';
import { susunNomorSurat } from '../../shared/nomorSurat';
import { TemplateSurat, UraianTugasKontrak, DataKontrakMitra, BarisKontrak } from '@shared/api';

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
const rentangHonor = (tahap: 'Listing' | 'Pencacahan' | 'Pengolahan') => {
    const awalBulan = `STR_TO_DATE(CONCAT('01-', k.bulanHonor${tahap}), '%d-%m-%Y')`;
    return {
        mulai: `COALESCE(k.tanggalMulaiHonor${tahap}, ${awalBulan})`,
        selesai: `COALESCE(k.tanggalSelesaiHonor${tahap}, LAST_DAY(${awalBulan}))`,
    };
};

const listing = rentangHonor('Listing');
const pencacahan = rentangHonor('Pencacahan');
const pengolahan = rentangHonor('Pengolahan');

/** Kegiatan ikut terhitung bila rentang honornya BERIRISAN dengan periode filter. */
const KONDISI_PERIODE = `(
    (p.tahap = 'listing'             AND ${listing.mulai}    <= ? AND ${listing.selesai}    >= ?) OR
    (p.tahap = 'pencacahan'          AND ${pencacahan.mulai} <= ? AND ${pencacahan.selesai} >= ?) OR
    (p.tahap = 'pengolahan-analisis' AND ${pengolahan.mulai} <= ? AND ${pengolahan.selesai} >= ?)
)`;

/** Tanggal mulai/selesai honor sesuai tahap baris tersebut. */
const MULAI_SESUAI_TAHAP = `CASE p.tahap
    WHEN 'listing' THEN DATE_FORMAT(${listing.mulai}, '%Y-%m-%d')
    WHEN 'pencacahan' THEN DATE_FORMAT(${pencacahan.mulai}, '%Y-%m-%d')
    WHEN 'pengolahan-analisis' THEN DATE_FORMAT(${pengolahan.mulai}, '%Y-%m-%d')
END`;
const SELESAI_SESUAI_TAHAP = `CASE p.tahap
    WHEN 'listing' THEN DATE_FORMAT(${listing.selesai}, '%Y-%m-%d')
    WHEN 'pencacahan' THEN DATE_FORMAT(${pencacahan.selesai}, '%Y-%m-%d')
    WHEN 'pengolahan-analisis' THEN DATE_FORMAT(${pengolahan.selesai}, '%Y-%m-%d')
END`;

const paramPeriode = (mulai: string, selesai: string) => [
    selesai, mulai, selesai, mulai, selesai, mulai,
];

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
export const getDataKontrak = async (tanggalMulai: string, tanggalSelesai: string): Promise<DataKontrakMitra[]> => {
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
            ${MULAI_SESUAI_TAHAP} AS jangkaWaktuMulai,
            ${SELESAI_SESUAI_TAHAP} AS jangkaWaktuSelesai
         FROM ppl p
         JOIN kegiatan k ON p.kegiatanId = k.id
         JOIN ppl_master pm ON p.ppl_master_id = pm.id
         LEFT JOIN ppl_honorarium ph
                ON ph.ppl_id = p.id AND ph.jenis_pekerjaan = ${JENIS_DARI_TAHAP}
         LEFT JOIN honorarium_kegiatan hk
                ON hk.kegiatanId = k.id AND hk.jenis_pekerjaan = ${JENIS_DARI_TAHAP}
         WHERE ${KONDISI_PERIODE}
         ORDER BY pm.namaPPL, k.namaKegiatan`,
        paramPeriode(tanggalMulai, tanggalSelesai)
    );

    const perMitra = new Map<string, DataKontrakMitra>();

    for (const row of rows) {
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

        const baris: BarisKontrak = {
            uraianTugas: row.uraian_tugas || `${row.namaKegiatan} ${LABEL_TAHAP[row.jenis_pekerjaan] || ''}`.trim(),
            jangkaWaktuMulai: row.jangkaWaktuMulai,
            jangkaWaktuSelesai: row.jangkaWaktuSelesai,
            volume: Number(row.bebanKerja) || 0,
            satuan: row.satuanBebanKerja || '',
            hargaSatuan: Number(row.hargaSatuan) || 0,
            nilaiPerjanjian: Number(row.besaranHonor) || 0,
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
        `SELECT ppl_master_id, nomor_urut, nomor_surat, nomor_bast,
                DATE_FORMAT(tanggal_surat, '%Y-%m-%d') AS tanggal_surat,
                DATE_FORMAT(tanggal_bast,  '%Y-%m-%d') AS tanggal_bast
           FROM kontrak_mitra WHERE periode_mulai = ? AND periode_selesai = ?`,
        [tanggalMulai, tanggalSelesai]
    );
    for (const n of nomorRows) {
        const mitra = perMitra.get(n.ppl_master_id);
        if (mitra) {
            mitra.nomorUrut = n.nomor_urut;
            mitra.nomorSurat = n.nomor_surat;
            mitra.tanggalSurat = n.tanggal_surat;
            // Kosong bila BAST-nya belum pernah dibuat. Tab BAST memakai query
            // yang sama dengan tab SPK, jadi tidak ada permintaan tambahan.
            mitra.nomorBast = n.nomor_bast ?? undefined;
            mitra.tanggalBast = n.tanggal_bast ?? undefined;
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
    daftarMitra: { pplMasterId: string; totalHonor: number }[],
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
            'SELECT ppl_master_id, nomor_urut, nomor_surat FROM kontrak_mitra WHERE periode_mulai = ? AND periode_selesai = ?',
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
            await connection.execute(
                `INSERT INTO kontrak_mitra
                    (ppl_master_id, periode_mulai, periode_selesai, nomor_urut, nomor_surat, tanggal_surat, total_honor, template_id, generatedBy)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [mitra.pplMasterId, periodeMulai, periodeSelesai, berikutnya, nomorSurat, tanggalSurat,
                 mitra.totalHonor, template?.id ?? null, username ?? null]
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
               FROM kontrak_mitra WHERE periode_mulai = ? AND periode_selesai = ?`,
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
                  WHERE ppl_master_id = ? AND periode_mulai = ? AND periode_selesai = ?`,
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
