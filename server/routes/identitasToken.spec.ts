import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

/**
 * Mengunci aturan identitas: SIAPA pelakunya diambil dari token sesi
 * (`req.user`), tidak pernah dari badan permintaan.
 *
 * KENAPA PERLU DIKUNCI: aturan ini sudah pernah dilanggar diam-diam dua kali.
 * Mula-mula seluruh API memercayai `username` dari body. Setelah autentikasi
 * token dipasang, `PUT /kegiatan/:id` masih meneruskan body apa adanya ke
 * `updateKegiatan`, sehingga `lastEditedBy` — yang masuk ke kolom kegiatan,
 * riwayat 'kegiatan_disunting', dan pengunggah dokumen — bisa diisi nama siapa
 * saja. Tidak ada galat, tidak ada tanda; riwayatnya hanya jadi bohong.
 *
 * `auth.ts` sengaja dikecualikan: login memang HARUS membaca username dari
 * body, karena di situlah pengguna belum punya token.
 *
 * Repo ini tidak menguji database, jadi yang diperiksa adalah teks sumbernya
 * setelah komentar dibuang.
 */

const folder = fileURLToPath(new URL(".", import.meta.url));
const bersih = (teks: string): string =>
  teks.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
const baca = (berkas: string): string =>
  bersih(readFileSync(fileURLToPath(new URL(berkas, import.meta.url)), "utf8"));

describe("identitas pelaku diambil dari token", () => {
  it("PUT /kegiatan/:id menimpa lastEditedBy dengan pemilik token SEBELUM menyimpan", () => {
    const sumber = baca("kegiatan.ts");
    const handler = sumber.slice(
      sumber.indexOf("router.put('/:id'"),
      sumber.indexOf("router.put('/ppl/:pplId/progress'"));
    const posTimpa = handler.indexOf("kegiatanData.lastEditedBy = req.user!.username");
    const posSimpan = handler.indexOf("updateKegiatan(");
    expect(posTimpa, "lastEditedBy wajib diambil dari req.user").toBeGreaterThan(-1);
    expect(posSimpan).toBeGreaterThan(posTimpa);
  });

  it("POST /kegiatan mengambil pembuat dari token", () => {
    const sumber = baca("kegiatan.ts");
    expect(sumber).toContain("kegiatanData.createdBy_userId = req.user!.id");
    expect(sumber).toContain("kegiatanData.username = req.user!.username");
  });

  it("tidak ada route (selain login) yang membaca username dari body", () => {
    const pelanggar = readdirSync(folder)
      .filter(f => f.endsWith(".ts") && !f.endsWith(".spec.ts") && f !== "auth.ts")
      .filter(f => {
        const s = bersih(readFileSync(folder + f, "utf8"));
        return /req\.body\??\.username/.test(s)
          || /\{[^}]*\busername\b[^}]*\}\s*=\s*req\.body/.test(s);
      });
    expect(pelanggar).toEqual([]);
  });
});
