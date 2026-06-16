'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  shop_id: string;
  isActive?: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const persistSession = useCallback((token: string, sessionUser: User) => {
    localStorage.setItem('pos_token', token);
    localStorage.setItem('pos_user', JSON.stringify(sessionUser));
    setUser(sessionUser);
  }, []);

  const clearSession = useCallback(() => {
    localStorage.removeItem('pos_token');
    localStorage.removeItem('pos_user');
    setUser(null);
  }, []);

  useEffect(() => {
    const bootstrap = async () => {
      const token = localStorage.getItem('pos_token');
      const storedUser = localStorage.getItem('pos_user');

      if (!token) {
        if (storedUser) localStorage.removeItem('pos_user');
        setIsLoading(false);
        return;
      }

      try {
        const response = await authApi.me();
        if (response.success && response.data) {
          const u = response.data;
          const sessionUser: User = {
            id: u.id || u._id,
            email: u.email,
            name: u.name,
            role: u.role,
            shop_id: '1',
            isActive: u.isActive,
          };
          persistSession(token, sessionUser);
        } else {
          clearSession();
        }
      } catch {
        clearSession();
      } finally {
        setIsLoading(false);
      }
    };

    bootstrap();
  }, [clearSession, persistSession]);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await authApi.login(email, password);
      if (response.success && response.data?.token && response.data?.user) {
        const u = response.data.user;
        const sessionUser: User = {
          id: u.id || u._id,
          email: u.email,
          name: u.name,
          role: u.role,
          shop_id: u.shop_id || '1',
          isActive: u.isActive,
        };
        persistSession(response.data.token, sessionUser);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const logout = () => {
    clearSession();
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
