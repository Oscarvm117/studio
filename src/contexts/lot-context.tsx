'use client';

import { createContext, useContext, ReactNode, useMemo, useEffect, useState, useCallback } from 'react';
import type { Lot } from '@/lib/types';
import { useFirebase } from '@/firebase';
import { collection, collectionGroup, query, addDoc, onSnapshot, where } from 'firebase/firestore';
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
  const { user, isAuthLoading } = useAuth(); // Use isAuthLoading
  
  const [allLots, setAllLots] = useState<Lot[]>([]);
  const [userLots, setUserLots] = useState<Lot[]>([]);
  const [isLoadingLots, setIsLoadingLots] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Effect for all lots (for buyers and general marketplace view)
  useEffect(() => {
    // Wait until auth state is fully resolved
    if (isAuthLoading) {
      setIsLoadingLots(true);
      return;
    }

    // This query is for all available lots, useful for buyers or a public marketplace.
    // Only run if there's no user or if the user is a buyer.
    if (user?.role !== 'buyer') {
      setAllLots([]);
      if (user?.role !== 'farmer') {
        setIsLoadingLots(false);
      }
      return;
    }

    setIsLoadingLots(true);
    setError(null);

    const lotsQuery: Query<DocumentData> = query(
      collectionGroup(firestore, 'lots'),
      where('status', '==', 'available')
    );

    const unsubscribe = onSnapshot(
      lotsQuery,
      (snapshot) => {
        const fetchedLots: Lot[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        } as Lot));
        setAllLots(fetchedLots);
        setIsLoadingLots(false);
      },
      (err) => {
        console.error('Error fetching lots for buyer:', err);
        setError(err as Error);
        setIsLoadingLots(false);
      }
    );

    return () => unsubscribe();
  }, [firestore, user, isAuthLoading]);


  // Effect for a farmer's own lots
  useEffect(() => {
    // Wait until auth state is fully resolved
    if (isAuthLoading) {
      setIsLoadingLots(true);
      return;
    }
    
    // Only run this for farmers
    if (user?.role !== 'farmer') {
      setUserLots([]);
      if (user?.role !== 'buyer') {
        setIsLoadingLots(false);
      }
      return;
    }

    setIsLoadingLots(true);
    setError(null);

    const userLotsCollection = collection(firestore, 'users', user.id, 'lots');

    const unsubscribe = onSnapshot(
      userLotsCollection,
      (snapshot) => {
        const fetchedLots: Lot[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        } as Lot));
        setUserLots(fetchedLots);
        setIsLoadingLots(false);
      },
      (err) => {
        console.error('Error fetching lots for farmer:', err);
        setError(err as Error);
        setIsLoadingLots(false);
      }
    );

    return () => unsubscribe();
  }, [firestore, user, isAuthLoading]);

  const addLot = useCallback(async (lotData: Omit<Lot, 'id' | 'farmerId' | 'farmerName' | 'status'>) => {
    if (!user) {
      throw new Error("Debes iniciar sesión para crear lotes.");
    }
    if (user.role !== 'farmer') {
      throw new Error("Solo los agricultores pueden crear lotes.");
    }
  
    const newLot: Omit<Lot, 'id'> = {
      ...lotData,
      farmerId: user.id,
      farmerName: user.name,
      status: 'available',
      harvestDate: typeof lotData.harvestDate === 'string' 
        ? lotData.harvestDate 
        : lotData.harvestDate.toISOString(),
    };
  
    const lotsCollection = collection(firestore, 'users', user.id, 'lots');
    await addDoc(lotsCollection, newLot);
  }, [user, firestore]);

  const value = {
    lots: user?.role === 'buyer' ? allLots : [],
    userLots: user?.role === 'farmer' ? userLots : [],
    addLot,
    isLoading: isLoadingLots,
    error
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
