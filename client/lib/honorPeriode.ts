import { eachMonthOfInterval, format, parse, isValid, startOfMonth, endOfMonth } from "date-fns";
import { id as localeID } from "date-fns/locale";

/** Format bulan pembebanan honor yang dipakai kolom `kegiatan.bulanHonor*`. */
export const FORMAT_BULAN = "MM-yyyy";
/** Format tanggal yang dipakai kolom DATE di MySQL dan state klien. */
export const FORMAT_TANGGAL = "yyyy-MM-dd";

export interface OpsiBulan {
  /** "02-2026" */
  value: string;
  /** "Februari 2026" */
  label: string;
}

const keDate = (nilai?: string): Date | undefined => {
  if (!nilai) return undefined;
  const parsed = parse(nilai, FORMAT_TANGGAL, new Date());
  return isValid(parsed) ? parsed : undefined;
};

/**
 * Daftar bulan kalender yang disentuh sebuah rentang tanggal honor.
 *
 * Rentang 21 Jan - 12 Feb 2026 menghasilkan dua opsi (Januari, Februari).
 * Pengguna lalu memilih satu sebagai bulan pembebanan, karena HONOR_LIMIT
 * dihitung per PPL per bulan dan honor tidak boleh dihitung dua kali.
 */
export const bulanDalamRentang = (mulai?: string, selesai?: string): OpsiBulan[] => {
  const awal = keDate(mulai);
  const akhir = keDate(selesai);
  if (!awal || !akhir || awal > akhir) return [];

  return eachMonthOfInterval({ start: awal, end: akhir }).map(bulan => ({
    value: format(bulan, FORMAT_BULAN),
    label: format(bulan, "MMMM yyyy", { locale: localeID }),
  }));
};

/**
 * Menentukan bulan pembebanan yang berlaku setelah rentang berubah.
 *
 * - Rentang kosong  -> undefined (tidak ada yang bisa dibebankan).
 * - Satu bulan      -> bulan itu, dipilih otomatis tanpa menanyai pengguna.
 * - Lebih dari satu -> pertahankan pilihan lama kalau masih di dalam rentang,
 *   selain itu kosongkan supaya pengguna memilih ulang secara sadar.
 */
export const bulanPembebananSetelahUbah = (
  mulai: string | undefined,
  selesai: string | undefined,
  bulanSaatIni: string | undefined,
): string | undefined => {
  const opsi = bulanDalamRentang(mulai, selesai);
  if (opsi.length === 0) return undefined;
  if (opsi.length === 1) return opsi[0].value;
  return opsi.some(o => o.value === bulanSaatIni) ? bulanSaatIni : undefined;
};

/** Rentang tanggal default sebuah bulan pembebanan: tanggal 1 s.d. akhir bulan. */
export const rentangDariBulan = (bulan?: string): { mulai?: string; selesai?: string } => {
  if (!bulan) return {};
  const parsed = parse(bulan, FORMAT_BULAN, new Date());
  if (!isValid(parsed)) return {};
  return {
    mulai: format(startOfMonth(parsed), FORMAT_TANGGAL),
    selesai: format(endOfMonth(parsed), FORMAT_TANGGAL),
  };
};

/** Label rentang yang enak dibaca, mis. "21 Jan 2026 — 12 Feb 2026". */
export const labelRentang = (mulai?: string, selesai?: string): string => {
  const awal = keDate(mulai);
  const akhir = keDate(selesai);
  if (!awal) return "-";
  if (!akhir) return format(awal, "dd MMM yyyy", { locale: localeID });
  return `${format(awal, "dd MMM yyyy", { locale: localeID })} — ${format(akhir, "dd MMM yyyy", { locale: localeID })}`;
};

/**
 * Rentang honor bawaan untuk ketiga tahap alokasi: mengikuti jadwal PENDATAAN.
 *
 * Alasannya bukan sekadar kemudahan. Ketiga jenis alokasi — listing,
 * pencacahan, dan pengolahan — semuanya bekerja pada masa pendataan; mitra
 * "pengolahan" pun mengerjakan entri dan cleaning di masa itu, bukan pada tahap
 * Pengolahan & Analisis. Jadi jadwal pendataan memang tebakan awal yang benar.
 *
 * HANYA MENGISI YANG MASIH KOSONG. Rentang yang sudah pernah disetel tidak
 * ditimpa: menggeser jadwal pendataan tidak boleh diam-diam memindahkan bulan
 * pembebanan honor yang sudah diputuskan — apalagi bila honornya sudah dibagi
 * ke beberapa bulan.
 *
 * Mengembalikan HANYA field yang perlu diubah, jadi aman disebar (`...`) ke
 * state mana pun dan tidak menghasilkan render baru bila tidak ada yang berubah.
 */
export const rentangHonorBawaan = (
  mulaiPendataan: string | undefined,
  selesaiPendataan: string | undefined,
  sekarang: Record<string, string | undefined>,
): Record<string, string | undefined> => {
  if (!mulaiPendataan || !selesaiPendataan) return {};

  const perubahan: Record<string, string | undefined> = {};
  for (const tahap of ['Listing', 'Pencacahan', 'Pengolahan'] as const) {
    const kMulai = `tanggalMulaiHonor${tahap}`;
    const kSelesai = `tanggalSelesaiHonor${tahap}`;
    if (sekarang[kMulai] || sekarang[kSelesai]) continue;

    perubahan[kMulai] = mulaiPendataan;
    perubahan[kSelesai] = selesaiPendataan;
    perubahan[`bulanHonor${tahap}`] = bulanPembebananSetelahUbah(
      mulaiPendataan, selesaiPendataan, sekarang[`bulanHonor${tahap}`]);
  }
  return perubahan;
};

/**
 * Date -> "yyyy-MM-dd", untuk mengisi `DateRangePicker` dari state yang
 * menyimpan objek `Date`.
 *
 * Nilai dari store yang sudah di-persist ke localStorage bisa berupa STRING,
 * bukan Date — dilewatkan apa adanya, bukan dipaksa lewat `format()` yang akan
 * melempar pada string.
 */
export const keTeksTanggal = (nilai?: Date | string): string | undefined => {
  if (!nilai) return undefined;
  if (typeof nilai === "string") return nilai.slice(0, 10);
  return isValid(nilai) ? format(nilai, FORMAT_TANGGAL) : undefined;
};

/** "yyyy-MM-dd" -> Date, kebalikan `keTeksTanggal`. */
export const keTanggal = (nilai?: string): Date | undefined => keDate(nilai);

/**
 * Apakah masih ada alokasi PPL yang belum ditentukan cara pembebanan honornya.
 *
 * Hanya berlaku bila periode honor tahapnya melintasi lebih dari satu bulan —
 * periode satu bulan tidak punya keputusan untuk diambil.
 *
 * Dulu yang diperiksa adalah kolom `bulanHonor*` milik tahap, karena bulan
 * pembebanan dipilih sekali untuk seluruh tahap. Sejak keputusannya pindah ke
 * tiap alokasi (batas SBML berlaku per mitra, jadi mitra yang longgar dan yang
 * hampir mentok perlu diperlakukan berbeda), pemeriksaannya ikut pindah ke
 * sini. Tanpa perubahan ini, kegiatan dengan periode lintas bulan tidak akan
 * pernah bisa disimpan: kolom tahap itu memang sengaja dibiarkan kosong.
 */
export const pembebananBelumLengkap = (
  opsiBulan: OpsiBulan[],
  alokasi: Array<{ metodePembebanan?: string; bulanPembebananDipilih?: string | null }>,
): boolean => {
  if (opsiBulan.length <= 1) return false;
  return alokasi.some(a => {
    // Prorata dan luber tidak perlu bulan pilihan.
    if (a.metodePembebanan === "prorata" || a.metodePembebanan === "luber") return false;
    // Bulan yang sudah di luar rentang dianggap belum dipilih: periodenya bisa
    // dipersempit setelah pilihan dibuat.
    return !a.bulanPembebananDipilih
      || !opsiBulan.some(o => o.value === a.bulanPembebananDipilih);
  });
};
