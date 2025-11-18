'use client';

import { createContext, useContext, ReactNode, useMemo } from 'react';
import type { Lot } from '@/lib/types';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, collectionGroup, where, query, addDoc } from 'firebase/firestore';
import { useAuth } from './auth-context'; // Import useAuth

interface LotContextType {
  lots: Lot[];
  addLot: (lot: Omit<Lot, 'id' | 'farmerId' | 'farmerName' | 'status'>) => Promise<void>;
  userLots: Lot[];
  isLoading: boolean;
}

const LotContext = createContext<LotContextType | undefined>(undefined);

export function LotProvider({ children }: { children: ReactNode }) {
  const { firestore } = useFirebase();
  const { user } = useAuth(); // Use the user from AuthContext

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
    if (!user || user.role !== 'farmer') {
      throw new Error("Usuario no autorizado para crear lotes.");
    }

    const newLot: Omit<Lot, 'id'> = {
      ...lotData,
      farmerId: user.id,
      farmerName: user.name,
      status: 'available',
      harvestDate: lotData.harvestDate.toISOString(), // Ensure date is a string
    };

    try {
      const lotsCollection = collection(firestore, 'users', user.id, 'lots');
      await addDoc(lotsCollection, newLot);
    } catch (error: any) {
      console.error("Error creating lot in Firestore: ", error);
      throw new Error(error.message || 'No se pudo crear el lote. Verifica tus permisos.');
    }
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
