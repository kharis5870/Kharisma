// client/components/Header.tsx

import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSidebarStore } from '@/stores/useSidebarStore'; 

const getTitleFromPath = (path: string): string => {
  switch (path) {
    case '/dashboard':
      return 'Dashboard';
    case '/daftar-ppl':
      return 'Daftar PPL';
    case '/manajemen-honor':
      return 'Manajemen Honor';
    case '/manajemen-admin':
      return 'Manajemen Admin';
    case '/input-kegiatan':
      return 'Input Kegiatan Baru';
    default:
      if (path.startsWith('/input-kegiatan')) return 'Input Kegiatan';
      return 'Kharisma';
  }
};

const Header: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [pageTitle, setPageTitle] = useState('Dashboard');
  const { isExpanded } = useSidebarStore(); // Gunakan store

  useEffect(() => {
    const newTitle = getTitleFromPath(location.pathname);
    setPageTitle(newTitle);
  }, [location]);

  return (
    <header
      className={`
        bg-card shadow-sm fixed top-0 right-0 z-30 border-b
        transition-all duration-300 ease-in-out
        ${isExpanded ? 'left-64' : 'left-20'}
      `}
    >
      <div className="px-6 py-3 flex justify-between items-center h-[68px]">
        <h1 className="text-xl font-semibold text-foreground">{pageTitle}</h1>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <User className="text-muted-foreground" />
                </div>
                <div className="text-right hidden md:block">
                    <p className="font-semibold text-sm text-foreground">{user?.username || 'Guest'}</p>
                    <p className="text-xs text-muted-foreground">{user?.role || 'User'}</p>
                </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;