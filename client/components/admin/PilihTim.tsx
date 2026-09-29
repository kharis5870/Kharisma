import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

/**
 * Pemilih tim untuk modal Tambah dan Edit Ketua Tim.
 *
 * Pilihannya datang dari `opsiTim` — tim yang sudah tercatat di data ditambah
 * daftar bawaan — plus satu jalan keluar: "Tim lainnya…" membuka kotak isian
 * untuk tim yang belum pernah ada, misalnya ketika BPS membentuk tim baru.
 *
 * Dipakai bersama oleh kedua modal supaya keduanya tidak mungkin berbeda
 * perilaku; sebelumnya masing-masing memuat daftar tetap yang sama, disalin.
 *
 * Nama yang diketik dirapikan saat DISIMPAN (lihat `samakanNamaTim` di
 * pemanggilnya), bukan pada setiap ketikan — merapikan sambil mengetik membuat
 * spasi hilang sebelum orang sempat mengetik kata berikutnya.
 */

const LAINNYA = "__lainnya__";

export const PilihTim = ({ id, nilai, opsi, onUbah }: {
  id: string;
  nilai: string | null | undefined;
  opsi: readonly string[];
  onUbah: (tim: string | null) => void;
}) => {
  // Mengetik bebas begitu "Tim lainnya…" dipilih, ATAU ketika nilai tersimpan
  // memang tidak ada di daftar — data lama boleh saja memuat ejaan yang sudah
  // tidak ditawarkan lagi, dan itu tidak boleh diam-diam hilang saat disimpan.
  const [ketik, setKetik] = useState(
    Boolean(nilai) && !opsi.some(o => o === nilai));

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>Tim</Label>
      {ketik ? (
        <>
          <Input
            id={id}
            autoFocus
            value={nilai ?? ""}
            onChange={e => onUbah(e.target.value)}
            placeholder="Nama tim baru, mis. Pertanian"
          />
          <button
            type="button"
            className="text-xs text-muted-foreground underline underline-offset-2"
            onClick={() => { setKetik(false); onUbah(null); }}
          >
            Pilih dari daftar saja
          </button>
        </>
      ) : (
        <Select
          value={nilai || undefined}
          onValueChange={val => {
            if (val === LAINNYA) { setKetik(true); onUbah(null); return; }
            onUbah(val);
          }}
        >
          <SelectTrigger id={id}><SelectValue placeholder="Pilih tim..." /></SelectTrigger>
          <SelectContent>
            {opsi.map(t => (<SelectItem key={t} value={t}>{t}</SelectItem>))}
            <SelectItem value={LAINNYA}>+ Tim lainnya…</SelectItem>
          </SelectContent>
        </Select>
      )}
    </div>
  );
};

export default PilihTim;
