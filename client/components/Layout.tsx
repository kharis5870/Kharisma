// src/components/Layout.tsx

import React, { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isSidebarExpanded, setSidebarExpanded] = useState(false);

  const toggleSidebar = () => {
    setSidebarExpanded(!isSidebarExpanded);
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      <Sidebar 
        isExpanded={isSidebarExpanded} 
        toggleSidebar={toggleSidebar} 
      />

      <div 
        className={`
          transition-all duration-300 ease-in-out
          ${isSidebarExpanded ? 'ml-64' : 'ml-20'} 
        `}
      >
        <Header isSidebarExpanded={isSidebarExpanded} />
        
        {/* PENAMBAHAN DI SINI: Menambahkan margin-top agar konten tidak tertutup Header */}
        <main className="p-6 mt-[68px]">
            {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;