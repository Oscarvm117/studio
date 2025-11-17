'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { User, Role } from '@/lib/types';
import {
  useFirebase,
} from '@/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (name: string, email: string, password: string, role: Role) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const { auth, firestore, isUserLoading, user: firebaseUser } = useFirebase();
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      if (!firebaseUser) {
        setUser(null);
        return;
      }

      if (user?.id === firebaseUser.uid) return;

      const userRef = doc(firestore, 'users', firebaseUser.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data() as User;
        setUser(userData);
      } else {
        // This case might happen if a user exists in Auth but not Firestore.
        // We log them out to be safe.
        auth.signOut();
        setUser(null);
      }
    };

    if (!isUserLoading) {
      checkUser();
    }
  }, [firebaseUser, isUserLoading, firestore, auth, user]);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = () => {
    auth.signOut().then(() => {
      setUser(null);
      router.push('/login');
    });
  };

  const register = async (name: string, email: string, password: string, role: Role) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const newUser = userCredential.user;
    
    const userForDb: User = {
      id: newUser.uid,
      name,
      email: newUser.email!,
      role,
    };

    await setDoc(doc(firestore, 'users', newUser.uid), userForDb);
    setUser(userForDb);
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isAuthLoading: isUserLoading,
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
