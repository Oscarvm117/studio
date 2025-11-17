'use client';

import { createContext, useContext, ReactNode, useMemo } from 'react';
import type { Lot } from '@/lib/types';
import { useFirebase, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, collectionGroup, where, query } from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';

interface LotContextType {
  lots: Lot[];
  addLot: (lot: Omit<Lot, 'id' | 'farmerId' | 'farmerName' | 'status'>) => Promise<void>;
  userLots: Lot[];
  isLoading: boolean;
}

const LotContext = createContext<LotContextType | undefined>(undefined);

export function LotProvider({ children }: { children: ReactNode }) {
  const { firestore } = useFirebase();
  const { user } = useUser();

  // Query for all available lots for buyers using a collection group query
  const allLotsQuery = useMemoFirebase(
    () => user?.role === 'buyer' ? query(collectionGroup(firestore, 'lots'), where('status', '==', 'available')) : null,
    [firestore, user]
  );
  const { data: allLotsData, isLoading: isLoadingAllLots } = useCollection<Lot>(allLotsQuery);

  // Query for user-specific lots for farmers
  const userLotsQuery = useMemoFirebase(
    () => user?.role === 'farmer' ? collection(firestore, 'users', user.id, 'lots') : null,
    [firestore, user]
  );
  const { data: userLotsData, isLoading: isLoadingUserLots } = useCollection<Lot>(userLotsQuery);

  const addLot = async (lotData: Omit<Lot, 'id' | 'farmerId' | 'farmerName' | 'status'>) => {
    if (!user || user.role !== 'farmer') return;

    const newLot: Omit<Lot, 'id'> = {
      ...lotData,
      farmerId: user.id,
      farmerName: user.name,
      status: 'available',
      harvestDate: lotData.harvestDate.toISOString(), // Ensure date is a string
    };

    const lotsCollection = collection(firestore, 'users', user.id, 'lots');
    addDocumentNonBlocking(lotsCollection, newLot);
  };

  const value = useMemo(() => {
    const lotsForBuyer = allLotsData || [];
    const lotsForFarmer = userLotsData || [];
    
    return {
      lots: user?.role === 'buyer' ? lotsForBuyer : lotsForFarmer,
      addLot,
      userLots: lotsForFarmer,
      isLoading: user?.role === 'buyer' ? isLoadingAllLots : isLoadingUserLots,
    };
  }, [allLotsData, userLotsData, user, isLoadingAllLots, isLoadingUserLots]);


  return <LotContext.Provider value={value}>{children}</LotContext.Provider>;
}

export function useLots() {
  const context = useContext(LotContext);
  if (context === undefined) {
    throw new Error('useLots must be used within a LotProvider');
  }
  return context;
}
