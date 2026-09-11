// client/components/RiwayatKegiatanPanel.tsx

import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow, parseISO } from "date-fns";
import { id as localeID } from "date-fns/locale";
import {
  FilePlus, FileCheck, FileX, RefreshCw, Pencil, Sparkles, Archive, ArchiveRestore,
  Activity as IkonProgress, Loader2, History,
} from "lucide-react";
import { apiClient } from "@/lib/apiClient";
import type { RiwayatKegiatan } from "@shared/api";
import { cn } from "@/lib/utils";

/**
 * Feed riwayat satu kegiatan.
 *
 * Diambil hanya saat dialog detail dibuka (`enabled` di bawah), bukan ikut di
 * daftar Dashboard — menggabungkannya ke daftar akan mengubah respons lima
 * baris jadi ribuan dan memperlambat halaman utama.
 */

interface TampilanAksi {
  ikon: React.ElementType;
  warna: string;
  /** Menyusun kalimatnya. `jumlah` sudah meringkas operasi massal. */
  kalimat: (r: RiwayatKegiatan) => string;
}

const AKSI: Record<string, TampilanAksi> = {
  kegiatan_dibuat: {
    ikon: Sparkles, warna: 'text-purple-600 dark:text-purple-300',
    kalimat: () => 'membuat kegiatan ini',
  },
  kegiatan_disunting: {
    ikon: Pencil, warna: 'text-blue-600 dark:text-blue-300',
    kalimat: () => 'menyunting kegiatan',
  },
  dokumen_ditambah: {
    ikon: FilePlus, warna: 'text-blue-600 dark:text-blue-300',
    kalimat: r => r.jumlah > 1 ? `menambahkan ${r.jumlah} dokumen` : `menambahkan dokumen ${r.ringkasan ?? ''}`.trim(),
  },
  dokumen_disetujui: {
    ikon: FileCheck, warna: 'text-green-600 dark:text-green-300',
    kalimat: r => r.jumlah > 1 ? `menyetujui ${r.jumlah} dokumen` : `menyetujui dokumen ${r.ringkasan ?? ''}`.trim(),
  },
  dokumen_ditolak: {
    ikon: FileX, warna: 'text-red-600 dark:text-red-300',
    kalimat: r => `menolak dokumen ${r.ringkasan ?? ''}`.trim(),
  },
  dokumen_diunggah_ulang: {
    ikon: RefreshCw, warna: 'text-amber-600 dark:text-amber-300',
    kalimat: r => `mengunggah ulang dokumen ${r.ringkasan ?? ''}`.trim(),
  },
  progress_diupdate: {
    ikon: IkonProgress, warna: 'text-cyan-600 dark:text-cyan-300',
    kalimat: r => `memperbarui progress ${r.ringkasan ?? ''}`.trim(),
  },
  kegiatan_diarsipkan: {
    ikon: Archive, warna: 'text-muted-foreground',
    kalimat: () => 'mengarsipkan kegiatan',
  },
  arsip_dibatalkan: {
    ikon: ArchiveRestore, warna: 'text-muted-foreground',
    kalimat: () => 'membatalkan arsip kegiatan',
  },
};

const BAWAAN: TampilanAksi = {
  ikon: History, warna: 'text-muted-foreground',
  kalimat: r => r.aksi.replace(/_/g, ' '),
};

export default function RiwayatKegiatanPanel({ kegiatanId }: { kegiatanId: number }) {
  const { data: riwayat = [], isLoading, isError } = useQuery({
    queryKey: ['riwayat', kegiatanId],
    queryFn: () => apiClient.get<RiwayatKegiatan[]>(`/kegiatan/${kegiatanId}/riwayat`),
    enabled: !!kegiatanId,
    staleTime: 30_000,
  });

  return (
    // Tanpa judul sendiri: panel ini dibuka lewat tombol "Lihat Riwayat
    // Aktivitas" di dialog detail, yang sudah menjadi judulnya. Menaruh <h4>
    // di sini membuat teks yang sama tercetak dua kali bertumpuk.
    <div className="min-w-0">
      {isLoading ? (
        <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" /> Memuat riwayat...
        </div>
      ) : isError ? (
        <p className="py-4 text-sm text-muted-foreground">Gagal memuat riwayat.</p>
      ) : riwayat.length === 0 ? (
        <p className="py-4 text-sm text-muted-foreground">Belum ada aktivitas tercatat.</p>
      ) : (
        // Garisnya digambar sebagai pseudo-element DI DALAM kotak, bukan
        // `border-l` di tepinya. `overflow-y-auto` memotong apa pun yang keluar
        // dari kotak isi, sehingga ikon yang dulu dipasang pada -27px — di
        // sebelah kiri border — ikut terpotong. Sekarang garis dan ikonnya
        // sama-sama berada di dalam area yang tidak terpotong.
        <ol className="relative space-y-3 pl-8 max-h-64 overflow-y-auto before:absolute before:left-3 before:top-0 before:bottom-0 before:w-px before:bg-border">
          {riwayat.map(r => {
            const tampil = AKSI[r.aksi] ?? BAWAAN;
            const Ikon = tampil.ikon;
            return (
              <li key={r.id} className="relative">
                <span className="absolute -left-6 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-card">
                  <Ikon className={cn("h-3.5 w-3.5", tampil.warna)} />
                </span>
                <p className="text-sm text-foreground">
                  <span className="font-medium">{r.aktorNama ?? 'Seseorang'}</span>{' '}
                  {tampil.kalimat(r)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(parseISO(r.terjadiPada), { addSuffix: true, locale: localeID })}
                </p>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
