import mysql from 'mysql2/promise';
import 'dotenv/config';

/**
 * Zona waktu aplikasi: WIB, TIDAK mengikuti mesin server.
 *
 * Di laptop semuanya kebetulan benar karena laptop dan MariaDB-nya sama-sama
 * berjalan dalam WIB. Server cPanel umumnya berjalan dalam UTC, dan tanpa
 * pengaturan ini dua hal bergeser 7 jam:
 * - `timezone`: cara mysql2 menerjemahkan Date JavaScript <-> DATETIME. Waktu
 *   riwayat tersimpan 07:18 padahal kejadiannya 14:18.
 * - `SET time_zone`: NOW()/CURDATE()/CURRENT_TIMESTAMP di MySQL. Batas
 *   15 menit "Batal Simpan Kegiatan" membandingkan NOW() dengan waktu riwayat,
 *   dan tenggat notifikasi memakai CURDATE() — keduanya meleset tanpa ini.
 *
 * Bentuk '+07:00' (bukan 'Asia/Jakarta') dipakai karena tidak membutuhkan
 * tabel zona waktu MySQL, yang sering belum terisi di hosting bersama.
 */
const ZONA_WAKTU = '+07:00';

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: Number(process.env.DB_PORT),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    timezone: ZONA_WAKTU,
});

// Setiap koneksi baru di pool langsung disetel zona waktunya. Event ini
// diteruskan dari pool inti mysql2 (lib/promise/pool.js), jadi objeknya
// koneksi berbasis callback — perintah ini masuk antrean koneksi SEBELUM
// kueri pertama yang memakainya.
pool.on('connection', (koneksi) => {
    (koneksi as any).query(`SET time_zone = '${ZONA_WAKTU}'`, (galat: unknown) => {
        if (galat) console.error('[db] Gagal menyetel time_zone koneksi:', galat);
    });
});

export default pool;
