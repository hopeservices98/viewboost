'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, AuthContextType, getCurrentUser, isAuthenticated, logout } from '@/lib/auth';

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
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only run on client side
    if (typeof window !== 'undefined') {
      const currentUser = getCurrentUser();
      setUser(currentUser);
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, []);

  const login = (tokens: { accessToken: string; refreshToken?: string }) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('authToken', tokens.accessToken);
      if (tokens.refreshToken) {
        localStorage.setItem('refreshToken', tokens.refreshToken);
      }
      // Petite pause pour s'assurer que le token est stocké
      setTimeout(() => {
        const currentUser = getCurrentUser();
        setUser(currentUser);
      }, 100);
    }
  };

  const handleLogout = () => {
    logout();
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    login,
    logout: handleLogout,
    isAuthenticated: typeof window !== 'undefined' ? isAuthenticated() : false,
    isCreator: user?.role === 'CREATOR' || user?.role === 'ADMIN',
    isAffiliate: user?.role === 'AFFILIATE' || user?.role === 'CREATOR' || user?.role === 'ADMIN',
    isAdmin: user?.role === 'ADMIN',
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};