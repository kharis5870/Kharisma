import { describe, it, expect } from "vitest";
import {
  dikelolaKeuangan,
  bolehMengelolaDokumenKeuangan,
  bolehMengisiLinkKeuangan,
  bolehKetuaTimMenyunting,
  menahanTenggatKetuaTim,
  labelPenanggungJawab,
} from "./hakDokumen";

const dokKetuaTim = { penanggungJawab: "ketua_tim" as const };
const dokKeuangan = { penanggungJawab: "keuangan" as const };
/** Dokumen dari respons lama atau cache yang belum punya kolom ini. */
const dokLama = {};

describe("dikelolaKeuangan", () => {
  it("membedakan kedua penanda", () => {
    expect(dikelolaKeuangan(dokKeuangan)).toBe(true);
    expect(dikelolaKeuangan(dokKetuaTim)).toBe(false);
  });

  // Bukan sekadar kehati-hatian: respons yang masih di cache React Query dari
  // sebelum kolomnya ada memang tidak memuat field ini.
  it("memperlakukan dokumen tanpa penanda sebagai tanggung jawab ketua tim", () => {
    expect(dikelolaKeuangan(dokLama)).toBe(false);
    expect(dikelolaKeuangan(undefined)).toBe(false);
    expect(dikelolaKeuangan(null)).toBe(false);
  });
});

describe("bolehMengelolaDokumenKeuangan", () => {
  it("hanya tim keuangan (supervisor) dan admin", () => {
    expect(bolehMengelolaDokumenKeuangan("supervisor")).toBe(true);
    expect(bolehMengelolaDokumenKeuangan("admin")).toBe(true);
    expect(bolehMengelolaDokumenKeuangan("user")).toBe(false);
    expect(bolehMengelolaDokumenKeuangan(undefined)).toBe(false);
  });
});

describe("bolehMengisiLinkKeuangan", () => {
  it("butuh dokumen keuangan DAN peran yang tepat", () => {
    expect(bolehMengisiLinkKeuangan(dokKeuangan, "supervisor")).toBe(true);
    expect(bolehMengisiLinkKeuangan(dokKeuangan, "admin")).toBe(true);
  });

  it("ketua tim tidak pernah boleh mengisi lewat jalur ini", () => {
    expect(bolehMengisiLinkKeuangan(dokKeuangan, "user")).toBe(false);
  });

  it("dokumen milik ketua tim tidak diisi lewat jalur keuangan", () => {
    expect(bolehMengisiLinkKeuangan(dokKetuaTim, "supervisor")).toBe(false);
    expect(bolehMengisiLinkKeuangan(dokLama, "admin")).toBe(false);
  });
});

describe("bolehKetuaTimMenyunting", () => {
  it("dokumen biasa mengikuti hak edit kegiatan", () => {
    expect(bolehKetuaTimMenyunting(dokKetuaTim, true)).toBe(true);
    expect(bolehKetuaTimMenyunting(dokKetuaTim, false)).toBe(false);
    expect(bolehKetuaTimMenyunting(dokLama, true)).toBe(true);
  });

  // Dikunci bahkan untuk yang berhak mengedit kegiatan, termasuk admin: satu
  // dokumen hanya boleh punya satu jalur pengisian.
  it("dokumen keuangan terkunci walau penggunanya berhak mengedit", () => {
    expect(bolehKetuaTimMenyunting(dokKeuangan, true)).toBe(false);
  });
});

describe("menahanTenggatKetuaTim", () => {
  it("dokumen wajib milik ketua tim menahan tenggat", () => {
    expect(menahanTenggatKetuaTim({ isWajib: true, penanggungJawab: "ketua_tim" })).toBe(true);
    expect(menahanTenggatKetuaTim({ isWajib: true })).toBe(true);
  });

  // Inti keputusannya: dokumen keuangan tetap wajib, tapi berhenti membebani
  // ketua tim yang memang tidak bisa mengisinya.
  it("dokumen keuangan tidak menahan tenggat meski wajib", () => {
    expect(menahanTenggatKetuaTim({ isWajib: true, penanggungJawab: "keuangan" })).toBe(false);
  });

  it("dokumen tidak wajib tidak pernah menahan tenggat", () => {
    expect(menahanTenggatKetuaTim({ isWajib: false, penanggungJawab: "ketua_tim" })).toBe(false);
    expect(menahanTenggatKetuaTim({})).toBe(false);
  });
});

describe("labelPenanggungJawab", () => {
  it("memberi label yang terbaca di layar", () => {
    expect(labelPenanggungJawab(dokKeuangan)).toBe("Tim Keuangan");
    expect(labelPenanggungJawab(dokKetuaTim)).toBe("Ketua Tim");
    expect(labelPenanggungJawab(dokLama)).toBe("Ketua Tim");
  });
});
