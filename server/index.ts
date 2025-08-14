import "dotenv/config";
import express from "express";
import cors from "cors";
import multer from "multer"; // <-- Impor multer
import kegiatanRoutes from './routes/kegiatan';
import honorRoutes from './routes/honor';

export function createServer() {
  const app = express();
  
  // Konfigurasi Multer untuk menangani multipart/form-data
  const upload = multer();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Gunakan Multer di semua rute API. 
  // .any() berarti multer akan menerima semua file yang di-upload.
  // Ini akan mem-parse form data dan mengisi req.body dengan benar.
  app.use('/api', upload.any());

  // API routes
  app.use('/api/kegiatan', kegiatanRoutes);
  app.use('/api/honor', honorRoutes);

  return app;
}