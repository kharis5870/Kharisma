// client/components/kontrak/DialogAturUlangNomor.tsx

/**
 * Konfirmasi pengaturan ulang nomor surat sebuah periode.
 *
 * Dibuat tersendiri, tidak memakai `ConfirmationModal` yang ada, karena modal
 * itu hanya menyodorkan dua tombol. Tindakan ini menghapus nomor surat resmi,
 * tidak bisa dibatalkan, dan bisa melahirkan dua surat bernomor sama — jadi ia
 * menuntut pengguna mengetik ulang sebuah frasa lebih dulu, bukan sekadar
 * mengklik.
 */

import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Loader2, RotateCcw } from "lucide-react";
import {
  FRASA_KONFIRMASI_ATUR_ULANG,
  konfirmasiAturUlangSah,
  kalimatRingkasanNomor,
  type RingkasanNomorPeriode,
} from "@shared/aturUlangNomor";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onKonfirmasi: () => void;
  labelPeriode: string;
  ringkasan: RingkasanNomorPeriode;
  sedangProses: boolean;
}

export default function DialogAturUlangNomor({
  isOpen, onClose, onKonfirmasi, labelPeriode, ringkasan, sedangProses,
}: Props) {
  const [teks, setTeks] = useState("");

  // Dikosongkan tiap dialog dibuka; frasa yang masih tersisa dari percobaan
  // sebelumnya akan membuat tombolnya langsung aktif.
  useEffect(() => { if (isOpen) setTeks(""); }, [isOpen]);

  const boleh = konfirmasiAturUlangSah(teks) && !sedangProses;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertTriangle className="w-5 h-5" /> Atur Ulang Nomor Surat
          </DialogTitle>
          <DialogDescription>Periode {labelPeriode}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <p className="font-medium text-foreground">{kalimatRingkasanNomor(ringkasan)}</p>

          <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
            <li>
              Nomor BAST menumpang baris yang sama, jadi nomor BAST periode ini{" "}
              <strong className="text-foreground">ikut hilang</strong> dan harus dibuat
              ulang setelah Surat PK dinomori ulang.
            </li>
            <li>
              Surat yang sudah dicetak atau ditandatangani dengan nomor lama{" "}
              <strong className="text-foreground">tidak ikut berubah</strong>. Bila nomor
              lama nanti terpakai lagi, akan ada dua surat bernomor sama.
            </li>
            <li>Tindakan ini tidak bisa dibatalkan.</li>
          </ul>

          <div className="space-y-2 pt-1">
            <Label htmlFor="konfirmasiAturUlang">
              Ketik <code className="font-mono font-semibold text-foreground">{FRASA_KONFIRMASI_ATUR_ULANG}</code> untuk melanjutkan
            </Label>
            <Input
              id="konfirmasiAturUlang"
              value={teks}
              onChange={(e) => setTeks(e.target.value)}
              placeholder={FRASA_KONFIRMASI_ATUR_ULANG}
              autoFocus
              autoComplete="off"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={sedangProses}>Batal</Button>
          <Button variant="destructive" onClick={onKonfirmasi} disabled={!boleh}>
            {sedangProses
              ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Menghapus...</>
              : <><RotateCcw className="w-4 h-4 mr-2" /> Atur Ulang Nomor</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
