import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { NADA_IKON } from "@/lib/statusStyles";

/** Label tombol tutup, satu sumber kebenaran untuk komponen dan tesnya. */
export const LABEL_TUTUP = "Tutup";

/**
 * Apakah tombol aksi perlu ditampilkan TERPISAH dari tombol tutup?
 *
 * Dipisah jadi fungsi murni supaya bisa diuji: komponennya sendiri memakai
 * Radix Dialog yang merender lewat Portal, sehingga tidak menghasilkan apa pun
 * saat dirender ke string.
 *
 * Latar belakang: `actionLabel` bawaannya "Tutup" sedangkan tombol batal juga
 * menulis "Tutup". Akibatnya modal logout — dan empat halaman lain yang
 * mengoper actionLabel "Tutup"/"OK" dengan onAction yang cuma menutup —
 * menampilkan DUA tombol bertuliskan sama yang melakukan hal yang sama.
 */
export const perluDuaTombol = (actionLabel: string | undefined, adaAksi: boolean): boolean => {
  if (!adaAksi) return false;
  const label = (actionLabel ?? '').trim().toLowerCase();
  // Label yang maknanya "tutup saja" bukan aksi terpisah.
  return label !== '' && label !== LABEL_TUTUP.toLowerCase() && label !== 'ok';
};

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  /**
   * Label tombol kiri. Bawaannya "Tutup", tetapi ada modal yang tombol kirinya
   * adalah pilihan sungguhan ("Tetap di Halaman Edit"), bukan sekadar menutup.
   */
  closeLabel?: string;
  /**
   * Tombol kiri yang MEMBATALKAN tindakan yang baru saja berhasil, mis. "Batal
   * Simpan Kegiatan". Berbeda dari `closeLabel`: saat ini dipakai, menutup
   * dialog lewat ESC atau klik di luar TIDAK memicunya — dialog diperlakukan
   * seperti aksi utama. Tanpa itu, sekadar menekan ESC akan membatalkan
   * penyimpanan. Hitung mundur otomatis juga dihentikan begitu tombol ini
   * ditekan, supaya pengalihan tidak menyalip pembatalan yang sedang berjalan.
   */
  aksiKedua?: { label: string; onClick: () => void };
  autoCloseDelay?: number; 
}

export default function SuccessModal({
  isOpen,
  onClose,
  title,
  description,
  actionLabel = "Tutup",
  onAction,
  closeLabel,
  aksiKedua,
  autoCloseDelay = 3000
}: SuccessModalProps) {
  const aksiBerbeda = perluDuaTombol(actionLabel, !!onAction) || !!aksiKedua;

  // Aksi dibaca lewat ref: pemanggil umumnya mengoper fungsi inline, dan kalau
  // fungsi itu jadi dependensi efek, setiap render induk memulai ulang hitung
  // mundurnya dari awal.
  const aksiRef = useRef({ onAction, onClose });
  aksiRef.current = { onAction, onClose };

  const [timerAktif, setTimerAktif] = useState(true);
  const [sisaDetik, setSisaDetik] = useState(Math.ceil(autoCloseDelay / 1000));
  useEffect(() => {
    if (isOpen) {
      setTimerAktif(true);
      setSisaDetik(Math.ceil(autoCloseDelay / 1000));
    }
  }, [isOpen, autoCloseDelay]);

  useEffect(() => {
    if (!isOpen || autoCloseDelay <= 0 || !timerAktif) return;
    const detak = setInterval(() => setSisaDetik(d => Math.max(0, d - 1)), 1000);
    const timer = setTimeout(() => {
      const { onAction: aksi, onClose: tutup } = aksiRef.current;
      if (aksi) aksi(); else tutup();
    }, autoCloseDelay);
    return () => { clearTimeout(timer); clearInterval(detak); };
  }, [isOpen, autoCloseDelay, timerAktif]);

  const tanganiTutup = (buka: boolean) => {
    if (buka) return;
    // Dengan aksiKedua, menutup dialog = aksi utama. Lihat komentar prop.
    if (aksiKedua && onAction) onAction(); else onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={tanganiTutup}>
      {/* showCloseButton={false}: modal ini sudah punya tombol "Tutup" sendiri
          di bawah, jadi tombol X bawaan DialogContent akan jadi yang kedua. */}
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <div className="flex flex-col items-center text-center space-y-4 py-6">
          {/* Success Icon */}
          <div className="relative">
            <div className={cn("w-20 h-20 rounded-full flex items-center justify-center", NADA_IKON.hijau)}>
              <CheckCircle className="w-12 h-12" />
            </div>
            {/* Animated ring */}
            <div className="absolute inset-0 w-20 h-20 border-4 border-green-300 dark:border-green-700 rounded-full animate-ping opacity-75"></div>
          </div>

          {/* DialogTitle/Description wajib demi aksesibilitas: tanpanya Radix
              memunculkan peringatan di konsol dan pembaca layar kehilangan
              nama dialognya. */}
          <DialogTitle className="text-2xl font-bold text-foreground">{title}</DialogTitle>

          {description ? (
            <DialogDescription className="text-muted-foreground text-center max-w-sm text-base">
              {description}
            </DialogDescription>
          ) : (
            <DialogDescription className="sr-only">{title}</DialogDescription>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 w-full mt-6">
            {aksiBerbeda ? (
              <>
                {aksiKedua ? (
                  <Button
                    variant="outline"
                    onClick={() => { setTimerAktif(false); aksiKedua.onClick(); }}
                    className="flex-1 border-red-300 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950/40"
                  >
                    {aksiKedua.label}
                  </Button>
                ) : (
                  <Button variant="outline" onClick={onClose} className="flex-1">
                    {closeLabel ?? LABEL_TUTUP}
                  </Button>
                )}
                <Button
                  onClick={onAction}
                  className="flex-1 bg-bps-green-600 hover:bg-bps-green-700"
                >
                  {actionLabel}
                </Button>
              </>
            ) : (
              // Satu tombol saja. onAction dipakai kalau ada, karena sebagian
              // pemanggil menaruh pembersihan state di situ, bukan di onClose.
              <Button onClick={onAction ?? onClose} className="flex-1 bg-bps-green-600 hover:bg-bps-green-700">
                {LABEL_TUTUP}
              </Button>
            )}
          </div>

          {/* Auto-close indicator */}
          {autoCloseDelay > 0 && timerAktif && (
            <div className="text-xs text-muted-foreground mt-4">
              {/* Dulu memakai `onAction ? 'redirect' : 'tertutup'`, sehingga modal
                  logout tertulis "akan redirect" padahal onAction-nya cuma
                  menutup. Yang menentukan adalah ada-tidaknya aksi BERBEDA. */}
              Akan {aksiBerbeda ? 'dialihkan' : 'tertutup'} otomatis dalam {sisaDetik} detik
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
