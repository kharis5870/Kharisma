// vite.config.ts

import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { createServer, tutupServer } from "./server";

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  // Baris ini sekarang cerdas:
  // Jika command adalah 'build', base-nya '/kharisma/'.
  // Jika command adalah 'serve' (untuk pnpm dev), base-nya '/'.
  base: command === 'build' ? "/kharisma/" : "/",

  server: {
    // Hanya dari laptop ini. "::" membuka server dev (yang ikut menjalankan
    // API dengan database ASLI) ke semua orang di jaringan yang sama — Wi-Fi
    // kantor atau jaringan VPN — dan server dev Vite tidak dirancang untuk
    // itu. Untuk mencoba dari HP, jalankan sementara: pnpm dev --host
    host: "localhost",
    // 8081, bukan 8080: di laptop ini 8080 dipakai Tomcat. Dulu Vite pindah ke
    // 8081 sendiri karena galatnya "port terpakai"; setelah host dibatasi ke
    // localhost, Windows membalas "permission denied" dan Vite tidak lagi
    // mencoba port berikutnya — server dev gagal menyala.
    port: 8081,
    fs: {
      // index.html di akar proyek WAJIB tercantum: sejak Vite 7.3 (tambalan
      // celah fs.deny) halaman utama ikut diperiksa terhadap daftar ini, dan
      // tanpanya setiap halaman dibalas "403 Restricted".
      allow: ["./index.html", "./client", "./shared"],
      deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "server/**"],
    },
  },
  build: {
    outDir: "dist/spa",
  },
  plugins: [react(), expressPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
}));

function expressPlugin(): Plugin {
  return {
    name: "express-plugin",
    apply: "serve",
    configureServer(server) {
      const app = createServer();
      server.middlewares.use(app);
      // Vite memulai ulang server setiap berkas di server/ berubah, dan tiap
      // mulai ulang memuat pool koneksi database yang baru. Pool lama ditutup
      // saat server lamanya ditutup; tanpa ini koneksinya menumpuk sampai
      // MariaDB menolak semua koneksi ("Too many connections").
      server.httpServer?.once("close", () => {
        tutupServer().catch(() => { /* pool sudah tertutup */ });
      });
    },
  };
}
