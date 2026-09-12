/**
 * Pemilih BULAN (bukan rentang bebas), nilainya berformat "MM-yyyy".
 *
 * Dipakai di Generate Surat. Surat PK diikat per mitra per BULAN — satu SPK
 * untuk satu mitra dalam satu bulan, sesuai praktik tim keuangan. Dulu layar
 * memakai pemilih rentang bebas, dan setiap kali rentangnya digeser sedikit
 * aplikasi menganggapnya periode baru lalu memesan nomor surat baru: satu mitra
 * bisa memegang tiga nomor untuk pekerjaan yang sama. Membatasi pilihan ke
 * bulan kalender menutup sumber masalah itu di layar, bukan menambalnya.
 *
 * Bulan disusun sebagai daftar tetap, bukan diformat dengan date-fns, supaya
 * labelnya pasti bahasa Indonesia tanpa bergantung pada locale yang terpasang.
 */

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const NAMA_BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
] as const;

/** Bulan berjalan dalam format "MM-yyyy". */
export const bulanSekarang = (): string => {
  const kini = new Date();
  return `${String(kini.getMonth() + 1).padStart(2, "0")}-${kini.getFullYear()}`;
};

/**
 * Memecah "MM-yyyy" menjadi angka bulan (1-12) dan tahun.
 *
 * Nilai yang tidak berbentuk demikian menghasilkan null, sehingga pemanggilnya
 * bisa jatuh ke bulan berjalan alih-alih menampilkan "NaN".
 */
export const uraiBulan = (nilai?: string): { bulan: number; tahun: number } | null => {
  const cocok = /^(\d{2})-(\d{4})$/.exec(nilai ?? "");
  if (!cocok) return null;
  const bulan = Number(cocok[1]);
  const tahun = Number(cocok[2]);
  if (bulan < 1 || bulan > 12) return null;
  return { bulan, tahun };
};

/** Label manusiawi sebuah nilai "MM-yyyy", mis. "September 2026". */
export const labelBulan = (nilai?: string): string => {
  const urai = uraiBulan(nilai);
  return urai ? `${NAMA_BULAN[urai.bulan - 1]} ${urai.tahun}` : "";
};

/**
 * Daftar tahun yang bisa dipilih: beberapa tahun ke belakang dan ke depan dari
 * tahun yang sedang dipilih.
 *
 * Berpusat pada tahun TERPILIH, bukan tahun berjalan, supaya membuka data lama
 * tidak membuat tahunnya sendiri menghilang dari daftar.
 */
export const daftarTahun = (terpilih: number, jangkauan = 3): number[] => {
  const tahun: number[] = [];
  for (let t = terpilih - jangkauan; t <= terpilih + jangkauan; t++) tahun.push(t);
  return tahun;
};

interface Props {
  /** Nilai "MM-yyyy". Kosong atau tidak sah diperlakukan sebagai bulan berjalan. */
  value?: string;
  onChange: (bulan: string) => void;
  id?: string;
  disabled?: boolean;
}

export function MonthPicker({ value, onChange, id, disabled }: Props) {
  const terpilih = uraiBulan(value) ?? uraiBulan(bulanSekarang())!;

  const pilih = (bulan: number, tahun: number) =>
    onChange(`${String(bulan).padStart(2, "0")}-${tahun}`);

  return (
    <div className="flex gap-2">
      <Select
        value={String(terpilih.bulan)}
        onValueChange={v => pilih(Number(v), terpilih.tahun)}
        disabled={disabled}
      >
        <SelectTrigger id={id} className="flex-1">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {NAMA_BULAN.map((nama, i) => (
            <SelectItem key={nama} value={String(i + 1)}>{nama}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={String(terpilih.tahun)}
        onValueChange={v => pilih(terpilih.bulan, Number(v))}
        disabled={disabled}
      >
        <SelectTrigger className="w-28">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {daftarTahun(terpilih.tahun).map(t => (
            <SelectItem key={t} value={String(t)}>{t}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export default MonthPicker;
