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
import alamatRoutes from './routes/alamat';
import pmlRoutes from './routes/pml';
import kontrakRoutes from './routes/kontrak';
import integrasiRoutes from './routes/integrasi';
import { wajibLogin } from './auth/middleware';

export function createServer() {
  const app = express();
  const baseURI = "/kharisma"; 

  app.use(cors());
  app.use(express.json());
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

  return app;
}
