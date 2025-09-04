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
  // Gunakan req.url, bukan req.path (Passenger suka "memotong" baseURI)
  if (req.url.startsWith(`${baseURI}/api`)) {
    return next();
  }
  res.sendFile(path.join(distPath, "index.html"));
});

// Redirect dari root path ('/') ke base URI aplikasi ('/kharisma')
app.get('/', (req, res) => {
  res.redirect(baseURI);
});

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port} for production`);
});