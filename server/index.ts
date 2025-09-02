// server/index.ts

import "dotenv/config";
import express from "express";
import cors from "cors";
import kegiatanRoutes from './routes/kegiatan';
import honorRoutes from './routes/honor';
import pplRoutes from './routes/ppl';
import ketuaTimRoutes from './routes/ketuaTim';
import adminRoutes from './routes/admin';
import authRoutes from './routes/auth';
import settingsRoutes from './routes/settings';

export function createServer() {
  const app = express();
  
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use('/api/auth', authRoutes); // <-- Daftarkan rute auth baru
  app.use('/api/kegiatan', kegiatanRoutes);
  app.use('/api/honor', honorRoutes);
  app.use('/api/ppl', pplRoutes);
  app.use('/api/ketua-tim', ketuaTimRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/settings', settingsRoutes);

  return app;
}