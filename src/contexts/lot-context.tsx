'use client';

import { createContext, useContext, ReactNode, useEffect, useState, useCallback } from 'react';
import type { Lot } from '@/lib/types';
import { useFirebase } from '@/firebase';
import { collection, collectionGroup, query, addDoc, onSnapshot, Timestamp } from 'firebase/firestore';
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
    let unsubscribe: () => void = () => {};

    if (isAuthLoading) {
      setIsLoadingLots(true);
      return;
    }

    setIsLoadingLots(true);
    setError(null);

    try {
      if (user?.role === 'buyer') {
        const lotsQuery: Query<DocumentData> = query(
          collectionGroup(firestore, 'lots')
        );
        unsubscribe = onSnapshot(lotsQuery, (snapshot) => {
          const fetchedLots: Lot[] = snapshot.docs
            .map((doc) => {
              const data = doc.data();
              // data.harvestDate is a string, convert it to a Date object.
              const harvestDate = new Date(data.harvestDate);
              return {
                id: doc.id,
                ...data,
                harvestDate,
              } as Lot;
            })
            .filter(lot => lot.status === 'available');

          setAllLots(fetchedLots);
          setUserLots([]);
          setIsLoadingLots(false);
        }, (err) => {
          console.error('Error fetching lots for buyer:', err);
          setError(err as Error);
          setIsLoadingLots(false);
        });

      } else if (user?.role === 'farmer') {
        const userLotsCollection = collection(firestore, 'users', user.id, 'lots');
        unsubscribe = onSnapshot(userLotsCollection, (snapshot) => {
          const fetchedLots: Lot[] = snapshot.docs.map((doc) => {
             const data = doc.data();
             // data.harvestDate is a string, convert it to a Date object.
             const harvestDate = new Date(data.harvestDate);
             return {
                id: doc.id,
                ...data,
                harvestDate,
             } as Lot;
          });
          setUserLots(fetchedLots);
          setAllLots([]);
          setIsLoadingLots(false);
        }, (err) => {
          console.error('Error fetching lots for farmer:', err);
          setError(err as Error);
          setIsLoadingLots(false);
        });

      } else {
        setAllLots([]);
        setUserLots([]);
        setIsLoadingLots(false);
      }
    } catch (err) {
      console.error('Error setting up lots query:', err);
      setError(err as Error);
      setIsLoadingLots(false);
    }

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
      throw error;
    }
  };

  const value = {
    lots: allLots,
    userLots: userLots,
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
