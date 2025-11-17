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
  const [isAuthLoading, setAuthLoading] = useState(true);
  const { auth, firestore, isUserLoading: isFirebaseUserLoading, user: firebaseUser } = useFirebase();
  const router = useRouter();

  useEffect(() => {
    // This effect is the single source of truth for the user's auth state.
    // It runs when the firebaseUser object from onAuthStateChanged changes.

    const resolveUser = async () => {
      if (isFirebaseUserLoading) {
        // If the initial Firebase auth check is still running, we are loading.
        setAuthLoading(true);
        return;
      }
      
      if (!firebaseUser) {
        // If Firebase auth resolves and there's no user, we are done loading.
        setUser(null);
        setAuthLoading(false);
        return;
      }

      // If a firebaseUser exists, but we already have our app user, do nothing.
      if (user?.id === firebaseUser.uid) {
         setAuthLoading(false);
         return;
      }

      // If there IS a firebaseUser, we need to fetch their profile from Firestore.
      // We are still in a loading state until this is complete.
      setAuthLoading(true); 
      const userRef = doc(firestore, 'users', firebaseUser.uid);
      try {
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setUser(userSnap.data() as User);
        } else {
          // This can happen if a user is deleted from Firestore but not Auth.
          // Sign them out to be safe.
          await auth.signOut();
          setUser(null);
        }
      } catch (error) {
        console.error("Error fetching user document:", error);
        await auth.signOut();
        setUser(null);
      } finally {
        // We are done loading, regardless of the outcome.
        setAuthLoading(false);
      }
    };

    resolveUser();
  }, [firebaseUser, isFirebaseUserLoading, firestore, auth]);

  const login = async (email: string, password: string) => {
    // Let the form handle the try/catch. This function will throw on failure.
    await signInWithEmailAndPassword(auth, email, password);
    // The useEffect above will trigger and handle the rest.
  };

  const logout = async () => {
    await auth.signOut();
    // The useEffect will handle setting user to null.
    router.push('/login');
  };

  const register = async (name: string, email: string, password: string, role: Role) => {
    // Throws on failure (e.g., email-in-use), which the form will catch.
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const newUser = userCredential.user;
    
    const userForDb: User = {
      id: newUser.uid,
      name,
      email: newUser.email!,
      role,
    };

    const userDocRef = doc(firestore, 'users', newUser.uid);
    // Wait for the document to be created.
    await setDoc(userDocRef, userForDb);

    // Manually set the user in state to trigger immediate redirection.
    // The useEffect will also run but this makes the UI feel faster.
    setUser(userForDb);
    setAuthLoading(false);
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
