// client/components/Sidebar.tsx

import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Users, FileText, Settings, LogOut, PlusCircle, Menu, ArrowLeft, Star } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import ConfirmationModal from './ConfirmationModal';
import favicon from '/favicon.ico';
import { ThemeSwitcher } from './ThemeSwitcher';
import { cn } from '@/lib/utils';
import { useSidebarStore } from '@/stores/useSidebarStore';

const SidebarLink: React.FC<{isExpanded: boolean; href: string; icon: React.ElementType; label: string; active: boolean; theme: 'light' | 'dark'}> =
({ isExpanded, href, icon: Icon, label, active, theme }) => (
    <Link
        to={href}
        className={cn(
            "flex items-center p-3 my-1 rounded-lg transition-colors",
            theme === 'light' ? 'text-gray-700 hover:bg-blue-100 hover:text-blue-600' : 'text-gray-200 hover:bg-gray-700',
            active && (theme === 'light' ? 'bg-blue-600 text-white hover:bg-blue-600 hover:text-white' : 'bg-blue-600 text-white hover:bg-blue-600')
        )}
    >
        <Icon className="w-6 h-6 flex-shrink-0" />
        <span
            className={`
                ml-4 overflow-hidden whitespace-nowrap transition-all duration-300
                ${isExpanded ? 'w-full opacity-100' : 'w-0 opacity-0'}
            `}
        >
            {label}
        </span>
    </Link>
);

const SidebarDropdown: React.FC<{
    isExpanded: boolean;
    item: any; // Ganti 'any' dengan tipe yang lebih spesifik jika Anda punya
    location: any;
    theme: 'light' | 'dark';
}> = ({ isExpanded, item, location, theme }) => {
    // Cek apakah salah satu submenu aktif
    const isSubmenuActive = item.submenu.some((subItem: any) => location.pathname === subItem.href);
    
    // State untuk mengontrol buka/tutup dropdown
    const [isOpen, setIsOpen] = useState(isSubmenuActive);

    // Buka dropdown jika sidebar expand dan submenu aktif
    useEffect(() => {
        if (isExpanded && isSubmenuActive) {
            setIsOpen(true);
        }
    }, [isExpanded, isSubmenuActive]);

    return (
        <div>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "flex items-center p-3 my-1 rounded-lg transition-colors w-full text-left",
                    theme === 'light' ? 'text-gray-700 hover:bg-blue-100 hover:text-blue-600' : 'text-gray-200 hover:bg-gray-700',
                    isSubmenuActive && (theme === 'light' ? 'bg-blue-100 text-blue-600' : 'bg-gray-700')
                )}
            >
                <item.icon className="w-6 h-6 flex-shrink-0" />
                <span className={cn('ml-4 overflow-hidden whitespace-nowrap transition-all duration-300', isExpanded ? 'w-full opacity-100' : 'w-0 opacity-0')}>
                    {item.label}
                </span>
                {/* Ikon panah dropdown */}
                <ArrowLeft className={cn('ml-auto w-4 h-4 transition-transform duration-300', isExpanded ? 'opacity-100' : 'opacity-0', isOpen && '-rotate-90')} />
            </button>
            {/* Konten Dropdown */}
            <div className={cn("overflow-hidden transition-all duration-300", isOpen && isExpanded ? 'max-h-40' : 'max-h-0')}>
                <ul className="pl-6 border-l ml-6 my-1 border-gray-300 dark:border-gray-600">
                    {item.submenu.map((subItem: any) => (
                        <li key={subItem.href}>
                            <SidebarLink
                                isExpanded={isExpanded}
                                href={subItem.href}
                                icon={subItem.icon}
                                label={subItem.label}
                                active={location.pathname === subItem.href}
                                theme={theme}
                            />
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth(); // Pastikan 'user' diambil
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { isExpanded, toggleSidebar, theme, setTheme } = useSidebarStore();

  const handleLogout = () => {
    logout();
    navigate('/login', { state: { fromLogout: true } });
  };

  // 1. Definisikan SEMUA kemungkinan item menu di sini
  const allMenuItems = [
    { href: '/dashboard', label: 'Dashboard', icon: Home, submenu: [] },
    { 
        label: 'Daftar', 
        icon: Users, 
        submenu: [
            { href: '/daftar-ppl', label: 'Daftar PPL', icon: Users },
            { href: '/daftar-pml', label: 'Daftar PML', icon: Users },
        ] 
    },
    { href: '/manajemen-honor', label: 'Manajemen Honor', icon: FileText, submenu: [] },
    { href: '/penilaian-mitra', label: 'Penilaian Mitra', icon: Star, submenu: [] },
    { href: '/manajemen-admin', label: 'Manajemen Admin', icon: Settings, submenu: [] },
];

  // 2. Buat daftar menu yang SUDAH DIFILTER sebelum masuk ke JSX
  const filteredMenuItems = allMenuItems.filter(item => {
    // Aturan #1: Sembunyikan 'Manajemen Admin' jika peran bukan 'admin'
    if (item.href === '/manajemen-admin') {
      return user?.role === 'admin';
    }

    // Aturan lain bisa ditambahkan di sini di masa depan
    // ...

    // Jika tidak ada aturan khusus, tampilkan itemnya
    return true;
  });

  return (
    <>
      <aside
        className={cn(
            "flex flex-col h-screen fixed top-0 left-0 z-40 transition-all duration-300 ease-in-out shadow-lg",
            isExpanded ? 'w-64' : 'w-20',
            theme === 'light' ? 'bg-white text-gray-800' : 'bg-gray-800 text-white'
        )}
      >
        <div className={cn("p-4 h-[68px] flex items-center justify-between border-b", theme === 'light' ? 'border-gray-200' : 'border-gray-700')}>
          <div className={`flex items-center min-w-0 ${isExpanded ? '' : 'pointer-events-none'}`}>
            <img src={favicon} alt="Kharisma Logo" className={`w-8 h-8 transition-all duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0'}`} />
            <span className={cn('font-bold text-2xl whitespace-nowrap transition-all duration-300', isExpanded ? 'ml-2 opacity-100' : 'w-0 opacity-0', theme === 'light' ? 'text-gray-900' : 'text-white')}>
              Kharisma
            </span>
          </div>
          <button onClick={toggleSidebar} className={cn("p-2 rounded-lg flex-shrink-0", theme === 'light' ? 'text-gray-500 hover:bg-gray-100' : 'text-gray-400 hover:bg-gray-700')}>
            {isExpanded ? <ArrowLeft size={24} /> : <Menu size={24} />}
          </button>
        </div>

        <nav className="mt-4 flex-grow px-4">
          <ul>
            {filteredMenuItems.map((item) => (
              <li key={item.href}>
                {item.submenu && item.submenu.length > 0 ? (
                    <SidebarDropdown
                        isExpanded={isExpanded}
                        item={item}
                        location={location}
                        theme={theme}
                    />
                ) : (
                <SidebarLink
                  isExpanded={isExpanded}
                  href={item.href!}
                  icon={item.icon}
                  label={item.label}
                  active={location.pathname === item.href}
                  theme={theme}
                />
                )}
              </li>
            ))}
          </ul>
        </nav>

        <div className={cn("p-4 border-t flex-shrink-0", theme === 'light' ? 'border-gray-200' : 'border-gray-700')}>
         <Link to="/input-kegiatan" className={`flex items-center p-3 w-full rounded-lg mb-2 bg-green-600 hover:bg-green-700 text-white`}>
           <PlusCircle className="w-6 h-6 flex-shrink-0" />
           <span className={`ml-4 font-semibold overflow-hidden whitespace-nowrap transition-all duration-300 ${isExpanded ? 'w-full opacity-100' : 'w-0 opacity-0'}`}>
             Kegiatan Baru
           </span>
         </Link>
         <div className="pb-2">
           <ThemeSwitcher isExpanded={isExpanded} theme={theme} setTheme={setTheme} />
         </div>
         <button onClick={() => setShowLogoutConfirm(true)} className={cn("flex items-center w-full p-3 rounded-lg text-left", theme === 'light' ? 'text-gray-700 hover:bg-red-500 hover:text-white' : 'text-gray-200 hover:bg-red-500')}>
           <LogOut className="w-6 h-6 flex-shrink-0" />
           <span className={`ml-4 overflow-hidden whitespace-nowrap transition-all duration-300 ${isExpanded ? 'w-full opacity-100' : 'w-0 opacity-0'}`}>
             Logout
           </span>
         </button>
        </div>
      </aside>
      <ConfirmationModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
        title="Konfirmasi Logout"
        description="Apakah Anda yakin ingin keluar dari sistem?"
        confirmLabel="Logout"
        variant="danger"
      />
    </>
  );
};

export default Sidebar;