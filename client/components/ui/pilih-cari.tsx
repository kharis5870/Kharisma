/**
 * Pilihan dengan kotak pencarian, untuk daftar yang terlalu panjang untuk
 * digulir — daftar kecamatan dan desa di Kabupaten Bengkulu Selatan.
 *
 * `Select` biasa memaksa pengguna menggulir belasan sampai ratusan baris untuk
 * menemukan satu desa. Pola Popover + Command sudah dipakai di Input dan Edit
 * Kegiatan untuk memilih mitra; komponen ini menjadikannya satu tempat supaya
 * perilakunya seragam dan tidak disalin berulang.
 *
 * Nilai "all" diperlakukan khusus sebagai "semua", bukan sebagai salah satu
 * pilihan, sehingga pemanggil tidak perlu menyisipkannya sendiri ke daftar.
 */

import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

export const NILAI_SEMUA = "all";

export interface OpsiPilihCari {
  nilai: string;
  label: string;
}

interface Props {
  nilai: string;
  onUbah: (nilai: string) => void;
  opsi: OpsiPilihCari[];
  /** Label untuk pilihan "semua"; bila kosong, pilihan itu tidak ditawarkan. */
  labelSemua?: string;
  placeholder?: string;
  cariPlaceholder?: string;
  pesanKosong?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export function PilihCari({
  nilai, onUbah, opsi, labelSemua, placeholder = "Pilih...",
  cariPlaceholder = "Cari...", pesanKosong = "Tidak ditemukan.",
  disabled, className, id,
}: Props) {
  const [terbuka, setTerbuka] = useState(false);

  const terpilih = nilai === NILAI_SEMUA
    ? labelSemua
    : opsi.find(o => o.nilai === nilai)?.label;

  const pilih = (baru: string) => {
    onUbah(baru);
    setTerbuka(false);
  };

  return (
    <Popover open={terbuka} onOpenChange={setTerbuka}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          role="combobox"
          aria-expanded={terbuka}
          disabled={disabled}
          className={cn("justify-between font-normal", !terpilih && "text-muted-foreground", className)}
        >
          <span className="truncate">{terpilih || placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder={cariPlaceholder} />
          <CommandEmpty>{pesanKosong}</CommandEmpty>
          <CommandGroup>
            <CommandList>
              {labelSemua && (
                <CommandItem value={labelSemua} onSelect={() => pilih(NILAI_SEMUA)}>
                  <Check className={cn("mr-2 h-4 w-4", nilai === NILAI_SEMUA ? "opacity-100" : "opacity-0")} />
                  {labelSemua}
                </CommandItem>
              )}
              {opsi.map(o => (
                // `value` memuat labelnya karena cmdk menyaring berdasarkan
                // value, bukan berdasarkan isi yang dirender.
                <CommandItem key={o.nilai} value={o.label} onSelect={() => pilih(o.nilai)}>
                  <Check className={cn("mr-2 h-4 w-4", nilai === o.nilai ? "opacity-100" : "opacity-0")} />
                  {o.label}
                </CommandItem>
              ))}
            </CommandList>
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default PilihCari;
