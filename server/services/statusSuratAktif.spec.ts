import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

/**
 * Sejak surat punya status aktif/batal, SETIAP kueri yang bertanya "mitra ini
 * sudah punya surat untuk periode itu?" harus menyaring `status = 'aktif'`.
 *
 * Kalau penyaringnya hilang, akibatnya tidak kelihatan sebagai galat melainkan
 * sebagai kerusakan diam-diam: surat yang sudah dibatalkan dianggap masih
 * berlaku, sehingga mitra yang seharusnya menerima surat pengganti justru
 * dilewati saat generate, dan nomor surat batal tercetak lagi di layar Generate
 * Surat seolah-olah sah.
 *
 * Repo ini tidak menguji database, jadi yang diperiksa adalah teks sumbernya
 * setelah komentar dibuang — supaya kalimat penjelasan di atas tidak ikut
 * terhitung sebagai bukti.
 */

const sumber = readFileSync(new URL("./kontrakService.ts", import.meta.url), "utf-8");

/** Membuang komentar baris dan blok, supaya yang diperiksa hanya kode. */
const tanpaKomentar = sumber
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .split("\n")
  .filter(baris => !baris.trim().startsWith("//"))
  .join("\n");

/**
 * Setiap penyebutan `FROM kontrak_mitra` beserta potongan kueri sesudahnya,
 * dengan penanda apakah ia bagian dari sebuah DELETE.
 *
 * Verbnya ikut direkam karena aturannya berbeda: pembacaan harus menyaring
 * surat aktif, sedangkan penghapusan pada "atur ulang nomor" memang disengaja
 * menyapu seluruh baris periode itu, surat batal sekalipun.
 */
const penyebutan = [...tanpaKomentar.matchAll(/(DELETE\s+)?FROM kontrak_mitra([\s\S]{0,400})/g)]
  .map(m => ({ hapus: Boolean(m[1]), kueri: m[2].replace(/\s+/g, " ") }));

describe("penyaringan surat batal di kontrakService", () => {
  it("setiap pencarian surat per periode menyaring status aktif", () => {
    const perPeriode = penyebutan.filter(
      p => p.kueri.includes("periode_mulai = ?") && p.kueri.includes("periode_selesai = ?"));

    // Penjaga anti-hampa: kalau polanya berhenti cocok, tes ini harus merah
    // karena tidak menemukan apa-apa, bukan hijau karena tidak ada yang salah.
    expect(perPeriode.length).toBeGreaterThanOrEqual(3);

    const wajibMenyaring = perPeriode.filter(p =>
      // "Atur ulang nomor" dikecualikan: ia memang menghapus seluruh baris
      // periode itu, beserta pembacaan FOR UPDATE yang mendahuluinya.
      !p.hapus && !p.kueri.includes("FOR UPDATE"));
    expect(wajibMenyaring.length).toBeGreaterThanOrEqual(3);

    for (const p of wajibMenyaring) {
      expect(p.kueri).toMatch(/status = 'aktif'/);
    }
  });

  it("UPDATE nomor BAST tidak menimpa surat yang sudah dibatalkan", () => {
    const update = tanpaKomentar
      .split(/UPDATE kontrak_mitra/)
      .slice(1)
      .map(b => b.slice(0, 400).replace(/\s+/g, " "))
      .filter(b => b.includes("nomor_bast = ?"));
    expect(update).toHaveLength(1);
    expect(update[0]).toMatch(/status = 'aktif'/);
  });

  it("surat hanya bisa dihapus permanen bila sudah batal", () => {
    expect(tanpaKomentar).toMatch(/baris\.status !== 'batal'/);
  });

  it("riwayat surat sengaja TIDAK menyaring status, supaya surat batal ikut tampil", () => {
    const riwayat = tanpaKomentar.slice(tanpaKomentar.indexOf("export const getRiwayatSurat"));
    const kueri = riwayat.slice(0, riwayat.indexOf("ORDER BY")).replace(/\s+/g, " ");
    expect(kueri).toContain("WHERE YEAR(km.tanggal_surat) = ?");
    expect(kueri).not.toContain("status = 'aktif'");
  });
});
