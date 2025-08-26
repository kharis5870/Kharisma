// client/components/ProtectedRoute.tsx

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, checkAuth } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const authStatus = checkAuth();
    
    if (!authStatus) {
      navigate('/login', { replace: true });
    }
  // PERBAIKAN: Dependency array dikosongkan agar hanya berjalan sekali saat mount
  }, []); 

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-bps-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Memeriksa otentikasi...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}