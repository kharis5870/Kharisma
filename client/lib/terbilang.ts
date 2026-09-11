const SATUAN = [
  "", "Satu", "Dua", "Tiga", "Empat", "Lima",
  "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas",
];

/**
 * Mengubah angka menjadi kata dalam Bahasa Indonesia dengan huruf kapital di
 * awal tiap kata, sesuai gaya penulisan Surat Perjanjian Kerja BPS
 * (mis. "Dua Juta Tujuh Ratus Dua Puluh Enam Ribu").
 *
 * Menangani kekhasan Bahasa Indonesia: "Sebelas" (bukan "Satu Belas"),
 * "Seratus"/"Seribu" (bukan "Satu Ratus"/"Satu Ribu"), dan "Dua Belas".
 */
const keKata = (n: number): string => {
  if (n < 12) return SATUAN[n];
  if (n < 20) return `${keKata(n - 10)} Belas`;
  if (n < 100) {
    const puluhan = Math.floor(n / 10);
    const sisa = n % 10;
    return `${keKata(puluhan)} Puluh${sisa ? ` ${keKata(sisa)}` : ""}`;
  }
  if (n < 200) return `Seratus${n % 100 ? ` ${keKata(n % 100)}` : ""}`;
  if (n < 1000) {
    const ratusan = Math.floor(n / 100);
    const sisa = n % 100;
    return `${keKata(ratusan)} Ratus${sisa ? ` ${keKata(sisa)}` : ""}`;
  }
  if (n < 2000) return `Seribu${n % 1000 ? ` ${keKata(n % 1000)}` : ""}`;
  if (n < 1_000_000) {
    const ribuan = Math.floor(n / 1000);
    const sisa = n % 1000;
    return `${keKata(ribuan)} Ribu${sisa ? ` ${keKata(sisa)}` : ""}`;
  }
  if (n < 1_000_000_000) {
    const jutaan = Math.floor(n / 1_000_000);
    const sisa = n % 1_000_000;
    return `${keKata(jutaan)} Juta${sisa ? ` ${keKata(sisa)}` : ""}`;
  }
  if (n < 1_000_000_000_000) {
    const miliaran = Math.floor(n / 1_000_000_000);
    const sisa = n % 1_000_000_000;
    return `${keKata(miliaran)} Miliar${sisa ? ` ${keKata(sisa)}` : ""}`;
  }
  const triliunan = Math.floor(n / 1_000_000_000_000);
  const sisa = n % 1_000_000_000_000;
  return `${keKata(triliunan)} Triliun${sisa ? ` ${keKata(sisa)}` : ""}`;
};

/** Angka menjadi kata, tanpa satuan. `terbilang(2726000)` -> "Dua Juta Tujuh Ratus Dua Puluh Enam Ribu". */
export const terbilang = (nilai: number): string => {
  const n = Math.floor(Math.abs(Number(nilai) || 0));
  if (n === 0) return "Nol";
  const kata = keKata(n).replace(/\s+/g, " ").trim();
  return Number(nilai) < 0 ? `Minus ${kata}` : kata;
};

/** Angka menjadi kata berakhiran "Rupiah", seperti pada Pasal 5 Surat PK. */
export const terbilangRupiah = (nilai: number): string => `${terbilang(nilai)} Rupiah`;

/** Format rupiah gaya Indonesia tanpa desimal, mis. `1280000` -> "Rp1.280.000". */
export const formatRupiah = (nilai: number): string =>
  `Rp${Math.round(Number(nilai) || 0).toLocaleString("id-ID")}`;

const ANGKA_ROMAWI: [number, string][] = [
  [1000, "M"], [900, "CM"], [500, "D"], [400, "CD"],
  [100, "C"], [90, "XC"], [50, "L"], [40, "XL"],
  [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"],
];

/** Bulan menjadi angka Romawi untuk nomor surat, mis. 2 -> "II". */
export const keRomawi = (angka: number): string => {
  let sisa = Math.floor(Math.abs(Number(angka) || 0));
  if (sisa === 0) return "";
  let hasil = "";
  for (const [nilai, simbol] of ANGKA_ROMAWI) {
    while (sisa >= nilai) {
      hasil += simbol;
      sisa -= nilai;
    }
  }
  return hasil;
};
