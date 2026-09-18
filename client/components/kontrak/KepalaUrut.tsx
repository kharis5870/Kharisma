// client/components/kontrak/KepalaUrut.tsx

import { ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { KolomUrutSurat, UrutanSurat } from "@/lib/urutSurat";

/**
 * Judul kolom yang bisa diklik untuk mengurutkan, di tabel Generate SPK & BAST.
 *
 * Tampilannya sama dengan tombol urut di Daftar PPL dan Manajemen Honor: panah
 * pudar untuk kolom yang tidak aktif, panah biru naik/turun untuk kolom aktif.
 */
export default function KepalaUrut({ label, kolom, urutan, onUrut, className }: {
  label: string;
  kolom: KolomUrutSurat;
  urutan: UrutanSurat;
  onUrut: (kolom: KolomUrutSurat) => void;
  className?: string;
}) {
  const aktif = urutan.key === kolom;
  return (
    <button
      type="button"
      onClick={() => onUrut(kolom)}
      className={cn("flex items-center gap-1 whitespace-nowrap hover:bg-muted/50 p-1 rounded -ml-1", className)}
    >
      {label}
      {!aktif
        ? <ChevronUp className="w-4 h-4 text-border" />
        : urutan.direction === "asc"
          ? <ChevronUp className="w-4 h-4 text-blue-600 dark:text-blue-300" />
          : <ChevronDown className="w-4 h-4 text-blue-600 dark:text-blue-300" />}
    </button>
  );
}
