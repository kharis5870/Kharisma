// client/components/Header.tsx

import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSidebarStore } from '@/stores/useSidebarStore'; 
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Clock, Search, Bell, Settings } from "lucide-react";
import NotificationDropdown from './NotificationDropdown';

const getTitleFromPath = (path: string): string => {
  switch (path) {
    case '/dashboard':
      return 'Dashboard';
    case '/daftar-ppl':
      return 'Daftar PPL';
    case '/daftar-pml':
      return 'Daftar PML';
    case '/manajemen-honor':
      return 'Manajemen Honor';
    case '/penilaian-mitra':
      return 'Penilaian Mitra';
    case '/manajemen-admin':
      return 'Manajemen Admin';
    case '/input-kegiatan':
      return 'Input Kegiatan Baru';
    default:
      if (path.startsWith('/input-kegiatan')) return 'Detail Kegiatan';
      return 'Kharisma';
  }
};

const Header: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const { isExpanded } = useSidebarStore();
  
  const [pageTitle, setPageTitle] = useState('Dashboard');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const newTitle = getTitleFromPath(location.pathname);
    setPageTitle(newTitle);
  }, [location]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fungsi untuk format waktu (e.g., 08:05 AM)
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  // Fungsi untuk format tanggal (e.g., Tuesday, September 2, 2025)
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <header
      className={`
        bg-white/80 backdrop-blur-xl fixed top-0 right-0 z-30 border-b
        transition-all duration-300 ease-in-out
        ${isExpanded ? 'left-64' : 'left-20'}
      `}
    >
      <div className="px-6 py-3 flex justify-between items-center h-[68px]">
        {/* Sisi Kiri Header */}
        <div>
          <h1 className="text-xl font-bold text-slate-900">{pageTitle}</h1>
          <p className="text-sm text-slate-500">
            Selamat datang kembali, {user?.username || 'Guest'}!
          </p>
        </div>
        
        {/* Sisi Kanan Header */}
        <div className="flex items-center space-x-4">
          {/* Tampilan Tanggal dan Waktu */}
          <div className="hidden lg:flex items-center space-x-2 text-sm text-slate-600">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(currentTime)}</span>
            <span className="text-slate-300">•</span>
            <Clock className="w-4 h-4" />
            <span className="font-mono">{formatTime(currentTime)}</span>
          </div>
          
          {/* Search Bar */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input 
              placeholder="Cari..." 
              className="pl-10 w-64 bg-slate-50 border-slate-200 focus:bg-white"
            />
          </div>
          
          {/* Tombol Notifikasi & Pengaturan */}
          <NotificationDropdown /> 
          
          <Button variant="ghost" size="icon" className="rounded-full">
            <Settings className="w-5 h-5" />
          </Button>
          
          {/* Avatar Pengguna */}
          <Avatar className="w-10 h-10">
            <AvatarImage src={user?.avatarUrl || ''} alt={user?.username} />
            <AvatarFallback className="bg-slate-200 text-slate-700 font-semibold">
              {user?.username ? user.username.charAt(0).toUpperCase() : 'G'}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
};

export default Header;