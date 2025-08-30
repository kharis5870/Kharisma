// server/node-build.ts

import path from "path";
import { createServer } from "./index";
import express from "express";

const app = createServer();
const port = process.env.PORT || 3000;

const distPath = path.join(__dirname, "../spa");
const baseURI = "/kharisma"; // Definisikan secara eksplisit untuk produksi

// Sajikan file statis (CSS, JS) HANYA untuk path yang diawali dengan /kharisma
app.use(baseURI, express.static(distPath));

// Tangani semua rute React Router di bawah /kharisma
app.get(`${baseURI}/*`, (req, res, next) => {
  // Jika ini panggilan API, biarkan handler API yang bekerja
  if (req.path.startsWith(`${baseURI}/api`)) {
    return next();
  }
  // Untuk rute lain, kirim file index.html
  res.sendFile(path.join(distPath, "index.html"));
});

// Redirect dari root path ('/') ke base URI aplikasi ('/kharisma')
app.get('/', (req, res) => {
  res.redirect(baseURI);
});

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port} for production`);
});