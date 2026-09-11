// server/routes/auth.ts

import { Router } from 'express';
import { authenticateUser, gantiPassword } from '../services/authService';
import rateLimit from 'express-rate-limit';
import { buatToken, RAHASIA_SESI, UMUR_TOKEN_DETIK } from '../auth/token';
import { wajibLogin } from '../auth/middleware';

const router = Router();

// PERBAIKAN: Tambahkan rate limiter
const loginLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 menit
	max: 10, // Batasi setiap IP hingga 10 permintaan login per 15 menit
	standardHeaders: true,
	legacyHeaders: false,
    message: { message: 'Terlalu banyak percobaan login. Silakan coba lagi setelah 15 menit.' }
});

router.post('/login', loginLimiter, async (req, res) => { // Terapkan limiter di sini
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
            const token = buatToken(user.id, RAHASIA_SESI);
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
const passwordLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 10,
	standardHeaders: true,
	legacyHeaders: false,
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
    if (String(passwordBaru).length < 6) {
        return res.status(400).json({ message: 'Password baru minimal 6 karakter.' });
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
        res.json({ success: true, message: 'Password berhasil diubah.' });
    } catch (error) {
        console.error('Ganti password error:', error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
    }
});

export default router;