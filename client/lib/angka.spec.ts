import { describe, it, expect } from "vitest";
import { formatHonor, parseHonor, parseHonorNumber, sanitizeJumlah } from "./angka";

describe("sanitizeJumlah", () => {
  it("membuang nol di depan", () => {
    expect(sanitizeJumlah("007")).toBe("7");
    expect(sanitizeJumlah("0012")).toBe("12");
  });

  it("menolak angka negatif dengan membuang tanda minusnya", () => {
    expect(sanitizeJumlah("-5")).toBe("5");
    expect(sanitizeJumlah("-")).toBe("");
  });

  it("mengosongkan nilai nol", () => {
    // Beban kerja 0 tidak masuk akal; biarkan kosong supaya validasi form
    // yang menandainya, bukan tersimpan sebagai 0.
    expect(sanitizeJumlah("0")).toBe("");
    expect(sanitizeJumlah("000")).toBe("");
  });

  it("membuang karakter non-digit", () => {
    expect(sanitizeJumlah("12a3")).toBe("123");
    expect(sanitizeJumlah("1.500")).toBe("1500");
    expect(sanitizeJumlah("2,5")).toBe("25");
  });

  it("membiarkan angka yang sudah benar", () => {
    expect(sanitizeJumlah("23")).toBe("23");
    expect(sanitizeJumlah(150)).toBe("150");
  });

  it("menangani nilai kosong dan null", () => {
    expect(sanitizeJumlah("")).toBe("");
    expect(sanitizeJumlah(null as unknown as string)).toBe("");
    expect(sanitizeJumlah(undefined as unknown as string)).toBe("");
  });
});

describe("formatHonor / parseHonor", () => {
  it("bolak-balik tanpa kehilangan nilai", () => {
    expect(formatHonor("24000")).toBe("24.000");
    expect(parseHonor("24.000")).toBe("24000");
    expect(parseHonor(formatHonor("1200200"))).toBe("1200200");
  });

  it("menangani nilai kosong", () => {
    expect(formatHonor("")).toBe("");
    expect(formatHonor(null as unknown as string)).toBe("");
    expect(parseHonor("")).toBe("");
  });

  // Regresi bug hargaSatuan: string terformat yang di-parseInt langsung
  // menghasilkan 1 dari "1.2002". parseHonorNumber harus membuang titiknya dulu.
  it("parseHonorNumber membuang titik ribuan sebelum mengubah ke angka", () => {
    expect(parseHonorNumber("1.2002")).toBe(12002);
    expect(parseHonorNumber("24.000")).toBe(24000);
    expect(parseHonorNumber("")).toBe(0);
    expect(parseHonorNumber("bukan angka")).toBe(0);
  });
});
