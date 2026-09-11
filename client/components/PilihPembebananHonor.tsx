/**
 * Pemilih cara membebankan honor satu alokasi PPL ke bulan-bulannya.
 *
 * Muncul HANYA bila periode honor tahap itu melintasi lebih dari satu bulan.
 * Periode dalam satu bulan tidak punya keputusan apa pun untuk diambil, dan
 * menampilkan pemilih yang isinya cuma satu pilihan justru membuat orang
 * mengira ada yang perlu diatur.
 *
 * Keputusannya per ALOKASI, bukan per kegiatan: batas SBML berlaku per mitra,
 * jadi mitra yang kuotanya masih longgar cukup dibebankan ke satu bulan
 * sementara mitra yang hampir mentok perlu dipecah — dalam kegiatan yang sama.
 *
 * Satu `Select` menampung dua field sekaligus (`metode` dan `bulanDipilih`)
 * lewat nilai bersandi. Alternatifnya dua kontrol berpasangan yang salah
 * satunya kadang tidak berlaku, dan itu lebih membingungkan daripada satu
 * daftar yang setiap barisnya sudah kalimat utuh.
 */

import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import type { OpsiBulan } from "@/lib/honorPeriode";
import type { MetodePembebanan } from "@shared/pembebananHonor";

/** Nilai bersandi untuk satu baris pilihan. */
const SANDI_PRORATA = "prorata";
const SANDI_LUBER = "luber";
const awalanBulan = "bulan:";

export interface PilihPembebananHonorProps {
  opsiBulan: OpsiBulan[];
  metode: MetodePembebanan | undefined;
  bulanDipilih: string | null | undefined;
  onChange: (metode: MetodePembebanan, bulanDipilih: string | null) => void;
  /** Dinonaktifkan mis. saat dokumen terkunci atau pengguna tak berhak menyunting. */
  disabled?: boolean;
}

export default function PilihPembebananHonor({
  opsiBulan, metode, bulanDipilih, onChange, disabled,
}: PilihPembebananHonorProps) {
  if (opsiBulan.length <= 1) return null;

  // Bulan yang tersimpan bisa sudah di luar rentang bila periodenya dipersempit
  // setelah dipilih. Ditampilkan sebagai "belum dipilih" supaya pengguna
  // memilih ulang secara sadar — server sendiri jatuh ke bulan pertama.
  const bulanSah = bulanDipilih && opsiBulan.some(o => o.value === bulanDipilih)
    ? bulanDipilih : null;

  const nilai =
    metode === "prorata" ? SANDI_PRORATA
    : metode === "luber" ? SANDI_LUBER
    : bulanSah ? `${awalanBulan}${bulanSah}`
    : undefined;

  const ubah = (v: string) => {
    if (v === SANDI_PRORATA) return onChange("prorata", null);
    if (v === SANDI_LUBER) return onChange("luber", null);
    onChange("bulan_tertentu", v.slice(awalanBulan.length));
  };

  return (
    <div className="space-y-2">
      <Label>Pembebanan Honor</Label>
      <Select value={nilai} onValueChange={ubah} disabled={disabled}>
        <SelectTrigger>
          <SelectValue placeholder="Pilih cara pembebanan..." />
        </SelectTrigger>
        <SelectContent>
          {opsiBulan.map(o => (
            <SelectItem key={o.value} value={`${awalanBulan}${o.value}`}>
              Seluruhnya di {o.label}
            </SelectItem>
          ))}
          <SelectItem value={SANDI_PRORATA}>Bagi menurut jumlah hari</SelectItem>
          <SelectItem value={SANDI_LUBER}>Penuhi batas bulan pertama, sisanya ke bulan berikutnya</SelectItem>
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">
        Periode honor tahap ini melintasi {opsiBulan.length} bulan. Batas SBML dihitung
        per bulan, jadi tiap mitra bisa diatur sendiri.
      </p>
    </div>
  );
}
