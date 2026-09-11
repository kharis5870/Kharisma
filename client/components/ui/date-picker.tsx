import * as React from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { id as localeID } from "date-fns/locale";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { keDate, keString } from "@/components/ui/date-range-picker";

/**
 * Pemilih satu tanggal.
 *
 * Dibuat karena `<input type="date">` bawaan peramban hanya membuka kalender
 * dari ikonnya sendiri — mengeklik kotak teksnya cuma memindahkan kursor antar
 * segmen dd/mm/yyyy. Perilaku itu milik peramban dan tidak bisa diubah lewat
 * CSS. Di sini SELURUH kotak adalah tombol, sehingga diklik di mana pun akan
 * membuka kalender.
 *
 * Nilainya string "yyyy-MM-dd", sama seperti `<input type="date">` yang
 * digantikannya dan sama dengan kolom DATE di MySQL — jadi pemanggil tidak
 * perlu mengurus konversi zona waktu.
 */
interface DatePickerProps {
  value?: string;
  onChange: (nilai: string | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Pilih tanggal",
  disabled,
  className,
  id,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const terpilih = keDate(value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start font-normal",
            !terpilih && "text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
          <span className="truncate">
            {terpilih ? format(terpilih, "dd MMMM yyyy", { locale: localeID }) : placeholder}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={terpilih}
          onSelect={(tanggal) => {
            onChange(keString(tanggal));
            // Pilihan tunggal selesai dalam satu klik, jadi popover langsung ditutup.
            if (tanggal) setOpen(false);
          }}
          defaultMonth={terpilih}
          locale={localeID}
        />
      </PopoverContent>
    </Popover>
  );
}
