// Dipisah dari server/services/kontrakService.ts tanpa mengubah isinya.

import { RowDataPacket, OkPacket } from 'mysql2';
import db from '../db';
import { nomorPertama } from '../../shared/nomorAwal';
import { susunNomorSurat } from '../../shared/nomorSurat';
import { BarisKontrak } from '@shared/api';
import { POLA_BAST_BAWAAN, POLA_SPK_BAWAAN, denganKunciNomorTahun } from './kontrakBantu';
import { getTemplateAktif } from './kontrakTemplate';
import { keBarisIsi, getDataKontrak } from './kontrakData';

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
     * Hanya `pplMasterId` yang dipakai. `totalHonor` dan `baris` dari layar
     * DIABAIKAN: isi dan total surat dihitung ulang di server dari data honor
     * periode ini, lalu disimpan sebagai salinan isi saat terbit.
     */
    daftarMitra: { pplMasterId: string; totalHonor: number; baris?: BarisKontrak[] }[],
    username?: string,
): Promise<Record<string, { nomorUrut: number; nomorSurat: string }>> => {
    const template = await getTemplateAktif();
    const pola = template?.format_nomor || POLA_SPK_BAWAAN;
    const tanggal = new Date(`${tanggalSurat}T00:00:00`);

    // Isi dan total surat DIHITUNG ULANG di server dari data honor periode ini,
    // bukan diambil dari layar. Layar yang dibuka sebelum honor diubah orang
    // lain mengirim angka lama, padahal surat resmi harus memuat angka sekarang.
    // `totalHonor` dan `baris` dari permintaan sengaja diabaikan.
    //
    // Dihitung SEBELUM meminjam koneksi transaksi, supaya satu permintaan tidak
    // memegang dua koneksi pool sekaligus.
    const dataSekarang = new Map(
        (await getDataKontrak(periodeMulai, periodeSelesai)).map(m => [m.pplMasterId, m]));
    const tanpaHonor = daftarMitra.filter(m => !dataSekarang.has(m.pplMasterId));
    if (tanpaHonor.length > 0) {
        throw Object.assign(
            new Error(`${tanpaHonor.length} mitra yang dipilih sudah tidak punya honor pada periode ini. Muat ulang halaman, lalu generate lagi.`),
            { statusCode: 409 });
    }

    const connection = await db.getConnection();
    try {
        // Satu penomoran per tahun pada satu waktu — lihat denganKunciNomorTahun.
        return await denganKunciNomorTahun(connection, tanggal.getFullYear(), async () => {
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
        let berikutnya = nomorPertama(maksTerpakai) - 1;

        const hasil: Record<string, { nomorUrut: number; nomorSurat: string }> = {};

        for (const mitra of daftarMitra) {
            const lama = sudahAda.get(mitra.pplMasterId);
            if (lama) {
                hasil[mitra.pplMasterId] = lama;
                continue;
            }
            berikutnya += 1;
            const nomorSurat = susunNomorSurat(pola, berikutnya, tanggal);
            const sekarang = dataSekarang.get(mitra.pplMasterId)!;
            const isi = sekarang.baris.map(keBarisIsi);
            await connection.execute(
                `INSERT INTO kontrak_mitra
                    (ppl_master_id, periode_mulai, periode_selesai, nomor_urut, nomor_surat, tanggal_surat, total_honor,
                     isi_terbit, total_volume, jumlah_baris, template_id, generatedBy)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [mitra.pplMasterId, periodeMulai, periodeSelesai, berikutnya, nomorSurat, tanggalSurat,
                 sekarang.totalHonor,
                 isi.length > 0 ? JSON.stringify(isi) : null,
                 isi.reduce((j, b) => j + b.volume, 0),
                 isi.length,
                 template?.id ?? null, username ?? null]
            );
            hasil[mitra.pplMasterId] = { nomorUrut: berikutnya, nomorSurat };
        }

        await connection.commit();
        return hasil;
        });
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
