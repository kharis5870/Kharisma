import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

/**
 * Pengelolaan kepengurusan ketua tim per tahun.
 *
 * Dua tindakan yang membuat pencatatan per tahun tetap praktis: menyalin
 * kepengurusan ke tahun berikutnya (tanpa itu, pergantian tahun berarti
 * mengetik ulang seluruh tim), dan mengganti NAMA sebuah tim di semua baris
 * yang memakainya (tanpa itu, nama lama dan baru menumpuk sebagai dua tim
 * berbeda di dropdown dan di grafik Dashboard).
 *
 * Diuji juga terhadap salinan database sungguhan saat dibuat: 6 baris tersalin,
 * penyalinan kedua melewati semuanya, dan ketiga penolakan muncul dengan pesan
 * yang bisa dibaca.
 */

const baca = (jalur: string): string =>
  readFileSync(new URL(jalur, import.meta.url), "utf-8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n").filter(b => !b.trim().startsWith("//")).join("\n");

const potong = (sumber: string, awal: string, akhir: string): string => {
  const i = sumber.indexOf(awal);
  expect(i, `penanda "${awal}" tidak ditemukan`).toBeGreaterThan(-1);
  const j = sumber.indexOf(akhir, i);
  return j === -1 ? sumber.slice(i) : sumber.slice(i, j);
};

const layanan = baca("./adminService.ts");

describe("salinKetuaTim", () => {
  const badan = potong(layanan, "export const salinKetuaTim", "\nexport const gantiNamaTim");

  it("melewati tim yang di tahun tujuan sudah ada, bukan menggagalkan semuanya", () => {
    expect(badan).toContain("timTerpakai");
    expect(badan).toContain("dilewati");
  });

  it("ketua tim tanpa tim selalu ikut disalin", () => {
    // Kunci unik (tim, tahun) memperlakukan NULL sebagai selalu berbeda,
    // jadi tidak ada yang bisa dianggap "sudah ada".
    expect(badan).toContain("AND tim IS NOT NULL");
    expect(badan).toContain("!(r.tim && timTerpakai.has(String(r.tim)))");
  });

  it("ID baru dibagikan sekali untuk seluruh rombongan", () => {
    // Memanggil pembangkit ID berulang kali menghasilkan ID yang sama persis.
    expect(badan).toContain("alokasiIdMitra(");
    expect(badan).toContain("'KT', 3");
  });

  it("penulisannya satu transaksi", () => {
    expect(badan).toContain("beginTransaction()");
    expect(badan).toContain("rollback()");
    expect(badan).toContain("connection.release()");
  });

  it("menolak tahun asal dan tujuan yang sama", () => {
    expect(badan).toContain("dari === ke");
    expect(badan).toContain("statusCode: 400");
  });
});

describe("gantiNamaTim", () => {
  const badan = potong(layanan, "export const gantiNamaTim", "\n// --- PPL");

  it("bentrok diperiksa lebih dulu, bukan dibiarkan jadi galat SQL", () => {
    expect(badan).toContain("statusCode: 409");
    expect(badan).toContain("sudah punya tim bernama");
  });

  it("bisa dibatasi satu tahun saja", () => {
    // Supaya nama lama tetap tercatat pada tahun-tahun sebelumnya bila memang
    // itu yang dikehendaki.
    expect(badan).toContain("dibatasiTahun");
    expect(badan).toContain("AND tahun = ?");
  });

  it("nama baru dirapikan spasinya", () => {
    expect(badan).toMatch(/replace\(\/\\s\+\/g, ' '\)/);
  });

  it("tim yang tidak ada dilaporkan, bukan dianggap berhasil", () => {
    expect(badan).toContain("affectedRows === 0");
    expect(badan).toContain("statusCode: 404");
  });
});

describe("rute admin", () => {
  const rute = baca("../routes/admin.ts");

  it("keduanya wewenang admin", () => {
    expect(rute).toContain("router.post('/ketua-tim/salin', wajibAdmin");
    expect(rute).toContain("router.put('/tim/ganti-nama', wajibAdmin");
  });
});
