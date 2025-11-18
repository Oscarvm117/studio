'use client';

import { createContext, useContext, ReactNode, useMemo } from 'react';
import type { Lot } from '@/lib/types';
import { useFirebase, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, collectionGroup, where, query, addDoc, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();

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
      // The real-time listener from useCollection will automatically update the UI.
    } catch (error: any) {
      console.error("Error creating lot in Firestore: ", error);
      // Re-throw the error so the calling component can handle it (e.g., show a toast)
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
  }, [allLotsData, userLotsData, user, isLoadingAllLots, isLoadingUserLots, addLot]);


  return <LotContext.Provider value={value}>{children}</LotContext.Provider>;
}

export function useLots() {
  const context = useContext(LotContext);
  if (context === undefined) {
    throw new Error('useLots must be used within a LotProvider');
  }
  return context;
}
