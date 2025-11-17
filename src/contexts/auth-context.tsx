'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
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

      // Avoid re-fetching if user data is already loaded and matches the firebase user
      if (user?.id === firebaseUser.uid) return;

      const userRef = doc(firestore, 'users', firebaseUser.uid);
      try {
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data() as User;
          setUser(userData);
        } else {
          // This case might happen if a user exists in Auth but not Firestore.
          // This can be a valid state right after registration before the doc is created.
          // Or it's an error state. For now, we'll log out to be safe.
          await auth.signOut();
          setUser(null);
        }
      } catch (error) {
        console.error("Error fetching user document:", error);
        await auth.signOut();
        setUser(null);
      }
    };

    if (!isUserLoading) {
      checkUser();
    }
  }, [firebaseUser, isUserLoading, firestore, auth, user]);

  const login = async (email: string, password: string) => {
    // This function will now throw an error on failure, which the form will catch.
    await signInWithEmailAndPassword(auth, email, password);
    // The useEffect will handle fetching user data and setting state.
  };

  const logout = async () => {
    await auth.signOut();
    setUser(null);
    router.push('/login');
  };

  const register = async (name: string, email: string, password: string, role: Role) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const newUser = userCredential.user;
    
    const userForDb: User = {
      id: newUser.uid,
      name: name,
      email: newUser.email!,
      role,
    };

    const userDocRef = doc(firestore, 'users', newUser.uid);
    // Wait for the document to be created before proceeding
    await setDoc(userDocRef, userForDb);
    // Manually set the user in the state to trigger immediate redirection
    setUser(userForDb);
  };

  const value = {
    user,
    isAuthenticated: !!user && !!firebaseUser, // Be stricter: require both app user and firebase user
    isAuthLoading: isUserLoading || (firebaseUser && !user), // Loading if firebase user exists but our app user doesn't yet
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
