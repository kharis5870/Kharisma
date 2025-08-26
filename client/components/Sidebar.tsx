// src/components/Sidebar.tsx

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Users, FileText, Settings, LogOut, PlusCircle, Menu, ArrowLeft } from 'lucide-react';

interface SidebarProps {
  isExpanded: boolean;
  toggleSidebar: () => void;
}

const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/daftar-ppl', label: 'Daftar PPL', icon: Users },
  { href: '/manajemen-honor', label: 'Manajemen Honor', icon: FileText },
  { href: '/manajemen-admin', label: 'Manajemen Admin', icon: Settings },
];

const SidebarLink: React.FC<{isExpanded: boolean; href: string; icon: React.ElementType; label: string; active: boolean;}> = 
({ isExpanded, href, icon: Icon, label, active }) => (
    <Link
        to={href}
        className={`flex items-center p-3 my-1 rounded-lg hover:bg-blue-500 ${active ? 'bg-blue-600' : ''}`}
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


const Sidebar: React.FC<SidebarProps> = ({ isExpanded, toggleSidebar }) => {
  const location = useLocation();

  return (
    <aside
      className={`bg-gray-800 text-white flex flex-col h-screen fixed top-0 left-0 z-40 transition-all duration-300 ease-in-out ${isExpanded ? 'w-64' : 'w-20'}`}
    >
      <div className="p-4 h-[68px] flex items-center justify-between border-b border-gray-700">
        {/* Kontainer untuk Judul agar bisa dianimasikan */}
        <div className={`
            flex items-center min-w-0
            ${isExpanded ? '' : 'pointer-events-none'}
        `}>
          <span className={`
              font-bold text-2xl whitespace-nowrap transition-all duration-300
              ${isExpanded ? 'ml-0 opacity-100' : 'w-0 opacity-0'}
          `}>
            Kharisma
          </span>
        </div>

        {/* Tombol Toggle */}
        <button onClick={toggleSidebar} className="p-2 rounded-lg text-gray-400 hover:bg-gray-700 flex-shrink-0">
          {isExpanded ? <ArrowLeft size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <nav className="mt-4 flex-grow px-4">
        <ul>
          {menuItems.map((item) => (
            <li key={item.href}>
              <SidebarLink 
                isExpanded={isExpanded}
                href={item.href}
                icon={item.icon}
                label={item.label}
                active={location.pathname === item.href}
              />
            </li>
          ))}
        </ul>
      </nav>

        {/* ... sisa kode tetap sama ... */}
        <div className="p-4 border-t border-gray-700 flex-shrink-0">
         <Link to="/input-kegiatan" className={`flex items-center p-3 w-full rounded-lg mb-2 bg-blue-500 hover:bg-blue-600 text-white`}>
             <PlusCircle className="w-6 h-6 flex-shrink-0" />
             <span className={`ml-4 font-semibold overflow-hidden whitespace-nowrap transition-all duration-300 ${isExpanded ? 'w-full opacity-100' : 'w-0 opacity-0'}`}>
                 Kegiatan Baru
             </span>
         </Link>
         <button className={`flex items-center w-full p-3 rounded-lg text-left hover:bg-red-500`}>
             <LogOut className="w-6 h-6 flex-shrink-0" />
             <span className={`ml-4 overflow-hidden whitespace-nowrap transition-all duration-300 ${isExpanded ? 'w-full opacity-100' : 'w-0 opacity-0'}`}>
                 Logout
             </span>
         </button>
       </div>
    </aside>
  );
};

export default Sidebar;