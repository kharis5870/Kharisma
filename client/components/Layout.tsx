// client/components/Layout.tsx

import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';
import { useSidebarStore } from '@/stores/useSidebarStore';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { isExpanded } = useSidebarStore();

  return (
    <div className="bg-gray-100 min-h-screen flex flex-col">
      <Sidebar />

      <div
        className={`
          transition-all duration-300 ease-in-out flex-grow flex flex-col
          ${isExpanded ? 'ml-64' : 'ml-20'}
        `}
      >
        <Header />

        <main className="p-6 mt-[68px] flex-grow">
            {children}
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default Layout;