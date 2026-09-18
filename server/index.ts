import "dotenv/config";
import express, { type ErrorRequestHandler } from "express";
import compression from "compression";

// Import semua route
import kegiatanRoutes from './routes/kegiatan';
import honorRoutes from './routes/honor';
import pplRoutes from './routes/ppl';
import ketuaTimRoutes from './routes/ketuaTim';
import adminRoutes from './routes/admin';
import authRoutes from './routes/auth';
import settingsRoutes from './routes/settings';
import notifikasiRoutes from './routes/notifikasi';
import penilaianRoutes from './routes/penilaian';
import alamatRoutes from './routes/alamat';
import pmlRoutes from './routes/pml';
import kontrakRoutes from './routes/kontrak';
import integrasiRoutes from './routes/integrasi';
import { wajibLogin } from './auth/middleware';
import { galatUntukKlien } from './routes/utilRoute';
import pool from './db';

/**
 * Penangan galat terakhir untuk seluruh API.
 *
 * Menangkap galat yang diteruskan lewat `next(error)` — dari handler yang
 * dibungkus `tangani`, dari middleware, dan dari pembaca badan JSON. Tanpa ini
 * Express memakai penangan bawaannya yang membalas halaman HTML, bukan JSON
 * yang dimengerti apiClient.
 */
const penanganGalatApi: ErrorRequestHandler = (err, req, res, next) => {
  if (res.headersSent) return next(err);
  if (err?.type === 'entity.too.large') {
    return res.status(413).json({ message: 'Data yang dikirim terlalu besar.' });
  }
  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Format data yang dikirim tidak valid.' });
  }
  const { status, message } = galatUntukKlien(err, 'Terjadi kesalahan pada server.');
  // Penolakan yang disengaja (4xx) bukan kerusakan; tidak perlu memenuhi log.
  if (status >= 500) console.error(`[api] ${req.method} ${req.originalUrl}:`, err);
  res.status(status).json({ message });
};

export interface OpsiServer {
  /**
   * Dipasang HANYA oleh build produksi (node-build.ts). Menyalakan kompresi
   * respons. Tidak dipakai di mode dev, karena di sana aplikasi ini dipasang
   * sebagai middleware di depan server Vite dan ikut membungkus respons Vite.
   */
  produksi?: boolean;
}

export function createServer(opsi: OpsiServer = {}) {
  const app = express();
  const baseURI = "/kharisma";

  // Di cPanel aplikasi ini berada di belakang satu proxy (Apache/LiteSpeed →
  // Passenger). Tanpa ini `req.ip` adalah alamat proxy itu, sehingga rate
  // limiter login menganggap SEMUA orang sebagai satu pemohon.
  app.set('trust proxy', 1);

  // Tidak mengumumkan "X-Powered-By: Express" — informasi gratis bagi
  // pemindai celah otomatis.
  app.disable('x-powered-by');

  // Kompresi gzip/brotli, dipasang PALING DEPAN supaya berlaku untuk API
  // maupun berkas halaman. Bundle JS terbesar 1,3 MB dan daftar kegiatan
  // berupa JSON yang berulang-ulang; keduanya menyusut beberapa kali lipat,
  // dan itu yang paling terasa lewat VPN. Beban CPU-nya tidak berarti untuk
  // 20 pengguna.
  if (opsi.produksi) {
    app.use(compression());
  }

  // Header keamanan dasar, untuk halaman maupun API.
  // - nosniff: peramban tidak menebak-nebak jenis berkas (mis. menjalankan
  //   teks sebagai skrip).
  // - SAMEORIGIN: aplikasi tidak bisa dibingkai situs lain (clickjacking),
  //   tetapi tetap boleh membingkai halamannya sendiri.
  // - same-origin: alamat halaman (berisi id kegiatan) tidak dikirim ke situs
  //   luar lewat Referer saat membuka tautan dokumen.
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'same-origin');
    next();
  });

  // CORS sengaja TIDAK dipasang. Layar dan API disajikan dari alamat yang sama
  // (/kharisma dan /kharisma/api), jadi peramban tidak membutuhkannya.
  // `cors()` tanpa opsi sebelumnya membalas "Access-Control-Allow-Origin: *",
  // yang mengizinkan situs MANA PUN memanggil API ini dari peramban orang
  // yang sedang login.

  // Batas ukuran badan permintaan. Impor mitra membawa ratusan baris sekaligus
  // (450 mitra ≈ 110 KB, sudah melewati batas bawaan 100 KB), jadi jalurnya
  // diberi batas tersendiri yang lebih longgar. Harus dipasang SEBELUM
  // pembaca umum: badan yang sudah dibaca tidak dibaca ulang.
  app.use(`${baseURI}/api/admin/ppl/impor`, express.json({ limit: '5mb' }));
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  app.use(`${baseURI}/api/auth`, authRoutes);
  // SEMUA route di bawah ini menuntut token yang sah. Dipasang di satu tempat,
  // bukan per route, supaya endpoint baru ikut terlindungi secara bawaan —
  // bukan hanya kalau penulisnya ingat memasangnya.
  //
  // `/api/auth` di atas sengaja TERBUKA: login adalah pintu masuknya, jadi ia
  // tidak bisa menuntut sudah login lebih dulu. Ia sudah dijaga rate limiter.
  app.use(`${baseURI}/api`, wajibLogin);

  app.use(`${baseURI}/api/kegiatan`, kegiatanRoutes);
  app.use(`${baseURI}/api/honor`, honorRoutes);
  app.use(`${baseURI}/api/ppl`, pplRoutes);
  app.use(`${baseURI}/api/ketua-tim`, ketuaTimRoutes);
  app.use(`${baseURI}/api/admin`, adminRoutes);
  app.use(`${baseURI}/api/settings`, settingsRoutes);
  app.use(`${baseURI}/api/notifikasi`, notifikasiRoutes);
  app.use(`${baseURI}/api/penilaian`, penilaianRoutes);
  app.use(`${baseURI}/api/pml`, pmlRoutes);
  app.use(`${baseURI}/api/alamat`, alamatRoutes);
  app.use(`${baseURI}/api/kontrak`, kontrakRoutes);
  app.use(`${baseURI}/api/integrasi`, integrasiRoutes);

  // Endpoint API yang tidak ada dibalas JSON. Tanpa ini permintaan itu jatuh ke
  // penangan bawaan Express (atau ke halaman SPA di produksi) dan dibalas
  // HTML, yang tidak bisa dibaca apiClient.
  app.use(`${baseURI}/api`, (_req, res) => {
    res.status(404).json({ message: 'Endpoint tidak ditemukan.' });
  });

  // Terakhir, setelah semua route.
  app.use(`${baseURI}/api`, penanganGalatApi);

  return app;
}

/**
 * Menutup pool koneksi database.
 *
 * Dipakai server dev: Vite memulai ulang server Express setiap berkas di
 * `server/` berubah, dan setiap mulai ulang memuat modul `db` baru beserta pool
 * barunya. Pool lama yang tidak ditutup terus memegang koneksi — sampai MariaDB
 * menolak semua koneksi baru ("Too many connections"), seperti yang terjadi.
 */
export const tutupServer = (): Promise<void> => pool.end();
