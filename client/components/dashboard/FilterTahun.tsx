import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { CalendarRange, Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { labelSaringTahun, type SaringTahun } from "@/lib/tahunKegiatan";

/**
 * Penyaring tahun kegiatan di Dashboard.
 *
 * SATU kendali untuk tiga mode — semua tahun, satu tahun, dan rentang — supaya
 * baris filter tidak bertambah lebar. Versi sebelumnya memunculkan blok
 * "Rentang" KEDUA di sebelahnya begitu mode rentang dipilih; blok itu melewati
 * tepi kotak filter dan mendorong filter lain.
 *
 * Rentang dipilih di dalam popover, lalu hasilnya ditampilkan pada tombolnya
 * sendiri ("Tahun 2024–2026"), jadi tidak ada ruang tambahan yang terpakai
 * setelah selesai memilih.
 */
export const FilterTahun = ({ daftarTahun, saring, onUbah }: {
  daftarTahun: readonly number[];
  saring: SaringTahun;
  onUbah: (saring: SaringTahun) => void;
}) => {
  const [terbuka, setTerbuka] = useState(false);

  // Nilai awal rentang: seluruh tahun yang ada. Kalau data belum punya tahun
  // sama sekali, jatuh ke tahun berjalan supaya kendalinya tetap bisa dipakai.
  const tahunTerbaru = daftarTahun[0] ?? new Date().getFullYear();
  const tahunTerlama = daftarTahun[daftarTahun.length - 1] ?? tahunTerbaru;
  const dari = saring.mode === 'rentang' ? saring.dari : tahunTerlama;
  const sampai = saring.mode === 'rentang' ? saring.sampai : tahunTerbaru;

  const pilihTahun = (baru: SaringTahun) => {
    onUbah(baru);
    setTerbuka(false);
  };

  return (
    <div className="sm:w-64">
      <Label htmlFor="tahun-filter" className="text-sm font-medium text-foreground mb-2 block">
        Filter Tahun
      </Label>
      <Popover open={terbuka} onOpenChange={setTerbuka}>
        <PopoverTrigger asChild>
          <Button
            id="tahun-filter"
            variant="outline"
            className="w-full justify-between font-normal"
          >
            <span className="flex items-center gap-2 truncate">
              <CalendarRange className="w-4 h-4 shrink-0" />
              {labelSaringTahun(saring)}
            </span>
            <ChevronDown className="w-4 h-4 opacity-50 shrink-0" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-64 p-2" align="start">
          <button
            type="button"
            onClick={() => pilihTahun({ mode: 'semua' })}
            className={cn(
              "flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-sm hover:bg-accent",
              saring.mode === 'semua' && "font-medium",
            )}
          >
            Semua Tahun
            {saring.mode === 'semua' && <Check className="w-4 h-4" />}
          </button>

          {daftarTahun.map(t => (
            <button
              key={t}
              type="button"
              onClick={() => pilihTahun({ mode: 'satu', tahun: t })}
              className={cn(
                "flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-sm hover:bg-accent",
                saring.mode === 'satu' && saring.tahun === t && "font-medium",
              )}
            >
              {t}
              {saring.mode === 'satu' && saring.tahun === t && <Check className="w-4 h-4" />}
            </button>
          ))}

          <Separator className="my-2" />

          <p className="px-2 pb-1 text-xs text-muted-foreground">Rentang tahun</p>
          <div className="flex items-center gap-1 px-1 pb-1">
            <Select
              value={String(dari)}
              onValueChange={v => onUbah({ mode: 'rentang', dari: Number(v), sampai })}
            >
              <SelectTrigger className="h-8 text-sm" aria-label="Dari tahun"><SelectValue /></SelectTrigger>
              <SelectContent>
                {daftarTahun.map(t => (<SelectItem key={t} value={String(t)}>{t}</SelectItem>))}
              </SelectContent>
            </Select>
            <span className="shrink-0 text-xs text-muted-foreground">s.d.</span>
            <Select
              value={String(sampai)}
              onValueChange={v => onUbah({ mode: 'rentang', dari, sampai: Number(v) })}
            >
              <SelectTrigger className="h-8 text-sm" aria-label="Sampai tahun"><SelectValue /></SelectTrigger>
              <SelectContent>
                {daftarTahun.map(t => (<SelectItem key={t} value={String(t)}>{t}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default FilterTahun;
