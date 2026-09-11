// client/components/NotificationDropdown.tsx

import { useState, useRef, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Bell, FileText, Clock, ExternalLink, CheckCircle, AlertCircle, Loader2,
  MapPin, AlertOctagon, AlertTriangle, CalendarClock, RefreshCw, FileSignature, BellRing} from "lucide-react";
import type { AppNotification, NotificationKind } from "@shared/api";
import { apiClient } from "@/lib/apiClient";
import { useAuth } from "@/contexts/AuthContext";

const getRelativeTime = (dateString: string) => {
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diffInSeconds < 60) return "Baru saja";
  const menit = Math.floor(diffInSeconds / 60);
  if (menit < 60) return `${menit} menit yang lalu`;
  const jam = Math.floor(menit / 60);
  if (jam < 24) return `${jam} jam yang lalu`;
  return `${Math.floor(jam / 24)} hari yang lalu`;
};

const formatTahap = (tahap?: string | null) =>
  tahap ? tahap.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '';

/** Ikon, warna, dan pengelompokan per jenis notifikasi. */
const META: Record<NotificationKind, { icon: React.ElementType; chip: string; grup: string }> = {
  document_rejected: {
    icon: AlertOctagon, grup: 'Perlu diperbaiki',
    chip: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  },
  // Dikelompokkan bersama "Perlu diperbaiki": bagi ketua tim, dokumen yang
  // ditegur tim keuangan sama mendesaknya dengan dokumen yang ditolak.
  document_reminder: {
    icon: BellRing, grup: 'Perlu diperbaiki',
    chip: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  },
  deadline_overdue: {
    icon: AlertTriangle, grup: 'Perlu diperbaiki',
    chip: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  },
  deadline_soon: {
    icon: CalendarClock, grup: 'Tenggat mendekat',
    chip: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  },
  document_pending: {
    icon: FileText, grup: 'Menunggu persetujuan',
    chip: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  },
  document_resubmitted: {
    icon: RefreshCw, grup: 'Menunggu persetujuan',
    chip: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  },
  document_keuangan_kosong: {
    icon: FileSignature, grup: 'Perlu diisi',
    chip: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
  },
  progress_stale: {
    icon: Clock, grup: 'Informasi',
    chip: 'bg-muted text-muted-foreground',
  },
};

const URUTAN_GRUP = ['Perlu diperbaiki', 'Tenggat mendekat', 'Perlu diisi', 'Menunggu persetujuan', 'Informasi'] as const;

/** Tujuan tautan per jenis. Dibangun di klien supaya server tidak perlu tahu rute. */
const tujuanNotifikasi = (n: AppNotification): string => {
  switch (n.kind) {
    case 'progress_stale':
      return `/dashboard`;
    default:
      // Termasuk document_rejected: dulu diarahkan ke Edit Kegiatan, padahal
      // halaman itu tidak pernah menampilkan alasan penolakan. View Documents
      // menampilkannya, dan dari sana ada tombol menuju perbaikannya.
      return `/view-documents/${n.kegiatanId}?tahap=${n.tahap}`;
  }
};

const judulNotifikasi = (n: AppNotification) => {
  switch (n.kind) {
    case 'document_rejected':
      return <>Dokumen <span className="font-bold">{n.namaDokumen}</span> ditolak.</>;
    case 'document_pending':
      return <>Dokumen <span className="font-bold">{n.namaDokumen}</span> perlu disetujui.</>;
    case 'document_resubmitted':
      return <>Dokumen <span className="font-bold">{n.namaDokumen}</span> sudah diperbaiki, perlu ditinjau ulang.</>;
    case 'deadline_soon':
      return <>Tenggat <span className="font-bold">{formatTahap(n.tahap)}</span> tinggal {n.daysLeft} hari — {n.pendingCount} dokumen wajib belum disetujui.</>;
    case 'deadline_overdue':
      return <>Tenggat <span className="font-bold">{formatTahap(n.tahap)}</span> terlewat {Math.abs(n.daysLeft ?? 0)} hari — {n.pendingCount} dokumen wajib belum disetujui.</>;
    case 'document_keuangan_kosong':
      return <>Dokumen <span className="font-bold">{n.namaDokumen}</span> menunggu diisi tim keuangan.</>;
    case 'document_reminder':
      return <>Tim keuangan mengingatkan: link dokumen <span className="font-bold">{n.namaDokumen}</span> belum diisi.</>;
    case 'progress_stale':
      return <>Tidak ada pembaruan progress selama {n.daysLeft} hari.</>;
  }
};

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data, isLoading, error, refetch } = useQuery({
    // user.id WAJIB ada di kunci: tanpa itu, keluar lalu masuk sebagai orang
    // lain akan menampilkan cache notifikasi pengguna sebelumnya.
    queryKey: ['notifications', user?.id, user?.role],
    queryFn: () => apiClient.get<AppNotification[]>(
      `/notifikasi?userId=${encodeURIComponent(user!.id)}&role=${user!.role}`),
    enabled: !!user?.id,
    staleTime: 60_000,
    refetchInterval: 120_000, // dinaikkan dari 60s: querynya lebih berat sekarang
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const notifications = data ?? [];

  const terkelompok = useMemo(() => {
    return URUTAN_GRUP
      .map(grup => ({ grup, isi: notifications.filter(n => META[n.kind]?.grup === grup) }))
      .filter(g => g.isi.length > 0);
  }, [notifications]);

  const handleClick = (n: AppNotification) => {
    navigate(tujuanNotifikasi(n));
    setIsOpen(false);
  };

  const bukaLonceng = () => {
    if (!isOpen) refetch();
    setIsOpen(o => !o);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button variant="ghost" size="icon" className="relative rounded-full" onClick={bukaLonceng}>
        <Bell className="w-5 h-5" />
        {notifications.length > 0 && (
          <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-destructive text-destructive-foreground text-xs border-2 border-card">
            {notifications.length > 9 ? '9+' : notifications.length}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <Card className="absolute right-0 top-full mt-2 w-96 max-h-[80vh] overflow-hidden flex flex-col shadow-lg border z-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <Bell className="w-5 h-5 mr-2 text-primary" />
              Notifikasi
            </CardTitle>
          </CardHeader>

          <CardContent className="p-0 flex-grow overflow-y-auto">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                <p className="text-sm">Memuat notifikasi...</p>
              </div>
            ) : error ? (
              <div className="p-8 text-center text-red-500 dark:text-red-400">
                <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">Gagal memuat notifikasi.</p>
              </div>
            ) : notifications.length > 0 ? (
              <div>
                {terkelompok.map(({ grup, isi }) => (
                  <div key={grup}>
                    <p className="sticky top-0 bg-muted/70 backdrop-blur px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {grup}
                    </p>
                    {isi.map((n, i) => {
                      const meta = META[n.kind];
                      const Ikon = meta.icon;
                      return (
                        <div key={n.id}>
                          <div
                            className="p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                            onClick={() => handleClick(n)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-start space-x-3 flex-1 min-w-0">
                                <div className={`mt-1 flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${meta.chip}`}>
                                  <Ikon className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-foreground line-clamp-3">
                                    {judulNotifikasi(n)}
                                  </p>
                                  <p className="text-xs text-muted-foreground line-clamp-1">
                                    Kegiatan: {n.namaKegiatan}
                                  </p>
                                  {n.tahap && (
                                    <p className="text-xs text-muted-foreground mt-1 flex items-center">
                                      <MapPin className="w-3 h-3 mr-1.5" />
                                      Tahap: {formatTahap(n.tahap)}
                                    </p>
                                  )}
                                  {/* Alasan penolakan adalah inti notifikasinya —
                                      ditampilkan, bukan sekadar disebut ada. */}
                                  {n.kind === 'document_rejected' && n.note && (
                                    <p className="mt-2 rounded bg-red-50 dark:bg-red-950/40 px-2 py-1 text-xs italic text-red-700 dark:text-red-300">
                                      "{n.note}"
                                    </p>
                                  )}
                                </div>
                              </div>
                              <ExternalLink className="w-3 h-3 text-muted-foreground flex-shrink-0 ml-2 mt-1" />
                            </div>
                            <div className="flex items-center justify-between text-xs text-muted-foreground pl-11 mt-2">
                              <span>{n.actorName ? `oleh ${n.actorName}` : ''}</span>
                              {n.kind !== 'deadline_soon' && n.kind !== 'deadline_overdue' && (
                                <span className="flex items-center">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {getRelativeTime(n.occurredAt)}
                                </span>
                              )}
                            </div>
                          </div>
                          {i < isi.length - 1 && <Separator />}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500 dark:text-green-400" />
                <p className="text-sm">Tidak ada notifikasi baru.</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
