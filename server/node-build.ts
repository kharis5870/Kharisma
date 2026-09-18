// server/node-build.ts

import path from "path";
import fs from "fs";
import { createHash } from "crypto";
import express from "express";
import { createServer } from "./index";

const app = createServer({ produksi: true });
const port = process.env.PORT || 3000;

const distPath = path.join(__dirname, "../spa");
const baseURI = "/kharisma"; // Definisikan secara eksplisit untuk produksi

/**
 * Hash skrip inline di index.html, untuk Content-Security-Policy.
 *
 * index.html memuat satu skrip inline (pencegah kedip mode gelap). CSP menolak
 * skrip inline kecuali hash-nya didaftarkan, jadi hash dihitung dari berkas
 * hasil build itu sendiri — bukan ditulis manual — supaya tetap cocok walau
 * skripnya kelak diubah.
 */
const hashSkripInline = (() => {
  try {
    const html = fs.readFileSync(path.join(distPath, "index.html"), "utf8");
    return [...html.matchAll(/<script(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/g)]
      .map(m => `'sha256-${createHash("sha256").update(m[1], "utf8").digest("base64")}'`);
  } catch {
    return [];
  }
})();

/**
 * Content-Security-Policy halaman.
 *
 * Tujuannya: bila suatu saat ada celah XSS, skrip sisipan dan skrip dari situs
 * lain tidak bisa berjalan — token sesi disimpan di localStorage, jadi skrip
 * sisipan yang berjalan bisa mencurinya.
 *
 * `'unsafe-eval'` dan `'wasm-unsafe-eval'` SENGAJA diizinkan: pdfmake, exceljs,
 * dan jszip memakai `new Function` / WebAssembly, dan tanpa itu pembuatan PDF
 * surat serta ekspor Excel gagal. Yang tetap diblokir adalah skrip inline yang
 * tidak dikenal dan skrip dari luar aplikasi.
 */
const KEBIJAKAN_KONTEN = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-eval' 'wasm-unsafe-eval' ${hashSkripInline.join(" ")}`.trim(),
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "worker-src 'self' blob:",
  "frame-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
].join("; ");

/**
 * Header untuk halaman HTML.
 *
 * `no-cache`: index.html harus selalu diperiksa ulang. Ia menunjuk berkas JS
 * dengan nama ber-hash; kalau versi lamanya tersimpan di cache peramban setelah
 * aplikasi di-deploy ulang, peramban akan meminta berkas JS yang sudah tidak ada.
 */
const pasangHeaderHalaman = (res: express.Response) => {
  res.setHeader("Content-Security-Policy", KEBIJAKAN_KONTEN);
  res.setHeader("Cache-Control", "no-cache");
};

// Berkas di /assets bernama ber-hash (mis. index-DadVb_f3.js): isinya tidak
// pernah berubah untuk nama yang sama, jadi boleh disimpan peramban setahun.
// Sebelumnya `max-age=0`, sehingga setiap membuka halaman peramban menanyakan
// ulang semua berkas JS ke server lewat VPN.
app.use(`${baseURI}/assets`, express.static(path.join(distPath, "assets"), {
  immutable: true,
  maxAge: "365d",
  index: false,
}));
// Berkas aset yang tidak ada dibalas 404 teks biasa — BUKAN index.html. Kalau
// jatuh ke halaman SPA, peramban menerima HTML sebagai JavaScript dan galatnya
// jauh lebih membingungkan.
app.use(`${baseURI}/assets`, (_req, res) => {
  res.status(404).type("text/plain").send("Berkas tidak ditemukan.");
});

// Sajikan file statis (CSS, JS) HANYA untuk path yang diawali dengan /kharisma
app.use(baseURI, express.static(distPath, {
  setHeaders: (res, jalur) => {
    if (jalur.endsWith(".html")) pasangHeaderHalaman(res);
  },
}));

// Tangani semua rute React Router di bawah /kharisma
app.get(`${baseURI}/*`, (req, res, next) => {
  // Gunakan req.url, bukan req.path (Passenger suka "memotong" baseURI)
  if (req.url.startsWith(`${baseURI}/api`)) {
    return next();
  }
  pasangHeaderHalaman(res);
  res.sendFile(path.join(distPath, "index.html"));
});

// Redirect dari root path ('/') ke base URI aplikasi ('/kharisma')
app.get('/', (_req, res) => {
  res.redirect(baseURI);
});

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port} for production`);
});
