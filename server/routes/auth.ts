// server/routes/auth.ts

import { Router, type Request } from 'express';
import { authenticateUser, gantiPassword, versiTokenPengguna } from '../services/authService';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { buatToken, RAHASIA_SESI, UMUR_TOKEN_DETIK } from '../auth/token';
import { wajibLogin } from '../auth/middleware';
// Jalur relatif, BUKAN @shared — nilai runtime di kode server.
import { periksaPassword } from '../../shared/aturanPassword';

const router = Router();

/**
 * Alamat pemohon untuk kunci rate limiter.
 *
 * `ipKeyGenerator` menyamakan satu blok IPv6 menjadi satu kunci; tanpa itu satu
 * orang bisa berganti alamat IPv6 di bloknya untuk lolos dari batas. Alamatnya
 * sendiri benar karena `trust proxy` disetel di server/index.ts.
 */
const ipPemohon = (req: Request): string =>
	ipKeyGenerator(req.ip ?? req.socket.remoteAddress ?? '');

/**
 * Batas percobaan login PER AKUN PER ALAMAT.
 *
 * Sebelumnya kuncinya hanya IP. Di kantor, semua pegawai keluar lewat satu
 * alamat (NAT kantor / FortiClient), jadi satu orang yang salah ketik password
 * 10 kali mengunci login SELURUH kantor selama 15 menit — terbukti saat diuji.
 * Dengan menyertakan username, yang terkunci hanya akun yang sedang ditebak.
 *
 * `skipSuccessfulRequests`: yang dihitung hanya percobaan GAGAL. Tanpa itu
 * login yang benar pun ikut dihitung — terbukti saat diuji, login benar yang
 * ke-11 dibalas 429 — sehingga orang yang login ulang beberapa kali (sesi habis,
 * pindah perangkat) terkunci tanpa pernah salah password.
 */
const loginLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 menit
	max: 10, // 10 percobaan per akun per alamat per 15 menit
	standardHeaders: true,
	legacyHeaders: false,
	keyGenerator: (req) => `${ipPemohon(req)}|${String(req.body?.username ?? '').trim().toLowerCase()}`,
	skipSuccessfulRequests: true, message: { message: 'Terlalu banyak percobaan login. Silakan coba lagi setelah 15 menit.' }
});

/**
 * Batas kasar per alamat, menutup celah yang dibuka kunci per akun di atas:
 * tanpa ini satu alamat bisa mencoba password yang sama ke ratusan username.
 * Angkanya longgar supaya satu kantor yang login bersamaan pagi hari tidak
 * tertahan.
 */
const loginIpLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 100,
	standardHeaders: true,
	legacyHeaders: false,
	keyGenerator: (req) => ipPemohon(req),
	skipSuccessfulRequests: true, message: { message: 'Terlalu banyak percobaan login dari jaringan ini. Silakan coba lagi setelah 15 menit.' }
});

router.post('/login', loginIpLimiter, loginLimiter, async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username dan password dibutuhkan.' });
    }

    try {
        const user = await authenticateUser(username, password);
        if (user) {
            // Token inilah bukti login yang dibawa setiap permintaan
            // berikutnya. Tanpa ini, seluruh API terpaksa memercayai nama
            // pengguna yang ditulis di badan permintaan — dan siapa pun bisa
            // menuliskan nama orang lain.
            //
            // Versinya ikut ditanam supaya token ini ikut tercabut bila
            // password akun diganti kelak.
            const versi = await versiTokenPengguna(user.id);
            const token = buatToken(user.id, RAHASIA_SESI, UMUR_TOKEN_DETIK, undefined, versi);
            res.json({ success: true, user, token, kedaluwarsaDetik: UMUR_TOKEN_DETIK });
        } else {
            res.status(401).json({ success: false, message: 'Username atau password salah.' });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
    }
});

// Rate limiter terpisah untuk ganti password — endpoint ini juga memeriksa
// password, jadi tanpa batas ia bisa dipakai menebak password lama.
// Kuncinya id akun (sudah pasti ada, dipasang setelah wajibLogin), bukan IP,
// dengan alasan yang sama seperti loginLimiter.
const passwordLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 10,
	standardHeaders: true,
	legacyHeaders: false,
	keyGenerator: (req) => req.user?.id ?? ipPemohon(req),
	message: { message: 'Terlalu banyak percobaan. Silakan coba lagi setelah 15 menit.' }
});

/**
 * Ganti password. Satu-satunya route di bawah /api/auth yang MENUNTUT login.
 *
 * Nama penggunanya diambil dari token, bukan dari badan permintaan: kalau dari
 * body, endpoint ini bisa dipakai menebak password lama milik akun mana pun —
 * seseorang tinggal mengirim username orang lain berulang kali. Sekarang ia
 * hanya bisa mengubah password akunnya sendiri.
 */
router.put('/password', wajibLogin, passwordLimiter, async (req, res) => {
    const { passwordLama, passwordBaru } = req.body ?? {};
    const username = req.user!.username;

    if (!passwordLama || !passwordBaru) {
        return res.status(400).json({ message: 'Password lama dan password baru wajib diisi.' });
    }
    // Aturan yang sama dengan layar dan dengan akun buatan admin.
    const galatPassword = periksaPassword(passwordBaru, username);
    if (galatPassword) {
        return res.status(400).json({ message: galatPassword });
    }
    if (passwordLama === passwordBaru) {
        return res.status(400).json({ message: 'Password baru harus berbeda dari password lama.' });
    }

    try {
        const hasil = await gantiPassword(username, passwordLama, passwordBaru);
        if (!hasil.ok) {
            // 400, bukan 401: pengguna sudah masuk, yang salah adalah isian form.
            return res.status(400).json({ message: hasil.pesan });
        }
        // Mengganti password mencabut SEMUA token lama akun ini, termasuk yang
        // sedang dipakai. Token pengganti dikirim supaya sesi ini tetap jalan,
        // sementara sesi di perangkat lain berhenti.
        const token = buatToken(hasil.userId!, RAHASIA_SESI, UMUR_TOKEN_DETIK, undefined, hasil.tokenVersi);
        res.json({ success: true, message: 'Password berhasil diubah.', token });
    } catch (error) {
        console.error('Ganti password error:', error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
    }
});

export default router;
