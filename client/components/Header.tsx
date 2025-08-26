import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

// Menambahkan interface untuk props yang diterima dari Layout.tsx
interface HeaderProps {
  isSidebarExpanded: boolean;
}

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

const Header: React.FC<HeaderProps> = ({ isSidebarExpanded }) => { // Gunakan props di sini
  const { user } = useAuth();
  const location = useLocation();
  const [pageTitle, setPageTitle] = useState('Dashboard');

  useEffect(() => {
    const newTitle = getTitleFromPath(location.pathname);
    setPageTitle(newTitle);
  }, [location]);

  return (
    // Header sekarang 'sticky' dan memiliki 'z-index'
    <header 
      className={`
        bg-white shadow-md fixed top-0 right-0 z-30
        transition-all duration-300 ease-in-out
        ${isSidebarExpanded ? 'left-64' : 'left-20'}
      `}
    >
      <div className="px-6 py-3 flex justify-between items-center h-[68px]"> {/* Menambahkan tinggi agar konsisten */}
        {/* Judul Halaman Dinamis */}
        <h1 className="text-xl font-semibold text-gray-700">{pageTitle}</h1>
        
        {/* Profil Pengguna */}
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="text-gray-500" />
                </div>
                <div className="text-right hidden md:block">
                    <p className="font-semibold text-sm text-gray-700">{user?.username || 'Guest'}</p>
                    <p className="text-xs text-gray-500">{user?.role || 'User'}</p>
                </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;