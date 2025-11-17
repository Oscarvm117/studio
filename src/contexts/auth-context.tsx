'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { User, Role } from '@/lib/types';
import {
  useFirebase,
} from '@/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';

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
  const [isAuthLoading, setAuthLoading] = useState(true);
  const { auth, firestore } = useFirebase();
  const router = useRouter();

  const fetchUserDocument = useCallback(async (firebaseUser: FirebaseUser | null): Promise<User | null> => {
    if (!firebaseUser) return null;
    const userRef = doc(firestore, 'users', firebaseUser.uid);
    const userSnap = await getDoc(userRef);
    return userSnap.exists() ? (userSnap.data() as User) : null;
  }, [firestore]);


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in, fetch their profile document.
        try {
          const appUser = await fetchUserDocument(firebaseUser);
          if (appUser) {
            setUser(appUser);
          } else {
             // This could happen if the user exists in Auth but not Firestore.
             // For safety, sign them out.
            await auth.signOut();
            setUser(null);
          }
        } catch (error) {
            console.error("Error fetching user document:", error);
            await auth.signOut();
            setUser(null);
        }
      } else {
        // User is signed out.
        setUser(null);
      }
      // Finished loading auth state.
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, [auth, fetchUserDocument]);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
    // The onAuthStateChanged listener will handle fetching user data and state updates.
  };

  const logout = async () => {
    await auth.signOut();
    // The onAuthStateChanged listener handles setting user to null.
    router.push('/login');
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

    const userDocRef = doc(firestore, 'users', newUser.uid);
    // Wait for the document to be created before proceeding.
    await setDoc(userDocRef, userForDb);

    // Manually set the user in state to ensure the UI updates immediately,
    // which triggers the redirection logic in page.tsx.
    setUser(userForDb);
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isAuthLoading,
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
