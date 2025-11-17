'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import type { Lot } from '@/lib/types';
import { useFirebase, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, collectionGroup, addDoc, doc, updateDoc, where, query } from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';

interface LotContextType {
  lots: Lot[];
  addLot: (lot: Omit<Lot, 'id' | 'farmerId' | 'farmerName' | 'status'>) => Promise<void>;
  updateLot: (lotId: string, updatedLot: Partial<Lot>) => Promise<void>;
  userLots: Lot[];
  isLoading: boolean;
}

const LotContext = createContext<LotContextType | undefined>(undefined);

export function LotProvider({ children }: { children: ReactNode }) {
  const { firestore } = useFirebase();
  const { user } = useUser();

  // Query for all lots for buyers
  const allLotsQuery = useMemoFirebase(
    () => user?.role === 'buyer' ? query(collectionGroup(firestore, 'lots'), where('status', '==', 'available')) : null,
    [firestore, user]
  );
  const { data: allLots, isLoading: isLoadingAllLots } = useCollection<Lot>(allLotsQuery);

  // Query for user-specific lots for farmers
  const userLotsQuery = useMemoFirebase(
    () => user?.role === 'farmer' ? collection(firestore, 'users', user.id, 'lots') : null,
    [firestore, user]
  );
  const { data: userLots, isLoading: isLoadingUserLots } = useCollection<Lot>(userLotsQuery);

  const addLot = async (lotData: Omit<Lot, 'id' | 'farmerId' | 'farmerName' | 'status'>) => {
    if (!user || user.role !== 'farmer') return;

    const newLot: Omit<Lot, 'id'> = {
      ...lotData,
      farmerId: user.id,
      farmerName: user.name,
      status: 'available',
      harvestDate: lotData.harvestDate.toString(), // Ensure date is a string
    };

    const lotsCollection = collection(firestore, 'users', user.id, 'lots');
    addDocumentNonBlocking(lotsCollection, newLot);
  };

  const updateLot = async (lotId: string, updatedLotData: Partial<Lot>) => {
    if (!user) return; // In a real app, you'd check ownership more robustly with security rules

    // This is a simplified update. A real implementation needs to find the correct lot across all users if needed.
    // For now, we assume a farmer is updating their own lot.
    if(user.role === 'farmer') {
        const lotRef = doc(firestore, 'users', user.id, 'lots', lotId);
        await updateDoc(lotRef, updatedLotData);
    }
  };

  const lots = useMemo(() => {
    if (user?.role === 'buyer') return allLots || [];
    if (user?.role === 'farmer') return userLots || [];
    return [];
  }, [user, allLots, userLots]);

  const value = { 
    lots, 
    addLot, 
    updateLot, 
    userLots: userLots || [], 
    isLoading: user?.role === 'buyer' ? isLoadingAllLots : isLoadingUserLots 
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
