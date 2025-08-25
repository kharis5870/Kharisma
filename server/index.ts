import "dotenv/config";
import express from "express";
import cors from "cors";
import kegiatanRoutes from './routes/kegiatan';
import honorRoutes from './routes/honor';
import pplRoutes from './routes/ppl';
import ketuaTimRoutes from './routes/ketuaTim'; 

export function createServer() {
  const app = express();
  
  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API routes
  app.use('/api/kegiatan', kegiatanRoutes);
  app.use('/api/honor', honorRoutes);
  app.use('/api/ppl', pplRoutes);
  app.use('/api/ketua-tim', ketuaTimRoutes); 

  return app;
}
