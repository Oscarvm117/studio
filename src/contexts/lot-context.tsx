'use client';

import { createContext, useContext, ReactNode, useEffect, useState, useMemo } from 'react';
import type { Lot, FarmerDashboard } from '@/lib/types';
import { useFirebase, useDoc, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { collection, collectionGroup, query, addDoc, onSnapshot, Timestamp, doc, updateDoc, increment, deleteDoc } from 'firebase/firestore';
import type { Query, DocumentData } from 'firebase/firestore';
import { useAuth } from './auth-context';

interface LotContextType {
  lots: Lot[];
  addLot: (lot: Omit<Lot, 'id' | 'farmerId' | 'farmerName' | 'status'>) => Promise<void>;
  deleteLot: (lotId: string) => Promise<void>;
  userLots: Lot[];
  dashboardData: FarmerDashboard | null;
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

  // Hook for farmer's dashboard data
  const dashboardDocRef = useMemoFirebase(
    () => (user?.role === 'farmer' ? doc(firestore, 'users', user.id, 'farmer_dashboard', 'stats') : null),
    [firestore, user]
  );
  const { data: dashboardData } = useDoc<FarmerDashboard>(dashboardDocRef);

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
        const lotsQuery: Query<DocumentData> = query(collectionGroup(firestore, 'lots'));
        unsubscribe = onSnapshot(lotsQuery, (snapshot) => {
          const fetchedLots: Lot[] = snapshot.docs
            .map((doc) => {
              const data = doc.data();
              return {
                id: doc.id,
                ...data,
                harvestDate: new Date(data.harvestDate),
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
             return {
                id: doc.id,
                ...data,
                harvestDate: new Date(data.harvestDate),
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
    if (!user || user.role !== 'farmer') {
      throw new Error("Solo los agricultores pueden crear lotes.");
    }
  
    const newLotData = {
      ...lotData,
      farmerId: user.id,
      farmerName: user.name,
      status: 'available' as 'available' | 'sold',
      harvestDate: lotData.harvestDate.toISOString(),
    };
  
    // 1. Create the new lot document
    const lotsCollection = collection(firestore, 'users', user.id, 'lots');
    const lotPromise = addDoc(lotsCollection, newLotData).catch(error => {
      const permissionError = new FirestorePermissionError({
        path: lotsCollection.path,
        operation: 'create',
        requestResourceData: newLotData,
      });
      errorEmitter.emit('permission-error', permissionError);
      throw error; // re-throw the original error
    });
  
    // 2. Update the farmer's dashboard statistics
    const dashboardRef = doc(firestore, 'users', user.id, 'farmer_dashboard', 'stats');
    const updatePayload = {
      lotsCreated: increment(1),
      carbonReduced: increment(5),
      emissionReduced: increment(2),
    };
    const dashboardPromise = updateDoc(dashboardRef, updatePayload).catch(error => {
      const permissionError = new FirestorePermissionError({
        path: dashboardRef.path,
        operation: 'update',
        requestResourceData: updatePayload,
      });
      errorEmitter.emit('permission-error', permissionError);
      throw error; // re-throw the original error
    });
  
    await Promise.all([lotPromise, dashboardPromise]);
  };
  
  const deleteLot = async (lotId: string) => {
    if (!user || user.role !== 'farmer') {
        throw new Error("Solo los agricultores pueden eliminar lotes.");
    }
    const lotRef = doc(firestore, 'users', user.id, 'lots', lotId);
    
    await deleteDoc(lotRef).catch(error => {
        const permissionError = new FirestorePermissionError({
            path: lotRef.path,
            operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
        throw error;
    });
  };

  const value = {
    lots: allLots,
    userLots: userLots,
    dashboardData: dashboardData ?? null,
    addLot,
    deleteLot,
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
