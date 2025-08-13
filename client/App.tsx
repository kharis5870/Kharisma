import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import InputKegiatan from "./pages/InputKegiatan";
import Dashboard from "./pages/Dashboard";
import ManajemenHonor from "./pages/ManajemenHonor";
import EditActivity from "./pages/EditActivity";
import UploadDocuments from "./pages/UploadDocuments";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Redirect root to login */}
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* Public route */}
            <Route path="/login" element={<Login />} />

            {/* Protected routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/input-kegiatan" element={
              <ProtectedRoute>
                <InputKegiatan />
              </ProtectedRoute>
            } />
            <Route path="/manajemen-honor" element={
              <ProtectedRoute>
                <ManajemenHonor />
              </ProtectedRoute>
            } />
            <Route path="/edit-activity/:id" element={
              <ProtectedRoute>
                <EditActivity />
              </ProtectedRoute>
            } />
            <Route path="/upload-documents/:id" element={
              <ProtectedRoute>
                <UploadDocuments />
              </ProtectedRoute>
            } />

            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
