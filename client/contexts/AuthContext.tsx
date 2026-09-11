// client/contexts/AuthContext.tsx

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserData } from '@shared/api';
import { useQueryClient } from '@tanstack/react-query';
import { simpanToken, hapusToken, ambilToken } from '@/lib/tokenSesi';

interface AuthContextType {
  isAuthenticated: boolean;
  user: UserData | null;
  login: (userData: UserData, token: string) => void;
  logout: () => void;
  checkAuth: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const queryClient = useQueryClient();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);

  // PERBAIKAN: Bungkus checkAuth dengan useCallback
  const checkAuth = useCallback((): boolean => {
    const authStatus = localStorage.getItem('isAuthenticated');
    const storedUser = localStorage.getItem('user');
    
    // Token wajib ikut ada: tanpa itu setiap permintaan akan dibalas 401,
    // dan aplikasi akan tampak masuk padahal tidak bisa melakukan apa pun.
    if (authStatus === 'true' && storedUser && ambilToken()) {
      setIsAuthenticated(true);
      setUser(JSON.parse(storedUser));
      return true;
    } else {
      setIsAuthenticated(false);
      setUser(null);
      return false;
    }
  }, []); // Dependency array kosong agar fungsi hanya dibuat sekali

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // PERBAIKAN: Bungkus login dengan useCallback
  const login = useCallback((userData: UserData, token: string) => {
    simpanToken(token);
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('user', JSON.stringify(userData));
    setIsAuthenticated(true);
    setUser(userData);
  }, []);

  // PERBAIKAN: Bungkus logout dengan useCallback
  const logout = useCallback(() => {
    hapusToken();
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
    // Buang seluruh cache React Query. Login memakai navigate() tanpa memuat
    // ulang halaman, jadi tanpa ini data sesi pengguna sebelumnya (daftar
    // kegiatan, dokumen, notifikasi) terbawa ke sesi pengguna berikutnya.
    queryClient.clear();
  }, [queryClient]);

  const value: AuthContextType = {
    isAuthenticated,
    user,
    login,
    logout,
    checkAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};