// client/components/Header.tsx

import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSidebarStore } from '@/stores/useSidebarStore';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Calendar, Clock, Settings } from "lucide-react";
import NotificationDropdown from './NotificationDropdown';
import PencarianGlobal from './PencarianGlobal';
import { judulDariPath } from '@/lib/halaman';


const Header: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const { isExpanded } = useSidebarStore();
  
  const [pageTitle, setPageTitle] = useState('Dashboard');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const newTitle = judulDariPath(location.pathname);
    setPageTitle(newTitle);
  }, [location]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fungsi untuk format waktu (e.g., 08:05 AM)
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Fungsi untuk format tanggal (e.g., Tuesday, September 2, 2025)
  const formatDate = (date: Date) => {
    // Sebelumnya 'en-US' — "Tuesday, September 2, 2025" di samping tulisan
    // "Selamat datang kembali".
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <header
      className={`
        bg-background/80 backdrop-blur-xl fixed top-0 right-0 z-30 border-b
        transition-all duration-300 ease-in-out
        ${isExpanded ? 'left-64' : 'left-20'}
      `}
    >
      <div className="px-6 py-3 flex justify-between items-center h-[68px]">
        {/* Sisi Kiri Header */}
        <div>
          <h1 className="text-xl font-bold text-foreground">{pageTitle}</h1>
          <p className="text-sm text-muted-foreground">
            Selamat datang kembali, {user?.username || 'Guest'}!
          </p>
        </div>

        {/* Sisi Kanan Header */}
        <div className="flex items-center space-x-4">
          {/* Tampilan Tanggal dan Waktu */}
          <div className="hidden lg:flex items-center space-x-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(currentTime)}</span>
            <span className="text-border">•</span>
            <Clock className="w-4 h-4" />
            <span className="font-mono">{formatTime(currentTime)}</span>
          </div>

          {/* Kotak cari lama benar-benar mati (tanpa value/onChange/handler). */}
          <PencarianGlobal />

          {/* Tombol Notifikasi & Pengaturan */}
          <NotificationDropdown />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full" asChild>
                <Link to="/profil" aria-label="Pengaturan profil">
                  <Settings className="w-5 h-5" />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Pengaturan profil</TooltipContent>
          </Tooltip>

          {/* Avatar Pengguna. AvatarImage dihapus: tabel users tidak punya
              kolom foto, dan src='' tidak pernah membuahkan gambar — hanya
              menyisakan error TypeScript user.avatarUrl. */}
          <Avatar className="w-10 h-10">
            <AvatarFallback className="bg-muted text-muted-foreground font-semibold">
              {user?.username ? user.username.charAt(0).toUpperCase() : 'G'}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
};

export default Header;