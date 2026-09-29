/**
 * Baris ajakan "Impor Alokasi dari Excel" di atas tab tahap.
 *
 * Diletakkan DI ATAS ketiga tab, bukan di dalam salah satunya, karena satu
 * berkas mengisi ketiga tahap sekaligus. Tombol yang duduk di kartu "Listing"
 * tetapi juga menambah alokasi Pencacahan akan menipu orang yang menekannya.
 *
 * Komponen ini hanya membawa tampilan dan keadaan buka/tutup dialognya; semua
 * bahan (daftar mitra, PML, harga satuan) dioper dari halaman yang memakainya,
 * karena Input Kegiatan menyimpan formnya di store zustand sedangkan Edit
 * Kegiatan menyimpannya di state biasa.
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet } from "lucide-react";
import ImporAlokasiDialog, { type ImporAlokasiDialogProps } from "@/components/ImporAlokasiDialog";

type Props = Omit<ImporAlokasiDialogProps, "isOpen" | "onClose">;

export default function PanelImporAlokasi(props: Props) {
  const [buka, setBuka] = useState(false);

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed p-3">
      <p className="text-sm text-muted-foreground">
        Punya daftar alokasinya di Excel? Satu berkas mengisi Listing, Pencacahan, dan Pengolahan
        sekaligus &mdash; lengkap dengan PML dan beban kerjanya.
      </p>
      <Button type="button" variant="outline" size="sm" onClick={() => setBuka(true)}>
        <FileSpreadsheet className="w-4 h-4 mr-2" />
        Impor Alokasi dari Excel
      </Button>

      <ImporAlokasiDialog {...props} isOpen={buka} onClose={() => setBuka(false)} />
    </div>
  );
}
