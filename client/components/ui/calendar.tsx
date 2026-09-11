import * as React from "react";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { isValid } from "date-fns";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

/**
 * react-day-picker meneruskan `month`/`defaultMonth` ke date-fns tanpa
 * validasi. Bila nilainya string (mis. dari store zustand yang di-persist ke
 * localStorage lalu rehydrate) atau Invalid Date, date-fns melempar
 * "RangeError: Invalid time value" saat render dan seluruh layar jadi putih.
 * Semua nilai bulan disaring lewat sini lebih dulu.
 */
const bulanValid = (nilai: unknown): Date | undefined => {
  if (nilai == null) return undefined;
  const d = nilai instanceof Date ? nilai : new Date(nilai as string | number);
  return isValid(d) ? d : undefined;
};

/**
 * Rentang tahun bawaan pada dropdown: 5 tahun lalu s.d. 5 tahun ke depan.
 * Bawaan react-day-picker adalah 100 tahun ke belakang, yang membuat daftar
 * tahunnya terlalu panjang untuk keperluan aplikasi ini.
 */
const TAHUN_SEKARANG = new Date().getFullYear();

/** Lebar & tinggi satu sel tanggal. Dipakai seragam di baris nama hari dan
 *  baris tanggal — inilah yang menjamin kolomnya sejajar. */
const UKURAN_SEL = "h-9 w-9";

/**
 * Pembungkus react-day-picker v9.
 *
 * Tiga hal yang berbeda dari v8 dan pernah membuat kalender ini rusak:
 *
 * 1. Seluruh nama elemen berganti (`head_row` -> `weekdays`, `head_cell` ->
 *    `weekday`, `row` -> `week`, `cell` -> `day`, `table` -> `month_grid`).
 *    Memakai nama v8 tidak memunculkan error, kelasnya hanya diabaikan.
 * 2. `nav` bukan lagi anak dari caption, melainkan anak dari `months`. Karena
 *    itu `months` WAJIB `relative`; tanpa itu nav yang `absolute` melompat ke
 *    ancestor ber-posisi terdekat (popover) dan menyeret lebar kalender.
 * 3. Saat `captionLayout="dropdown"`, v9 merender `<select>` ASLI sekaligus
 *    `<span>` label hias. Tanpa stylesheet bawaan v9, keduanya tampil dan
 *    saling tumpuk. Pola yang benar: select dibuat transparan menutupi label.
 *
 * Semua ukuran di bawah sengaja tetap (`w-9`), bukan persentase. Popover
 * membungkus isinya (shrink-to-fit), jadi `w-full`/`flex-1` di dalamnya
 * menciptakan ketergantungan melingkar antara lebar induk dan lebar isi.
 */
function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  // Dropdown bulan & tahun dijadikan bawaan supaya pengguna tidak perlu
  // menekan panah berkali-kali untuk mencapai periode yang jauh. Tetap bisa
  // ditimpa dengan captionLayout="label" bila ada kebutuhan lain.
  captionLayout = "dropdown",
  startMonth = new Date(TAHUN_SEKARANG - 5, 0),
  endMonth = new Date(TAHUN_SEKARANG + 5, 11),
  month,
  defaultMonth,
  ...props
}: CalendarProps) {
  const pakaiDropdown = captionLayout !== "label";

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      captionLayout={captionLayout}
      startMonth={startMonth}
      endMonth={endMonth}
      month={bulanValid(month)}
      defaultMonth={bulanValid(defaultMonth)}
      className={cn("p-3", className)}
      classNames={{
        // `w-fit` memberi kalender lebar intrinsik supaya popover `w-auto`
        // di luarnya tahu harus selebar apa.
        root: "w-fit",
        // `relative` di sini adalah jangkar untuk `nav` yang absolute.
        months: "relative flex flex-col sm:flex-row gap-4",
        month: "flex flex-col gap-4",

        month_caption: "flex h-9 items-center justify-center",

        // Nav menumpang di atas baris caption. Bar-nya dibuat tembus klik
        // supaya tidak menghalangi dropdown bulan/tahun di tengah.
        nav: "absolute inset-x-0 top-1 z-10 flex items-center justify-between pointer-events-none",
        button_previous: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-60 hover:opacity-100 pointer-events-auto",
        ),
        button_next: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-60 hover:opacity-100 pointer-events-auto",
        ),

        // Dropdown bulan & tahun. `<select>` asli ditumpuk transparan di atas
        // label agar yang terlihat hanya label bergaya, tapi klik tetap
        // membuka daftar pilihan bawaan peramban.
        dropdowns: "flex items-center gap-1.5",
        dropdown_root:
          "relative flex items-center rounded-md border border-input bg-background " +
          "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
        dropdown: "absolute inset-0 h-full w-full cursor-pointer opacity-0",
        caption_label: pakaiDropdown
          ? "flex h-8 select-none items-center gap-1 px-2 text-sm font-medium [&>svg]:h-3.5 [&>svg]:w-3.5 [&>svg]:text-muted-foreground"
          : "select-none text-sm font-medium",

        // v9 merender kisi tanggal sebagai tabel HTML. Baris nama hari dan
        // baris tanggal sama-sama dijadikan flex dengan sel selebar w-9,
        // sehingga kolomnya pasti sejajar.
        month_grid: "border-collapse",
        weekdays: "flex",
        weekday: cn(
          UKURAN_SEL,
          "flex items-center justify-center font-normal text-[0.8rem] text-muted-foreground",
        ),
        weeks: "",
        week: "flex",

        day: cn(UKURAN_SEL, "relative p-0 text-center focus-within:relative focus-within:z-20"),
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          UKURAN_SEL,
          "p-0 font-normal aria-selected:opacity-100",
        ),

        // Status pemilihan.
        selected:
          "[&>button]:bg-primary [&>button]:text-primary-foreground " +
          "[&>button:hover]:bg-primary [&>button:hover]:text-primary-foreground",
        range_start: "rounded-l-md",
        range_end: "rounded-r-md",
        range_middle:
          "bg-accent rounded-none [&>button]:bg-transparent [&>button]:text-accent-foreground " +
          "[&>button:hover]:bg-accent [&>button:hover]:text-accent-foreground",

        today: "[&>button]:bg-accent [&>button]:text-accent-foreground",
        outside: "text-muted-foreground opacity-50",
        disabled: "text-muted-foreground opacity-50",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        // Dipakai panah navigasi (left/right) sekaligus penanda dropdown (down).
        Chevron: ({ orientation }) => {
          const Ikon =
            orientation === "left"
              ? ChevronLeft
              : orientation === "right"
                ? ChevronRight
                : orientation === "up"
                  ? ChevronUp
                  : ChevronDown;
          return <Ikon className="h-4 w-4" />;
        },
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
