'use client';

import { createContext, useContext, ReactNode, useCallback, useEffect, useState } from 'react';
import type { Lot } from '@/lib/types';
import { useFirebase } from '@/firebase';
import { collection, collectionGroup, query, addDoc, onSnapshot, where } from 'firebase/firestore';
import type { Query, DocumentData } from 'firebase/firestore';
import { useAuth } from './auth-context';

interface LotContextType {
  lots: Lot[]; // For buyers: all available lots
  userLots: Lot[]; // For farmers: their own lots
  addLot: (lot: Omit<Lot, 'id' | 'farmerId' | 'farmerName' | 'status'>) => Promise<void>;
  isLoading: boolean;
  error: Error | null;
}

const LotContext = createContext<LotContextType | undefined>(undefined);

export function LotProvider({ children }: { children: ReactNode }) {
  const { firestore } = useFirebase();
  const { user, isAuthLoading } = useAuth();

  const [allLots, setAllLots] = useState<Lot[]>([]);
  const [userLots, setUserLots] = useState<Lot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Don't run any queries until the auth state is fully resolved
    if (isAuthLoading) {
      setIsLoading(true);
      return;
    }

    setIsLoading(true);
    let unsubscribe: () => void = () => {};

    if (user?.role === 'buyer') {
      // Buyer: Fetch all available lots from the collection group
      const lotsQuery: Query<DocumentData> = query(
        collectionGroup(firestore, 'lots'),
        where('status', '==', 'available')
      );

      unsubscribe = onSnapshot(
        lotsQuery,
        (snapshot) => {
          const fetchedLots: Lot[] = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          } as Lot));
          setAllLots(fetchedLots);
          setUserLots([]); // Clear farmer-specific lots
          setIsLoading(false);
          setError(null);
        },
        (err) => {
          console.error('Error fetching lots for buyer:', err);
          setError(err as Error);
          setIsLoading(false);
        }
      );
    } else if (user?.role === 'farmer') {
      // Farmer: Fetch only their own lots
      const userLotsCollection = collection(firestore, 'users', user.id, 'lots');
      
      unsubscribe = onSnapshot(
        userLotsCollection,
        (snapshot) => {
          const fetchedLots: Lot[] = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          } as Lot));
          setUserLots(fetchedLots);
          setAllLots([]); // Clear marketplace lots
          setIsLoading(false);
          setError(null);
        },
        (err) => {
          console.error('Error fetching lots for farmer:', err);
          setError(err as Error);
          setIsLoading(false);
        }
      );
    } else {
      // No user or unknown role, not loading anything.
      setAllLots([]);
      setUserLots([]);
      setIsLoading(false);
    }

    // Cleanup the subscription when the component unmounts or dependencies change
    return () => unsubscribe();
  }, [firestore, user, isAuthLoading]);

  const addLot = useCallback(async (lotData: Omit<Lot, 'id' | 'farmerId' | 'farmerName' | 'status'>) => {
    if (!user || user.role !== 'farmer') {
      throw new Error("Usuario no autorizado para crear lotes.");
    }

    const newLot: Omit<Lot, 'id'> = {
      ...lotData,
      farmerId: user.id,
      farmerName: user.name,
      status: 'available',
      harvestDate: lotData.harvestDate.toISOString(),
    };
  
    const lotsCollection = collection(firestore, 'users', user.id, 'lots');
    await addDoc(lotsCollection, newLot);
  }, [user, firestore]);

  const value = {
    lots: allLots,
    userLots: userLots,
    addLot,
    isLoading,
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
