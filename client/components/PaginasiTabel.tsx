// client/components/PaginasiTabel.tsx

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pagination, PaginationContent, PaginationItem } from "@/components/ui/pagination";
import type { PaginasiTabel as StatePaginasi } from "@/hooks/usePaginasiTabel";

const PILIHAN_BARIS = [10, 25, 50, 100];

/**
 * Bagian bawah tabel: jumlah data, pilihan baris per halaman, dan tombol halaman.
 *
 * Tampilannya disamakan dengan footer tabel Manajemen Honor, supaya semua tabel
 * di aplikasi terasa sama. State-nya dari `usePaginasiTabel`.
 */
export default function PaginasiTabel<T>({ paginasi }: { paginasi: StatePaginasi<T> }) {
  const { halaman, setHalaman, barisPerHalaman, setBarisPerHalaman, totalHalaman, dataHalaman, jumlahData } = paginasi;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mt-4">
      <div className="text-sm text-muted-foreground">
        Menampilkan <strong>{dataHalaman.length}</strong> dari <strong>{jumlahData}</strong> data
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm">Baris per halaman:</span>
          <Select value={String(barisPerHalaman)} onValueChange={nilai => setBarisPerHalaman(Number(nilai))}>
            <SelectTrigger className="w-20 h-8"><SelectValue /></SelectTrigger>
            <SelectContent>
              {PILIHAN_BARIS.map(jumlah => (
                <SelectItem key={jumlah} value={String(jumlah)}>{jumlah}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Pagination className="mx-0 w-auto">
          <PaginationContent>
            <PaginationItem>
              <Button variant="outline" size="sm" aria-label="Halaman sebelumnya"
                onClick={() => setHalaman(Math.max(1, halaman - 1))} disabled={halaman <= 1}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </PaginationItem>
            <PaginationItem className="text-sm font-medium px-3">
              {halaman} / {totalHalaman || 1}
            </PaginationItem>
            <PaginationItem>
              <Button variant="outline" size="sm" aria-label="Halaman berikutnya"
                onClick={() => setHalaman(Math.min(totalHalaman, halaman + 1))} disabled={halaman >= totalHalaman}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}
