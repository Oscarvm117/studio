'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { User, Role } from '@/lib/types';
import { mockUsers } from '@/lib/data';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string) => void;
  logout: () => void;
  register: (name: string, email: string, role: Role) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Check for a logged-in user in localStorage on initial load
    const storedUser = localStorage.getItem('biotrazo-user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = (email: string) => {
    const foundUser = mockUsers.find((u) => u.email === email);
    if (foundUser) {
      setUser(foundUser);
      localStorage.setItem('biotrazo-user', JSON.stringify(foundUser));
      router.push(foundUser.role === 'farmer' ? '/farmer' : '/buyer');
    } else {
      // In a real app, you'd show an error.
      alert('Usuario no encontrado');
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('biotrazo-user');
    router.push('/login');
  };

  const register = (name: string, email: string, role: Role) => {
    const newUser: User = {
      id: `user-${Date.now()}`,
      name,
      email,
      role,
    };
    // In a real app, this would be an API call
    mockUsers.push(newUser);
    setUser(newUser);
    localStorage.setItem('biotrazo-user', JSON.stringify(newUser));
    router.push(newUser.role === 'farmer' ? '/farmer' : '/buyer');
  };

  const value = {
    user,
    isAuthenticated: !!user,
    login,
    logout,
    register,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
