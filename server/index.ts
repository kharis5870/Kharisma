import "dotenv/config";
import express from "express";
import cors from "cors";
import kegiatanRoutes from './routes/kegiatan';
import honorRoutes from './routes/honor';
import pplRoutes from './routes/ppl'; // <-- Impor rute PPL

export function createServer() {
  const app = express();
  
  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API routes
  app.use('/api/kegiatan', kegiatanRoutes);
  app.use('/api/honor', honorRoutes);
  app.use('/api/ppl', pplRoutes); // <-- Daftarkan rute PPL

  return app;
}
