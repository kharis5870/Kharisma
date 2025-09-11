import "./global.css";
import { Toaster } from "@/components/ui/toaster";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <PPLProvider>
          <AdminProvider> {/* <-- Bungkus dengan AdminProvider */}
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

                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </AdminProvider>
        </PPLProvider>
      </AuthProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
