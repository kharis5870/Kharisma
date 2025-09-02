// client/components/NotificationDropdown.tsx

import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Bell,
  FileText,
  Clock,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Loader2
} from "lucide-react";
import { DocumentNotification } from "@shared/api";
import { apiClient } from "@/lib/apiClient";

// DIPERBAIKI: Fungsi ini sekarang dengan benar mengembalikan Promise<DocumentNotification[]>
const fetchNotifications = async (): Promise<DocumentNotification[]> => {
  // Axios response object memiliki properti 'data'. Kita langsung return isinya.
  const response = await apiClient.get<DocumentNotification[]>("/notifikasi");
  return response.data;
};

// ... (sisa kode komponen sama persis, tidak perlu diubah)
const getRelativeTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Baru saja";

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} menit yang lalu`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} jam yang lalu`;

  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} hari yang lalu`;
};


export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const { data: notifications, isLoading, error } = useQuery({
    queryKey: ['notifications'],
    queryFn: fetchNotifications,
    refetchInterval: 60000,
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

  const handleNotificationClick = (notification: DocumentNotification) => {
    navigate(`/input-kegiatan/${notification.kegiatanId}`);
    setIsOpen(false);
  };

  const pendingNotifications = notifications || [];
  const unreadCount = pendingNotifications.length;

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="icon"
        className="relative rounded-full"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-red-500 text-white text-xs border-2 border-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <Card className="absolute right-0 top-full mt-2 w-96 max-h-[80vh] overflow-hidden flex flex-col shadow-lg border z-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center">
                <Bell className="w-5 h-5 mr-2 text-blue-600" />
                Notifikasi
              </CardTitle>
            </div>
          </CardHeader>

          <CardContent className="p-0 flex-grow overflow-y-auto">
            {isLoading ? (
              <div className="p-8 text-center text-slate-500 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                <p className="text-sm">Memuat notifikasi...</p>
              </div>
            ) : error ? (
                <div className="p-8 text-center text-red-500">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-sm">Gagal memuat notifikasi.</p>
                </div>
            ) : pendingNotifications.length > 0 ? (
              <div>
                {pendingNotifications.map((notification, index) => (
                  <div key={notification.id}>
                    <div
                      className="p-4 hover:bg-slate-50 cursor-pointer transition-colors"
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3 flex-1 min-w-0">
                             <div className="mt-1 flex-shrink-0 h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center">
                                <FileText className="w-4 h-4 text-yellow-600" />
                             </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-slate-900 line-clamp-2">
                                Dokumen <span className="font-bold">{notification.namaDokumen}</span> perlu disetujui.
                              </p>
                              <p className="text-xs text-slate-600 line-clamp-1">
                                Kegiatan: {notification.namaKegiatan}
                              </p>
                            </div>
                          </div>
                          <ExternalLink className="w-3 h-3 text-slate-400 flex-shrink-0 ml-2 mt-1" />
                        </div>
                        <div className="flex items-center justify-between text-xs text-slate-500 pl-11">
                          <span className="flex items-center">
                            Diupload oleh {notification.uploadedBy}
                          </span>
                          <span className="flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {getRelativeTime(notification.uploadedAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                    {index < pendingNotifications.length - 1 && <Separator />}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                <p className="text-sm">Tidak ada notifikasi baru.</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}