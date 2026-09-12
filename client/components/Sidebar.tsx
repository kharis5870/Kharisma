// client/components/Sidebar.tsx

import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Users, FileText, Settings, LogOut, PlusCircle, Menu, ArrowLeft, Star, FileSignature, History } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import ConfirmationModal from './ConfirmationModal';
import favicon from '/favicon.ico';
import { ThemeSwitcher } from './ThemeSwitcher';
import { cn } from '@/lib/utils';
import { useSidebarStore } from '@/stores/useSidebarStore';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

/**
 * Menampilkan nama menu lengkap saat kursor menyentuhnya.
 *
 * Aturannya: tooltip muncul ketika sidebar DIMINIMALKAN — di situ yang terlihat
 * hanya ikon — dan ketika labelnya TERPOTONG meski sidebar terbuka. Di luar dua
 * keadaan itu tooltip tidak ditampilkan, karena labelnya memang sudah terbaca
 * utuh dan tooltip hanya menjadi gangguan.
 *
 * Keadaan kedua itu nyata: "Riwayat Penyuratan" tidak muat di dalam submenu,
 * yang digambar menjorok ke dalam sehingga ruangnya lebih sempit daripada menu
 * tingkat atas.
 */
const BungkusTooltip: React.FC<{ tampil: boolean; label: string; children: React.ReactNode }> =
({ tampil, label, children }) => {
    if (!tampil) return <>{children}</>;
    return (
        <Tooltip>
            <TooltipTrigger asChild>{children}</TooltipTrigger>
            <TooltipContent side="right" sideOffset={8}>{label}</TooltipContent>
        </Tooltip>
    );
};

const SidebarLink: React.FC<{isExpanded: boolean; href: string; icon: React.ElementType; label: string; active: boolean}> =
({ isExpanded, href, icon: Icon, label, active }) => {
    const labelRef = useRef<HTMLSpanElement>(null);
    const [terpotong, setTerpotong] = useState(false);

    /**
     * Apakah teks labelnya meluap dari kotaknya — DIUKUR, bukan ditebak dari
     * panjang karakter: lebar tiap huruf berbeda, dan submenu punya ruang yang
     * lebih sempit daripada menu tingkat atas.
     *
     * Diukur ulang saat TRANSISI SELESAI, bukan hanya sekali saat render.
     * Lebar label dianimasikan selama 300ms; mengukurnya tepat setelah sidebar
     * dibuka akan membaca lebar setengah jalan dan mengunci vonis "terpotong"
     * yang keliru, dan tidak ada render berikutnya yang akan membetulkannya.
     */
    useEffect(() => {
        const el = labelRef.current;
        if (!el) return;
        // Toleransi 1px: pembulatan sub-piksel bisa membuat teks yang pas
        // terbaca seolah meluap.
        const ukur = () => setTerpotong(el.scrollWidth > el.clientWidth + 1);
        ukur();
        window.addEventListener('resize', ukur);
        el.addEventListener('transitionend', ukur);
        return () => {
            window.removeEventListener('resize', ukur);
            el.removeEventListener('transitionend', ukur);
        };
    }, [label, isExpanded]);

    return (
        <BungkusTooltip tampil={!isExpanded || terpotong} label={label}>
            <Link
                to={href}
                className={cn(
                    "flex items-center p-3 my-1 rounded-lg transition-colors",
                    'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                    active && 'bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground'
                )}
            >
                <Icon className="w-6 h-6 flex-shrink-0" />
                <span
                    ref={labelRef}
                    className={`
                        ml-4 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap transition-all duration-300
                        ${isExpanded ? 'w-full opacity-100' : 'w-0 opacity-0'}
                    `}
                >
                    {label}
                </span>
            </Link>
        </BungkusTooltip>
    );
};

const SidebarDropdown: React.FC<{
    isExpanded: boolean;
    item: any; 
    location: any;
}> = ({ isExpanded, item, location }) => {
    const isSubmenuActive = item.submenu.some((subItem: any) => location.pathname === subItem.href);

    // State untuk mengontrol buka/tutup dropdown (dipakai saat sidebar terbuka)
    const [isOpen, setIsOpen] = useState(isSubmenuActive);
    // State terpisah untuk flyout saat sidebar tertutup
    const [flyoutOpen, setFlyoutOpen] = useState(false);

    // Buka dropdown jika sidebar expand dan submenu aktif
    useEffect(() => {
        if (isExpanded && isSubmenuActive) {
            setIsOpen(true);
        }
    }, [isExpanded, isSubmenuActive]);

    // Tutup flyout begitu sidebar dibuka, supaya tidak ada dua panel sekaligus.
    useEffect(() => {
        if (isExpanded) setFlyoutOpen(false);
    }, [isExpanded]);

    const kelasTombol = cn(
        "flex items-center p-3 my-1 rounded-lg transition-colors w-full text-left",
        'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
        isSubmenuActive && 'bg-sidebar-accent text-sidebar-accent-foreground'
    );

    const isiTombol = (
        <>
            <item.icon className="w-6 h-6 flex-shrink-0" />
            <span className={cn('ml-4 overflow-hidden whitespace-nowrap transition-all duration-300', isExpanded ? 'w-full opacity-100' : 'w-0 opacity-0')}>
                {item.label}
            </span>
            <ArrowLeft className={cn('ml-auto w-4 h-4 transition-transform duration-300', isExpanded ? 'opacity-100' : 'opacity-0', isOpen && '-rotate-90')} />
        </>
    );

    // SIDEBAR TERTUTUP: submenu tampil sebagai flyout di samping ikon.
    //
    // Sebelumnya panelnya digerbangi `isOpen && isExpanded`, sehingga saat
    // tertutup tingginya selalu dipaksa 0 — tombolnya bisa diklik tapi tidak
    // pernah memunculkan apa pun, membuat /daftar-ppl, /daftar-pml,
    // /generate-kontrak dan /template-surat sama sekali tidak bisa dicapai.
    if (!isExpanded) {
        return (
            <Popover open={flyoutOpen} onOpenChange={setFlyoutOpen}>
                {/* Menu beranak ("Daftar", "Keuangan") juga perlu tooltip saat
                    sidebar diminimalkan: yang terlihat hanya ikonnya, dan
                    sebelumnya namanya hanya ada di aria-label — terbaca pembaca
                    layar, tapi tidak oleh orang yang melihat ikonnya.
                    Cabang ini hanya dirender saat sidebar tertutup, jadi
                    tooltipnya memang selalu tampil di sini. */}
                <BungkusTooltip tampil label={item.label}>
                    <PopoverTrigger asChild>
                        <button className={kelasTombol} aria-label={item.label}>{isiTombol}</button>
                    </PopoverTrigger>
                </BungkusTooltip>
                <PopoverContent side="right" align="start" sideOffset={12} className="w-56 p-2">
                    <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {item.label}
                    </p>
                    <ul onClick={() => setFlyoutOpen(false)}>
                        {item.submenu.map((subItem: any) => (
                            <li key={subItem.href}>
                                <Link
                                    to={subItem.href}
                                    className={cn(
                                        "flex items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors",
                                        location.pathname === subItem.href
                                            ? 'bg-primary text-primary-foreground'
                                            : 'hover:bg-accent hover:text-accent-foreground'
                                    )}
                                >
                                    <subItem.icon className="w-4 h-4 flex-shrink-0" />
                                    {subItem.label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </PopoverContent>
            </Popover>
        );
    }

    // SIDEBAR TERBUKA: accordion seperti sebelumnya.
    return (
        <div>
            <button onClick={() => setIsOpen(!isOpen)} className={kelasTombol}>
                {isiTombol}
            </button>
            {/* grid-rows-[0fr/1fr] menggantikan max-h-40: tingginya mengikuti
                isi sebenarnya, jadi submenu dengan lebih dari 3 anak tidak
                terpotong diam-diam. */}
            <div className={cn("grid transition-all duration-300", isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}>
                <div className="overflow-hidden">
                    <ul className="pl-6 border-l ml-6 my-1 border-sidebar-border">
                        {item.submenu.map((subItem: any) => (
                            <li key={subItem.href}>
                                <SidebarLink
                                    isExpanded={isExpanded}
                                    href={subItem.href}
                                    icon={subItem.icon}
                                    label={subItem.label}
                                    active={location.pathname === subItem.href}
                                />
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth(); 
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { isExpanded, toggleSidebar } = useSidebarStore();

  const handleLogout = () => {
    logout();
    navigate('/login', { state: { fromLogout: true } });
  };

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
    {
        label: 'Keuangan',
        icon: FileSignature,
        submenu: [
            { href: '/generate-kontrak', label: 'Generate Surat', icon: FileSignature },
            { href: '/template-surat', label: 'Template Surat', icon: FileText },
            { href: '/riwayat-surat', label: 'Riwayat Penyuratan', icon: History },
        ]
    },
    { href: '/manajemen-admin', label: 'Manajemen Admin', icon: Settings, submenu: [] },
];

  const filteredMenuItems = allMenuItems.filter(item => {
    if (item.href === '/manajemen-admin') {
      return user?.role === 'admin';
    }

    // Menu keuangan (template surat & generate kontrak) untuk tim keuangan,
    // yang di aplikasi ini diwakili role supervisor, ditambah admin.
    if (item.label === 'Keuangan') {
      return user?.role === 'admin' || user?.role === 'supervisor';
    }

    // Jika tidak ada aturan khusus, tampilkan itemnya
    return true;
  });

  return (
    <>
      <aside
        className={cn(
            "flex flex-col h-screen fixed top-0 left-0 z-40 transition-all duration-300 ease-in-out shadow-lg",
            isExpanded ? 'w-64' : 'w-20',
            'bg-sidebar text-sidebar-foreground border-r border-sidebar-border'
        )}
      >
        <div className={"p-4 h-[68px] flex items-center justify-between border-b border-sidebar-border"}>
          <div className={`flex items-center min-w-0 ${isExpanded ? '' : 'pointer-events-none'}`}>
            <img src={favicon} alt="Kharisma Logo" className={`w-8 h-8 transition-all duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0'}`} />
            <span className={cn('font-bold text-2xl whitespace-nowrap transition-all duration-300', isExpanded ? 'ml-2 opacity-100' : 'w-0 opacity-0', 'text-sidebar-foreground')}>
              Kharisma
            </span>
          </div>
          <button onClick={toggleSidebar} className={"p-2 rounded-lg flex-shrink-0 text-sidebar-foreground/60 hover:bg-sidebar-accent"}>
            {isExpanded ? <ArrowLeft size={24} /> : <Menu size={24} />}
          </button>
        </div>

        <nav className="mt-4 flex-grow px-4">
          <ul>
            {/* Item dropdown tidak punya href, jadi label dipakai sebagai kunci
                cadangan — tanpa ini dua dropdown akan berbagi key undefined. */}
            {filteredMenuItems.map((item) => (
              <li key={item.href ?? item.label}>
                {item.submenu && item.submenu.length > 0 ? (
                    <SidebarDropdown
                        isExpanded={isExpanded}
                        item={item}
                        location={location}
                    />
                ) : (
                <SidebarLink
                  isExpanded={isExpanded}
                  href={item.href!}
                  icon={item.icon}
                  label={item.label}
                  active={location.pathname === item.href}
                />
                )}
              </li>
            ))}
          </ul>
        </nav>

        <div className={"p-4 border-t border-sidebar-border flex-shrink-0"}>
         <BungkusTooltip tampil={!isExpanded} label="Kegiatan Baru">
           <Link to="/input-kegiatan" className={`flex items-center p-3 w-full rounded-lg mb-2 bg-green-600 hover:bg-green-700 text-white`}>
             <PlusCircle className="w-6 h-6 flex-shrink-0" />
             <span className={`ml-4 font-semibold overflow-hidden whitespace-nowrap transition-all duration-300 ${isExpanded ? 'w-full opacity-100' : 'w-0 opacity-0'}`}>
               Kegiatan Baru
             </span>
           </Link>
         </BungkusTooltip>
         <div className="pb-2">
           <ThemeSwitcher isExpanded={isExpanded} />
         </div>
         <BungkusTooltip tampil={!isExpanded} label="Logout">
           <button onClick={() => setShowLogoutConfirm(true)} className={"flex items-center w-full p-3 rounded-lg text-left text-sidebar-foreground/80 hover:bg-destructive hover:text-destructive-foreground"}>
             <LogOut className="w-6 h-6 flex-shrink-0" />
             <span className={`ml-4 overflow-hidden whitespace-nowrap transition-all duration-300 ${isExpanded ? 'w-full opacity-100' : 'w-0 opacity-0'}`}>
               Logout
             </span>
           </button>
         </BungkusTooltip>
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