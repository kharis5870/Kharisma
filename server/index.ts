import "dotenv/config";
import express from "express";
import cors from "cors";

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

export function createServer() {
  const app = express();
  const baseURI = "/kharisma"; // prefix untuk semua route di produksi

  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Semua endpoint API sekarang otomatis diawali /kharisma/api/...
  app.use(`${baseURI}/api/auth`, authRoutes); 
  app.use(`${baseURI}/api/kegiatan`, kegiatanRoutes);
  app.use(`${baseURI}/api/honor`, honorRoutes);
  app.use(`${baseURI}/api/ppl`, pplRoutes);
  app.use(`${baseURI}/api/ketua-tim`, ketuaTimRoutes);
  app.use(`${baseURI}/api/admin`, adminRoutes);
  app.use(`${baseURI}/api/settings`, settingsRoutes);
  app.use(`${baseURI}/api/notifikasi`, notifikasiRoutes);
  app.use(`${baseURI}/api/penilaian`, penilaianRoutes);

  return app;
}
