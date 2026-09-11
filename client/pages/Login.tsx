// client/pages/Login.tsx

import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, LogIn, Eye, EyeOff } from "lucide-react";
import SuccessModal from "@/components/SuccessModal";
import { apiClient } from "@/lib/apiClient";
import favicon from "/favicon.ico";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showLogoutSuccess, setShowLogoutSuccess] = useState(false);

  useEffect(() => {
    if (location.state?.fromLogout) {
      setShowLogoutSuccess(true);
      // Hapus state agar tidak muncul lagi saat refresh
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      type LoginResponse = { success: boolean, user: any, token?: string, message?: string };

      const data = await apiClient.post<LoginResponse>('/auth/login', { username, password });

      if (data.success) {
        // Tanpa token, seluruh permintaan berikutnya akan ditolak 401. Lebih
        // baik gagal di sini dengan pesan yang jelas daripada masuk ke aplikasi
        // yang tidak bisa melakukan apa pun.
        if (!data.token) {
          setError("Server tidak mengirim token sesi. Hubungi admin aplikasi.");
          return;
        }
        login(data.user, data.token);
        navigate("/dashboard");
      } else {
        setError(data.message || "Terjadi kesalahan. Silakan coba lagi.");
      }
    } catch (err: any) {
      setError(err.message || "Tidak dapat terhubung ke server. Periksa koneksi Anda.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-bps-blue-50 via-background to-bps-green-50 flex items-center justify-center p-4">
      <SuccessModal
        isOpen={showLogoutSuccess}
        onClose={() => setShowLogoutSuccess(false)}
        title="Logout Berhasil!"
        description="Anda telah berhasil keluar dari sistem."
        onAction={() => setShowLogoutSuccess(false)}
        autoCloseDelay={3000}
      />

      <div className="w-full max-w-md">
        {/*
          Kepala biru dan form disatukan dalam SATU Card.

          Sebelumnya kepalanya berada di div terpisah ber-`mb-8` dengan
          `rounded-t-2xl` — sudut membulat hanya di atas, yang memang
          dimaksudkan menempel ke kartu di bawahnya. Karena ada jarak 32px,
          sudut bawahnya yang siku menggantung di udara lalu disusul kartu
          membulat: itulah yang terlihat patah.

          `overflow-hidden` membuat kepala biru terpotong mengikuti lengkung
          kartu, sehingga keduanya jadi satu bentuk utuh.
        */}
        <Card className="overflow-hidden border-0 shadow-2xl">
          <div className="bg-gradient-to-br from-bps-blue-600 to-bps-blue-800 dark:from-bps-blue-800 dark:to-bps-blue-900 px-8 py-9 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25 backdrop-blur-sm">
              <img src={favicon} alt="Logo Kharisma" className="h-9 w-9" />
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-white">Kharisma.</h1>

            {/* Kepanjangan akronim: dibuat kecil dan renggang supaya terbaca
                sebagai keterangan, bukan bersaing dengan judul. */}
            <p className="mx-auto mt-2 max-w-xs text-[11px] leading-relaxed tracking-wide text-white/70">
              Knowledge Hub for Activity Reporting and Integrated Statistical Monitoring Application
            </p>

            {/* Pemisah tipis: memberi jeda visual tanpa menambah garis tegas. */}
            <div className="mx-auto my-4 h-px w-16 bg-white/25" />

            <p className="text-sm font-medium text-white/90">
              BPS Kabupaten Bengkulu Selatan
            </p>
          </div>

          <CardContent className="p-7 sm:p-8">
            <div className="mb-6 text-center">
              <h2 className="text-xl font-bold text-foreground">Masuk ke Sistem</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Silakan masuk dengan akun yang telah disediakan
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username"
                  required
                  autoComplete="username"
                  autoFocus
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan password"
                    required
                    autoComplete="current-password"
                    className="h-11 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950/40"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600 dark:text-red-300" />
                  <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="h-11 w-full bg-bps-blue-600 text-white shadow-sm transition-shadow hover:bg-bps-blue-700 hover:shadow-md disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    <span>Memproses...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <LogIn className="h-4 w-4" />
                    <span>Masuk</span>
                  </div>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-xs text-muted-foreground">
          <p>Sistem Manajemen Kegiatan BPS</p>
          <p className="mt-1">
            © 2025 BPS Kabupaten Bengkulu Selatan · dikembangkan oleh Kharis Batubara
          </p>
        </div>
      </div>
    </div>
  );
}
