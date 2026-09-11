import * as React from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { format, parse, isValid } from "date-fns";
import { id as localeID } from "date-fns/locale";
import type { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

/**
 * Rentang tanggal dalam format string "yyyy-MM-dd".
 *
 * Sengaja string, bukan objek Date: nilai ini disimpan di zustand yang
 * di-persist ke localStorage (objek Date berubah jadi string saat rehydrate),
 * dikirim apa adanya ke kolom MySQL DATE, dan tidak pernah bergeser sehari
 * karena konversi zona waktu.
 */
export interface RentangTanggal {
  mulai?: string;
  selesai?: string;
}

const FORMAT_DB = "yyyy-MM-dd";

export const keDate = (nilai?: string): Date | undefined => {
  if (!nilai) return undefined;
  const parsed = parse(nilai, FORMAT_DB, new Date());
  return isValid(parsed) ? parsed : undefined;
};

export const keString = (tanggal?: Date): string | undefined =>
  tanggal ? format(tanggal, FORMAT_DB) : undefined;

/**
 * Mengubah apa pun (Date, string ISO, string "yyyy-MM-dd", angka) menjadi
 * Date yang valid, atau undefined.
 *
 * Perlu karena `defaultMonth` bisa datang sebagai Date DAN sebagai string:
 * store zustand di-persist ke localStorage, sehingga field bertipe Date
 * berubah jadi string ISO setelah rehydrate. Meneruskan string mentah ke
 * react-day-picker membuat date-fns melempar "Invalid time value" saat
 * render — layar jadi putih total.
 */
const keDateAman = (nilai?: Date | string | number): Date | undefined => {
  if (nilai == null) return undefined;
  if (nilai instanceof Date) return isValid(nilai) ? nilai : undefined;
  if (typeof nilai === "number") {
    const d = new Date(nilai);
    return isValid(d) ? d : undefined;
  }
  return keDate(nilai) ?? (isValid(new Date(nilai)) ? new Date(nilai) : undefined);
};

const tanggalPanjang = (tanggal: Date) => format(tanggal, "dd MMM yyyy", { locale: localeID });

/** Mengurutkan dua tanggal jadi rentang, apa pun urutan kliknya. */
const susunRentang = (a: Date, b: Date): { from: Date; to: Date } =>
  a <= b ? { from: a, to: b } : { from: b, to: a };

/**
 * Satu langkah pemilihan dua-klik. Dipisah dari komponen supaya bisa diuji.
 *
 * Klik pertama hanya memasang jangkar (tanggal awal) dan TIDAK mengubah nilai
 * form; klik kedua barulah menyimpan rentang. Urutan klik bebas — memilih
 * tanggal yang lebih awal belakangan tetap menghasilkan rentang yang benar.
 */
export const langkahPilih = (
  jangkar: Date | undefined,
  hari: Date,
):
  | { jenis: "mulai"; jangkar: Date }
  | { jenis: "selesai"; rentang: RentangTanggal } => {
  if (!jangkar) return { jenis: "mulai", jangkar: hari };
  const { from, to } = susunRentang(jangkar, hari);
  return { jenis: "selesai", rentang: { mulai: keString(from), selesai: keString(to) } };
};

interface DateRangePickerProps {
  value: RentangTanggal;
  onChange: (rentang: RentangTanggal) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  /**
   * Bulan yang ditampilkan saat kalender pertama kali dibuka dan belum ada
   * pilihan. Menerima Date atau string (mis. nilai dari store yang sudah
   * di-persist ke localStorage dan berubah jadi string).
   */
  defaultMonth?: Date | string;
}

export function DateRangePicker({
  value,
  onChange,
  placeholder = "Pilih rentang tanggal",
  disabled,
  className,
  defaultMonth,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);

  /**
   * Pemilihan dua langkah.
   *
   * `addToRange` bawaan react-day-picker mengembalikan `{ from: X, to: X }`
   * pada klik PERTAMA, sehingga rentang langsung terlihat lengkap dan popover
   * menutup sebelum pengguna sempat memilih tanggal akhir. Karena itu klik
   * ditangani sendiri lewat `onDayClick`:
   *
   * - klik ke-1  -> jadi `jangkar` (tanggal awal), popover tetap terbuka
   * - arahkan    -> `sorot` memperlihatkan pratinjau rentang sampai kursor
   * - klik ke-2  -> rentang disimpan dan popover menutup
   *
   * Selama `jangkar` terisi, nilai di form belum diubah — jadi batal di
   * tengah jalan tidak merusak rentang yang sudah tersimpan.
   */
  const [jangkar, setJangkar] = React.useState<Date>();
  const [sorot, setSorot] = React.useState<Date>();

  const rentangTersimpan: DateRange | undefined = React.useMemo(() => {
    const from = keDate(value.mulai);
    if (!from) return undefined;
    return { from, to: keDate(value.selesai) };
  }, [value.mulai, value.selesai]);

  // Yang digambar kalender: pratinjau saat sedang memilih, nilai tersimpan
  // saat tidak.
  const rentangTampil: DateRange | undefined = jangkar
    ? sorot
      ? susunRentang(jangkar, sorot)
      : { from: jangkar, to: undefined }
    : rentangTersimpan;

  // Bulan yang sedang ditampilkan dikendalikan sendiri supaya dropdown bulan
  // dan tahun benar-benar memindahkan tampilan kalender. Selalu Date valid:
  // meneruskan string/Invalid Date ke react-day-picker membuat layar putih.
  const [bulanTampil, setBulanTampil] = React.useState<Date>(
    () => keDate(value.mulai) ?? keDateAman(defaultMonth) ?? new Date(),
  );

  // Saat popover dibuka, langsung lompat ke bulan rentang yang sudah dipilih.
  // Saat ditutup, pemilihan yang belum selesai dibuang.
  React.useEffect(() => {
    if (open) {
      setBulanTampil(keDate(value.mulai) ?? keDateAman(defaultMonth) ?? new Date());
    } else {
      setJangkar(undefined);
      setSorot(undefined);
    }
    // defaultMonth sengaja tidak diikutkan: perubahannya tidak boleh
    // memindahkan kalender saat popover sedang terbuka.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const label = React.useMemo(() => {
    const from = keDate(value.mulai);
    const to = keDate(value.selesai);
    if (!from) return placeholder;
    if (!to) return tanggalPanjang(from);
    return `${tanggalPanjang(from)} — ${tanggalPanjang(to)}`;
  }, [value.mulai, value.selesai, placeholder]);

  const handleDayClick = (hari: Date) => {
    const langkah = langkahPilih(jangkar, hari);
    if (langkah.jenis === "mulai") {
      setJangkar(langkah.jangkar);
      setSorot(undefined);
      return;
    }
    onChange(langkah.rentang);
    setJangkar(undefined);
    setSorot(undefined);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn("w-full justify-start font-normal", !value.mulai && "text-muted-foreground", className)}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
          <span className="truncate">{label}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        {/* Petunjuk langkah: tanpa ini pengguna tidak tahu klik berikutnya
            akan jadi tanggal awal atau tanggal akhir. */}
        <div className="border-b px-3 py-2 text-xs">
          {jangkar ? (
            <span className="text-foreground">
              Mulai <strong>{tanggalPanjang(jangkar)}</strong> — sekarang klik{" "}
              <strong>tanggal akhir</strong>
            </span>
          ) : (
            <span className="text-muted-foreground">
              Klik <strong className="text-foreground">tanggal awal</strong>
            </span>
          )}
        </div>
        {/* Pratinjau dibersihkan di tingkat wadah, bukan per tanggal:
            onDayMouseLeave ikut menyala saat kursor pindah antar sel yang
            bersebelahan, sehingga sorotannya berkedip. */}
        <div onMouseLeave={() => setSorot(undefined)}>
          <Calendar
            mode="range"
            selected={rentangTampil}
            // Wajib ada walau kosong: di useRange v9, tanpa `onSelect` prop
            // `selected` hanya dipakai sebagai nilai AWAL lalu react-day-picker
            // mengurus rentangnya sendiri — pratinjau di atas akan diabaikan.
            onSelect={() => {}}
            onDayClick={handleDayClick}
            onDayMouseEnter={(hari) => jangkar && setSorot(hari)}
            month={bulanTampil}
            onMonthChange={setBulanTampil}
            locale={localeID}
          />
        </div>
        <div className="flex items-center justify-between gap-2 border-t p-2">
          <span className="px-1 text-xs text-muted-foreground">
            {jangkar ? "Klik lagi untuk mengakhiri" : label !== placeholder ? label : " "}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onChange({ mulai: undefined, selesai: undefined });
              setJangkar(undefined);
              setSorot(undefined);
              setOpen(false);
            }}
          >
            Kosongkan
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
