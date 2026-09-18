import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

/**
 * Perbaikan audit ulang yang tidak menyentuh database: pengiriman aset, CSP,
 * 404 API, rate limiter, validasi batas honor, dan penutupan pool di mode dev.
 *
 * Sebagian besar berupa konfigurasi yang, kalau hilang, TIDAK menimbulkan galat
 * apa pun — hanya aplikasi yang diam-diam lebih lambat atau kurang aman. Karena
 * itu dikunci lewat teks sumbernya setelah komentar dibuang.
 */

const baca = (jalur: string): string =>
  readFileSync(new URL(jalur, import.meta.url), "utf-8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n").filter(b => !b.trim().startsWith("//")).join("\n");

describe("pengiriman aset produksi (node-build.ts)", () => {
  const sumber = baca("./node-build.ts");

  it("aset ber-hash disimpan peramban setahun", () => {
    expect(sumber).toMatch(/immutable: true/);
    expect(sumber).toMatch(/maxAge: "365d"/);
  });

  it("aset yang hilang dibalas 404, bukan halaman SPA", () => {
    expect(sumber).toContain('status(404).type("text/plain")');
  });

  it("halaman HTML membawa CSP dan tidak disimpan cache", () => {
    expect(sumber).toContain('"Content-Security-Policy"');
    expect(sumber).toContain('"Cache-Control", "no-cache"');
    expect(sumber).toContain("sha256");
  });

  it("kompresi dinyalakan hanya lewat opsi produksi", () => {
    expect(sumber).toContain("createServer({ produksi: true })");
  });
});

describe("server API (index.ts)", () => {
  const sumber = baca("./index.ts");

  it("kompresi dipasang hanya bila produksi", () => {
    expect(sumber).toMatch(/if \(opsi\.produksi\) \{\s*app\.use\(compression\(\)\);/);
  });

  it("endpoint API yang tidak ada dibalas JSON, sebelum penangan galat", () => {
    const posisi404 = sumber.indexOf("'Endpoint tidak ditemukan.'");
    const posisiGalat = sumber.indexOf("app.use(`${baseURI}/api`, penanganGalatApi)");
    const posisiRuteTerakhir = sumber.indexOf("integrasiRoutes);");
    expect(posisi404).toBeGreaterThan(posisiRuteTerakhir);
    expect(posisiGalat).toBeGreaterThan(posisi404);
  });

  it("pool database bisa ditutup, dan server dev menutupnya saat dimulai ulang", () => {
    expect(sumber).toContain("export const tutupServer");
    // Dibaca MENTAH: pola glob "**/.git/**" di berkas ini terlihat seperti awal
    // dan akhir komentar blok, sehingga pembuang komentar ikut memotong kodenya.
    const vite = readFileSync(new URL("../vite.config.ts", import.meta.url), "utf-8");
    expect(vite).toMatch(/httpServer\?\.once\("close"[\s\S]{0,80}tutupServer\(\)/);
  });
});

describe("login & pengaturan", () => {
  it("limiter login hanya menghitung percobaan gagal", () => {
    const auth = baca("./routes/auth.ts");
    expect(auth.match(/skipSuccessfulRequests: true/g) ?? []).toHaveLength(2);
  });

  it("batas honor harus bilangan bulat positif", () => {
    const settings = baca("./routes/settings.ts");
    expect(settings).toContain("key === 'HONOR_LIMIT'");
    expect(settings).toContain("/^[0-9]{1,13}$/");
    expect(settings).toContain("Number(teks) <= 0");
  });

  it("hash lama disamakan biayanya setelah password terbukti benar", () => {
    const authService = baca("./services/authService.ts");
    const posisiCocok = authService.indexOf("if (match) {");
    const posisiSamakan = authService.indexOf("await samakanBiayaHash(");
    expect(posisiSamakan).toBeGreaterThan(posisiCocok);
  });
});

describe("pemuatan halaman bertahap (App.tsx)", () => {
  const app = baca("../client/App.tsx");

  it("Login dimuat langsung, halaman lain saat dibuka", () => {
    expect(app).toContain('import Login from "./pages/Login"');
    expect(app).toContain('const Dashboard = halamanLazy(() => import("./pages/Dashboard"))');
    expect(app).not.toMatch(/import Dashboard from/);
  });

  it("rute dibungkus Suspense", () => {
    expect(app).toMatch(/<Suspense fallback=\{<MemuatHalaman \/>\}>\s*<Routes>/);
  });
});
