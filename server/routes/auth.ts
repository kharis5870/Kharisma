// server/routes/auth.ts

import { Router } from 'express';
import { authenticateUser } from '../services/authService';

const router = Router();

router.post('/login', async (req, res) => {
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