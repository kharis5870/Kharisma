import "./global.css";
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
import InputKegiatan from "./pages/InputKegiatan";
import Dashboard from "./pages/Dashboard";
import ManajemenHonor from "./pages/ManajemenHonor";
import ManajemenAdmin from "./pages/ManajemenAdmin"; 
import DaftarPPL from "./pages/DaftarPPL"; 
import EditActivity from "./pages/EditActivity";
import ViewDocuments from "./pages/ViewDocuments";
import PenilaianMitraPage from './pages/PenilaianMitra';
import NotFound from "./pages/NotFound";
import DaftarPML from './pages/DaftarPML';
import RekapPenilaian from "./pages/RekapPenilaian";
import TemplateSurat from "./pages/TemplateSurat";
import GenerateKontrak from "./pages/GenerateKontrak";
import RiwayatSurat from "./pages/RiwayatSurat";
import EditProfil from "./pages/EditProfil";

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
            </BrowserRouter>
            </TooltipProvider>
          </AdminProvider>
        </PPLProvider>
      </AuthProvider>
  </QueryClientProvider>
  );
};

createRoot(document.getElementById("root")!).render(<App />);
