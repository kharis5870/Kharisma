// server/routes/auth.ts

import { Router } from 'express';
import { authenticateUser } from '../services/authService';
import rateLimit from 'express-rate-limit';

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
            res.json({ success: true, user });
        } else {
            res.status(401).json({ success: false, message: 'Username atau password salah.' });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
    }
});

export default router;