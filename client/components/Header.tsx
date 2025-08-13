import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import ConfirmationModal from "./ConfirmationModal";
import { LogOut, User } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { username, logout } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const navigation = [
    { name: "Input Kegiatan", href: "/input-kegiatan" },
    { name: "Dashboard", href: "/dashboard" },
    { name: "Manajemen Honor", href: "/manajemen-honor" },
  ];

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleLogoutConfirm = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      {/* Top Header with Logo and Title */}
      <div className="bg-gradient-to-r from-bps-blue-600 to-bps-blue-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex-1"></div>

            {/* Center Logo */}
            <div className="text-center">
              <h1 className="text-3xl md:text-4xl font-bold text-white tracking-wide">
                KHARISMA
              </h1>
              <p className="text-bps-blue-100 text-sm md:text-base mt-1 font-medium">
                BPS Kabupaten Bengkulu Selatan
              </p>
            </div>

            {/* User Info & Logout */}
            <div className="flex-1 flex justify-end">
              <div className="flex items-center gap-4 text-white">
                <div className="hidden sm:flex items-center gap-2 text-sm">
                  <User className="w-4 h-4" />
                  <span>Selamat datang, <strong>{username}</strong></span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogoutClick}
                  className="bg-transparent border-white text-white hover:bg-white hover:text-bps-blue-600"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Keluar
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Bar */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex justify-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "py-4 px-6 text-sm font-medium border-b-2 transition-colors duration-200",
                  location.pathname === item.href
                    ? "border-bps-blue-600 text-bps-blue-600 bg-bps-blue-50"
                    : "border-transparent text-gray-600 hover:text-bps-blue-600 hover:border-bps-blue-300 hover:bg-bps-blue-50"
                )}
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      <ConfirmationModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogoutConfirm}
        title="Konfirmasi Logout"
        description={`Apakah Anda yakin ingin keluar dari sistem KHARISMA? Anda akan diarahkan kembali ke halaman login.`}
        confirmLabel="Ya, Keluar"
        cancelLabel="Batal"
        variant="warning"
        icon={<LogOut className="w-6 h-6" />}
      />
    </header>
  );
}
