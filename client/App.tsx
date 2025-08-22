import "./global.css";
import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { PPLProvider } from "./contexts/PPLContext"; // <-- Impor PPLProvider
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import InputKegiatan from "./pages/InputKegiatan";
import Dashboard from "./pages/Dashboard";
import ManajemenHonor from "./pages/ManajemenHonor";
import ManajemenPPL from "./pages/ManajemenPPL"; // <-- Impor halaman baru
import EditActivity from "./pages/EditActivity";
import ViewDocuments from "./pages/ViewDocuments";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <PPLProvider> {/* <-- Bungkus dengan PPLProvider */}
          <BrowserRouter>
            <Toaster />
            <Routes>
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/login" element={<Login />} />

              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/input-kegiatan" element={<ProtectedRoute><InputKegiatan /></ProtectedRoute>} />
              <Route path="/manajemen-honor" element={<ProtectedRoute><ManajemenHonor /></ProtectedRoute>} />
              <Route path="/manajemen-ppl" element={<ProtectedRoute><ManajemenPPL /></ProtectedRoute>} /> {/* <-- Tambah rute baru */}
              <Route path="/edit-activity/:id" element={<ProtectedRoute><EditActivity /></ProtectedRoute>} />
              <Route path="/view-documents/:id" element={<ProtectedRoute><ViewDocuments /></ProtectedRoute>} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </PPLProvider>
      </AuthProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
