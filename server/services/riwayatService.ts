// server/services/riwayatService.ts

import { RowDataPacket, PoolConnection } from 'mysql2/promise';
import db from '../db';
import { RiwayatKegiatan } from '@shared/api';

/**
 * Riwayat kegiatan.
 *
 * Berbeda dari notifikasi (yang dihitung saat dibaca), riwayat HARUS dicatat
 * saat kejadian berlangsung: kolom audit yang ada semuanya bertipe "terakhir"
 * dan ditimpa setiap perubahan, sedangkan `ppl_progress` bahkan tidak punya
 * kolom waktu maupun pelaku sama sekali. Tanpa tabel ini, urutan kejadian
 * tidak bisa direkonstruksi dari mana pun.
 */

export interface CatatanRiwayat {
    kegiatanId: number;
    aksi: string;
    entitas: 'kegiatan' | 'dokumen' | 'ppl' | 'progress' | 'honor' | 'penilaian';
    entitasId?: number | null;
    /** Meringkas operasi massal jadi satu baris: "menambahkan 12 dokumen". */
    jumlah?: number;
    aktorUserId?: string | null;
    aktorNama?: string | null;
    ringkasan?: string | null;
}

/**
 * Mencatat satu aksi.
 *
 * `koneksi` opsional dan HARUS diisi bila pemanggil sedang berada di dalam
 * transaksi — memakai pool saat transaksi terbuka berisiko menemui kunci baris
 * yang belum dilepas.
 *
 * Kegagalan pencatatan sengaja tidak dilempar: riwayat adalah catatan
 * pendamping, dan tidak boleh menggagalkan penyimpanan data utama.
 */
/**
 * Mencari users.id dari nama pelaku yang tercatat.
 *
 * KENAPA PERLU: `aktorUserId` dirancang menaut ke `users.id` — `getRiwayatKegiatan`
 * bahkan sudah LEFT JOIN ke sana — tetapi hampir semua pemanggil `catatRiwayat`
 * hanya menerima `username` dari route, bukan id-nya. Akibatnya kolom itu NULL
 * di seluruh 80 baris yang pernah ditulis, JOIN-nya tidak pernah menemukan
 * apa-apa, dan feed riwayat menampilkan campuran username mentah ("edi") dengan
 * nama lengkap ("Edianto, S.E") tergantung apa yang kebetulan dikirim pemanggil.
 *
 * Diselesaikan DI SINI, bukan dengan mengubah tanda tangan sepuluh fungsi
 * service: pencarian ini satu kali per baris riwayat lewat kolom unik, dan
 * riwayat ditulis jarang — jauh lebih murah daripada mengalirkan id pengguna
 * melalui setiap lapisan hanya untuk kolom pendamping.
 *
 * Dicoba sebagai username lebih dulu, baru nama lengkap: sebagian besar
 * pemanggil mengirim `req.user.username`, dan `users.username` unik sedangkan
 * `nama_lengkap` belum tentu.
 */
const cariIdPelaku = async (
    eksekutor: PoolConnection | typeof db,
    nama: string,
): Promise<string | null> => {
    const [rows] = await eksekutor.query<RowDataPacket[]>(
        'SELECT id FROM users WHERE username = ? OR nama_lengkap = ? ORDER BY (username = ?) DESC LIMIT 1',
        [nama, nama, nama],
    );
    return (rows[0]?.id as string) ?? null;
};

export const catatRiwayat = async (
    koneksi: PoolConnection | null,
    catatan: CatatanRiwayat,
): Promise<void> => {
    const eksekutor = koneksi ?? db;
    try {
        const aktorUserId = catatan.aktorUserId
            ?? (catatan.aktorNama ? await cariIdPelaku(eksekutor, catatan.aktorNama) : null);

        await eksekutor.execute(
            `INSERT INTO riwayat_kegiatan
                (kegiatanId, aksi, entitas, entitasId, jumlah, aktorUserId, aktorNama, ringkasan)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                catatan.kegiatanId,
                catatan.aksi,
                catatan.entitas,
                catatan.entitasId ?? null,
                catatan.jumlah ?? 1,
                aktorUserId,
                catatan.aktorNama ?? null,
                catatan.ringkasan ?? null,
            ],
        );
    } catch (error) {
        console.error('Gagal mencatat riwayat (diabaikan):', error);
    }
};

/**
 * Feed riwayat satu kegiatan.
 *
 * Dibatasi 50 baris di atas indeks (kegiatanId, terjadiPada), sehingga
 * biayanya tetap konstan berapa pun besar tabelnya. Dipanggil HANYA saat
 * dialog detail dibuka — daftar Dashboard tidak menyentuh tabel ini.
 */
export const getRiwayatKegiatan = async (kegiatanId: number): Promise<RiwayatKegiatan[]> => {
    const [rows] = await db.query<RowDataPacket[]>(
        `SELECT r.id, r.kegiatanId, r.aksi, r.entitas, r.entitasId, r.jumlah,
                r.aktorUserId,
                -- Nama lengkap dari akun dipakai lebih dulu supaya feed tidak
                -- lagi mencampur username mentah ("edi") dengan nama lengkap
                -- ("Edianto, S.E") tergantung pemanggilnya. Nama tersimpan jadi
                -- cadangan, sehingga riwayat tetap terbaca meski akun pelakunya
                -- sudah dihapus — itulah gunanya kolom aktorNama tetap disimpan.
                COALESCE(u.nama_lengkap, r.aktorNama, r.aktorUserId) AS aktorNama,
                r.ringkasan, r.terjadiPada
           FROM riwayat_kegiatan r
           LEFT JOIN users u ON u.id = r.aktorUserId
          WHERE r.kegiatanId = ?
          ORDER BY r.terjadiPada DESC, r.id DESC
          LIMIT 50`,
        [kegiatanId],
    );
    return rows.map(r => ({ ...r, jumlah: Number(r.jumlah) })) as RiwayatKegiatan[];
};
