import "./global.css";
import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useApplyTheme } from "./hooks/useApplyTheme";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { PPLProvider } from "./contexts/PPLContext";
import { AdminProvider } from "./contexts/AdminContext"; // <-- Impor AdminProvider
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
// Halaman selain Login dimuat SAAT DIBUKA, bukan sekaligus di awal. Sebelumnya
// seluruh aplikasi ada di satu berkas JS 1,3 MB yang harus diunduh lewat VPN
// sebelum halaman login pun tampil. Login tetap dimuat langsung karena selalu
// menjadi halaman pertama.
/**
 * Seperti lazy(), tetapi pulih sendiri setelah aplikasi di-deploy ulang.
 *
 * Nama berkas halaman memuat hash. Tab yang dibuka sebelum deploy masih
 * menunjuk berkas lama yang sudah dihapus dari server, sehingga membuka halaman
 * berikutnya gagal dengan layar kosong. Halaman dimuat ulang SEKALI untuk
 * mengambil versi baru; penanda di sessionStorage mencegah muat ulang berulang
 * bila penyebabnya ternyata lain (mis. jaringan putus).
 */
const KUNCI_MUAT_ULANG = "kharisma-muat-ulang-halaman";
const halamanLazy = (muat: () => Promise<{ default: React.ComponentType }>) =>
  lazy(() => muat()
    .then(modul => { try { sessionStorage.removeItem(KUNCI_MUAT_ULANG); } catch { /* */ } return modul; })
    .catch(galat => {
      let sudahDicoba = false;
      try { sudahDicoba = sessionStorage.getItem(KUNCI_MUAT_ULANG) === "1"; sessionStorage.setItem(KUNCI_MUAT_ULANG, "1"); } catch { /* */ }
      if (!sudahDicoba) {
        window.location.reload();
        return new Promise<never>(() => { /* halaman sedang dimuat ulang */ });
      }
      throw galat;
    }));
const InputKegiatan = halamanLazy(() => import("./pages/InputKegiatan"));
const Dashboard = halamanLazy(() => import("./pages/Dashboard"));
const ManajemenHonor = halamanLazy(() => import("./pages/ManajemenHonor"));
const ManajemenAdmin = halamanLazy(() => import("./pages/ManajemenAdmin")); 
const DaftarPPL = halamanLazy(() => import("./pages/DaftarPPL")); 
const EditActivity = halamanLazy(() => import("./pages/EditActivity"));
const ViewDocuments = halamanLazy(() => import("./pages/ViewDocuments"));
const PenilaianMitraPage = halamanLazy(() => import("./pages/PenilaianMitra"));
const NotFound = halamanLazy(() => import("./pages/NotFound"));
const DaftarPML = halamanLazy(() => import("./pages/DaftarPML"));
const RekapPenilaian = halamanLazy(() => import("./pages/RekapPenilaian"));
const TemplateSurat = halamanLazy(() => import("./pages/TemplateSurat"));
const GenerateKontrak = halamanLazy(() => import("./pages/GenerateKontrak"));
const RiwayatSurat = halamanLazy(() => import("./pages/RiwayatSurat"));
const EditProfil = halamanLazy(() => import("./pages/EditProfil"));

/** Tampil sesaat selama berkas halaman yang baru dibuka diunduh. */
const MemuatHalaman = () => (
  <div className="min-h-screen flex items-center justify-center bg-muted">
    <div className="w-8 h-8 border-4 border-bps-blue-600 border-t-transparent rounded-full animate-spin" />
  </div>
);

const queryClient = new QueryClient();

/**
 * Data master yang jarang berubah.
 *
 * Bawaan React Query adalah `staleTime: 0` + `refetchOnWindowFocus`, sehingga
 * daftar-daftar ini diambil ulang setiap kali komponennya dipasang dan setiap
 * kali jendela peramban difokuskan lagi — padahal isinya berubah paling sering
 * seminggu sekali.
 *
 * Dipasang PER KUNCI, bukan sebagai `defaultOptions` global. Itu disengaja:
 * Dashboard, progres mitra, dan lonceng notifikasi justru MENGANDALKAN
 * pengambilan ulang saat fokus supaya angkanya selalu terbaru. Memberi mereka
 * `staleTime` berarti data basi tampil tanpa tanda apa pun — persis hal yang
 * paling ingin dihindari di layar pemantauan.
 *
 * Mutasi tetap memanggil `invalidateQueries` seperti biasa, jadi perubahan yang
 * dibuat dari dalam aplikasi tetap langsung terlihat; yang dihemat hanyalah
 * pengambilan ulang otomatis.
 */
const MENIT = 60_000;
for (const kunci of [['pplMaster'], ['pplAdmin'], ['ketuaTim'], ['users'], ['templateSurat']]) {
  queryClient.setQueryDefaults(kunci, { staleTime: 5 * MENIT });
}

const App = () => {
  // Menerapkan mode gelap/terang ke <html>. Harus di sini, bukan di Layout,
  // supaya halaman Login yang di luar Layout ikut terpengaruh.
  useApplyTheme();

  return (
  <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <PPLProvider>
          <AdminProvider>
            {/* delayDuration kecil supaya tooltip ikon sidebar muncul cepat
                saat sidebar tertutup — di situ ikon adalah satu-satunya
                petunjuk nama menu. */}
            <TooltipProvider delayDuration={200}>
            <BrowserRouter>
              <Toaster />
              <Suspense fallback={<MemuatHalaman />}>
              <Routes>
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="/login" element={<Login />} />

                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/input-kegiatan" element={<ProtectedRoute><InputKegiatan /></ProtectedRoute>} />
                <Route path="/manajemen-honor" element={<ProtectedRoute><ManajemenHonor /></ProtectedRoute>} />
                <Route path="/manajemen-admin" element={<ProtectedRoute><ManajemenAdmin /></ProtectedRoute>} />
                <Route path="/daftar-ppl" element={<ProtectedRoute><DaftarPPL /></ProtectedRoute>} />
                <Route path="/edit-activity/:id" element={<ProtectedRoute><EditActivity /></ProtectedRoute>} />
                <Route path="/view-documents/:id" element={<ProtectedRoute><ViewDocuments /></ProtectedRoute>} />
                <Route path="/penilaian-mitra" element={<ProtectedRoute><PenilaianMitraPage /></ProtectedRoute>} />
                <Route path="/rekap-penilaian" element={<ProtectedRoute><RekapPenilaian /></ProtectedRoute>} />
                <Route path="/daftar-pml" element={<ProtectedRoute><DaftarPML /></ProtectedRoute>} />
                <Route path="/template-surat" element={<ProtectedRoute><TemplateSurat /></ProtectedRoute>} />
                <Route path="/generate-kontrak" element={<ProtectedRoute><GenerateKontrak /></ProtectedRoute>} />
                <Route path="/riwayat-surat" element={<ProtectedRoute><RiwayatSurat /></ProtectedRoute>} />
                <Route path="/profil" element={<ProtectedRoute><EditProfil /></ProtectedRoute>} />

                <Route path="*" element={<NotFound />} />
              </Routes>
              </Suspense>
            </BrowserRouter>
            </TooltipProvider>
          </AdminProvider>
        </PPLProvider>
      </AuthProvider>
  </QueryClientProvider>
  );
};

createRoot(document.getElementById("root")!).render(<App />);
