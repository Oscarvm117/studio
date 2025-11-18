'use client';

import { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import type { Lot } from '@/lib/types';
import { useFirebase } from '@/firebase';
import { collection, collectionGroup, where, query, addDoc, onSnapshot } from 'firebase/firestore';
import type { Query, DocumentData } from 'firebase/firestore';
import { useAuth } from './auth-context';

interface LotContextType {
  lots: Lot[];
  addLot: (lot: Omit<Lot, 'id' | 'farmerId' | 'farmerName' | 'status'>) => Promise<void>;
  userLots: Lot[];
  isLoading: boolean;
  error: Error | null;
}

const LotContext = createContext<LotContextType | undefined>(undefined);

export function LotProvider({ children }: { children: ReactNode }) {
  const { firestore } = useFirebase();
  const { user, isAuthLoading } = useAuth();
  
  const [allLots, setAllLots] = useState<Lot[]>([]);
  const [userLots, setUserLots] = useState<Lot[]>([]);
  const [isLoadingLots, setIsLoadingLots] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // This effect handles data fetching logic based on user role and auth state.
    // It will only run when the user or authentication loading state changes.

    if (isAuthLoading) {
      // If auth state is not resolved yet, do nothing and wait.
      setIsLoadingLots(true);
      return;
    }

    let unsubscribe: () => void = () => {};
    setIsLoadingLots(true);
    setError(null);

    try {
      if (user?.role === 'buyer') {
        // User is a buyer, fetch all available lots
        const lotsQuery: Query<DocumentData> = query(
          collectionGroup(firestore, 'lots'),
          where('status', '==', 'available')
        );
        unsubscribe = onSnapshot(lotsQuery, (snapshot) => {
          const fetchedLots: Lot[] = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            harvestDate: new Date(doc.data().harvestDate), // Convert string from DB to Date
          } as Lot));
          setAllLots(fetchedLots);
          setIsLoadingLots(false);
        }, (err) => {
          console.error('Error fetching lots for buyer:', err);
          setError(err as Error);
          setIsLoadingLots(false);
        });
      } else if (user?.role === 'farmer') {
        // User is a farmer, fetch their own lots
        const userLotsCollection = collection(firestore, 'users', user.id, 'lots');
        unsubscribe = onSnapshot(userLotsCollection, (snapshot) => {
          const fetchedLots: Lot[] = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
             harvestDate: new Date(doc.data().harvestDate), // Convert string from DB to Date
          } as Lot));
          setUserLots(fetchedLots);
          setIsLoadingLots(false);
        }, (err) => {
          console.error('Error fetching lots for farmer:', err);
          setError(err as Error);
          setIsLoadingLots(false);
        });
      } else {
        // No user or role not determined, clear data and stop loading
        setAllLots([]);
        setUserLots([]);
        setIsLoadingLots(false);
      }
    } catch (err) {
      console.error('Error setting up lots query:', err);
      setError(err as Error);
      setIsLoadingLots(false);
    }

    // Cleanup subscription on component unmount or when dependencies change
    return () => unsubscribe();
  }, [firestore, user, isAuthLoading]);


  const addLot = async (lotData: Omit<Lot, 'id' | 'farmerId' | 'farmerName' | 'status'>) => {
    if (!user) {
      throw new Error("Debes iniciar sesión para crear lotes.");
    }
    
    if (user.role !== 'farmer') {
      throw new Error("Solo los agricultores pueden crear lotes.");
    }

    const newLotData = {
      ...lotData,
      farmerId: user.id,
      farmerName: user.name,
      status: 'available' as 'available' | 'sold',
      harvestDate: lotData.harvestDate.toISOString(),
    };

    try {
      const lotsCollection = collection(firestore, 'users', user.id, 'lots');
      await addDoc(lotsCollection, newLotData);
    } catch (error: any) {
      console.error("Error creating lot in Firestore:", error);
      throw new Error(error.message || 'No se pudo crear el lote. Verifica tus permisos.');
    }
  };

  const value = {
    lots: user?.role === 'buyer' ? allLots : [],
    userLots: user?.role === 'farmer' ? userLots : [],
    addLot,
    isLoading: isLoadingLots,
    error,
  };

  return <LotContext.Provider value={value}>{children}</LotContext.Provider>;
}

export function useLots() {
  const context = useContext(LotContext);
  if (context === undefined) {
    throw new Error('useLots must be used within a LotProvider');
  }
  return context;
}
