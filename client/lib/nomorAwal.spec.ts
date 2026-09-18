import { describe, it, expect } from "vitest";
import { nomorPertama } from "@shared/nomorAwal";

describe("nomorPertama", () => {
  it("melanjutkan nomor tertinggi yang sudah terpakai", () => {
    expect(nomorPertama(89)).toBe(90);
    expect(nomorPertama(0)).toBe(1);
    expect(nomorPertama(120)).toBe(121);
  });

  it("mengabaikan nilai tertinggi yang tidak masuk akal", () => {
    expect(nomorPertama(-5)).toBe(1);
    expect(nomorPertama(Number.NaN)).toBe(1);
  });
});
