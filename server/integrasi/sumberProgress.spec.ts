import { describe, it, expect } from "vitest";
import { pilihSumber, type SumberProgress } from "./sumberProgress";

const buatSumber = (nama: string, siap: boolean): SumberProgress => ({
  nama,
  tersedia: () => siap,
  ambilProgress: async () => [],
});

const manual = buatSumber("Manual", true);

describe("pilihSumber", () => {
  it("memakai FASIH bila kegiatannya bertanda FASIH dan sambungannya siap", () => {
    const fasih = buatSumber("FASIH", true);
    expect(pilihSumber({ isFasih: true }, { manual, fasih }).nama).toBe("FASIH");
  });

  /**
   * Inti keamanan peralihannya: memasang integrasi tidak boleh menghentikan
   * pekerjaan yang sedang berjalan. Selama FASIH belum dikonfigurasi, semuanya
   * tetap memakai angka yang diisi PML.
   */
  it("jatuh ke manual bila FASIH belum dikonfigurasi", () => {
    const fasih = buatSumber("FASIH", false);
    expect(pilihSumber({ isFasih: true }, { manual, fasih }).nama).toBe("Manual");
  });

  it("kegiatan non-FASIH selalu manual, walau sambungannya siap", () => {
    const fasih = buatSumber("FASIH", true);
    expect(pilihSumber({ isFasih: false }, { manual, fasih }).nama).toBe("Manual");
    expect(pilihSumber({}, { manual, fasih }).nama).toBe("Manual");
    expect(pilihSumber({ isFasih: null }, { manual, fasih }).nama).toBe("Manual");
  });

  // MySQL mengembalikan TINYINT(1) sebagai angka, bukan boolean.
  it("menerima penanda dalam bentuk angka 1/0 dari database", () => {
    const fasih = buatSumber("FASIH", true);
    expect(pilihSumber({ isFasih: 1 }, { manual, fasih }).nama).toBe("FASIH");
    expect(pilihSumber({ isFasih: 0 }, { manual, fasih }).nama).toBe("Manual");
  });

  // Mematikan integrasi cukup dengan mengosongkan .env — tanpa menyunting kode
  // dan tanpa mengubah penanda di tiap kegiatan.
  it("mengosongkan konfigurasi mengembalikan semuanya ke manual", () => {
    const fasihMati = buatSumber("FASIH", false);
    for (const isFasih of [true, false, 1, 0, null, undefined]) {
      expect(pilihSumber({ isFasih } as any, { manual, fasih: fasihMati }).nama).toBe("Manual");
    }
  });
});
