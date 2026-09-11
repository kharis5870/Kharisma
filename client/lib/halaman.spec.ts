import { describe, it, expect } from "vitest";
import { HALAMAN_APLIKASI, judulDariPath } from "./halaman";

describe("judulDariPath", () => {
  it("mengambil judul dari daftar halaman", () => {
    expect(judulDariPath("/dashboard")).toBe("Dashboard");
    expect(judulDariPath("/manajemen-honor")).toBe("Manajemen Honor");
    expect(judulDariPath("/profil")).toBe("Pengaturan Profil");
  });

  // Dulu kedua rute ini tidak ada di peta judul dan jatuh ke "Kharisma".
  it("menangani rute berparameter", () => {
    expect(judulDariPath("/edit-activity/66")).toBe("Edit Kegiatan");
    expect(judulDariPath("/view-documents/74")).toBe("Dokumen Kegiatan");
  });

  it("jatuh ke nama aplikasi untuk path tak dikenal", () => {
    expect(judulDariPath("/entah-apa")).toBe("Kharisma");
    expect(judulDariPath("/")).toBe("Kharisma");
  });
});

describe("HALAMAN_APLIKASI", () => {
  it("tidak ada path ganda", () => {
    const path = HALAMAN_APLIKASI.map(h => h.path);
    expect(new Set(path).size).toBe(path.length);
  });

  it("semua path diawali garis miring", () => {
    HALAMAN_APLIKASI.forEach(h => expect(h.path.startsWith("/")).toBe(true));
  });

  // Pencarian tidak boleh menawarkan halaman yang tidak boleh dibuka.
  it("halaman terbatas hanya terbuka bagi peran yang berhak", () => {
    const bolehUntuk = (peran: 'admin' | 'supervisor' | 'user') =>
      HALAMAN_APLIKASI.filter(h => !h.peran || h.peran.includes(peran)).map(h => h.path);

    expect(bolehUntuk('user')).not.toContain('/manajemen-admin');
    expect(bolehUntuk('user')).not.toContain('/template-surat');
    expect(bolehUntuk('supervisor')).not.toContain('/manajemen-admin');
    expect(bolehUntuk('supervisor')).toContain('/generate-kontrak');
    expect(bolehUntuk('admin')).toContain('/manajemen-admin');
  });

  it("halaman umum terbuka untuk semua peran", () => {
    const umum = HALAMAN_APLIKASI.filter(h => !h.peran).map(h => h.path);
    expect(umum).toContain('/dashboard');
    expect(umum).toContain('/penilaian-mitra');
  });
});
