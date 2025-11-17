'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Lot } from '@/lib/types';
import { initialLots } from '@/lib/data';

interface LotContextType {
  lots: Lot[];
  addLot: (lot: Lot) => void;
  updateLot: (lotId: string, updatedLot: Partial<Lot>) => void;
}

const LotContext = createContext<LotContextType | undefined>(undefined);

// Helper function to stringify dates for storage
const serializeLots = (lots: Lot[]): string => {
  return JSON.stringify(lots.map(lot => ({
    ...lot,
    harvestDate: lot.harvestDate.toString(),
  })));
};

// Helper function to parse dates from storage
const deserializeLots = (storedLots: string): Lot[] => {
    try {
        const parsed = JSON.parse(storedLots);
        return parsed.map((lot: any) => ({
            ...lot,
            harvestDate: lot.harvestDate, // Keep as string for now
        }));
    } catch (e) {
        return [];
    }
};


export function LotProvider({ children }: { children: ReactNode }) {
  const [lots, setLots] = useState<Lot[]>([]);

  useEffect(() => {
    // On initial load, try to get lots from localStorage
    const storedLots = localStorage.getItem('biotrazo-lots');
    if (storedLots) {
      setLots(deserializeLots(storedLots));
    } else {
      // If nothing in storage, use initial data and set it
      setLots(initialLots);
      localStorage.setItem('biotrazo-lots', serializeLots(initialLots));
    }
  }, []);

  const updateLocalStorage = (updatedLots: Lot[]) => {
    localStorage.setItem('biotrazo-lots', serializeLots(updatedLots));
  };
  
  const addLot = (lot: Lot) => {
    setLots(prevLots => {
      // Convert harvestDate to string before adding
      const newLot = { ...lot, harvestDate: lot.harvestDate.toString() };
      const newLots = [newLot, ...prevLots];
      updateLocalStorage(newLots);
      return newLots;
    });
  };

  const updateLot = (lotId: string, updatedLotData: Partial<Lot>) => {
    setLots(prevLots => {
        const newLots = prevLots.map(lot => 
            lot.id === lotId ? { ...lot, ...updatedLotData } : lot
        );
        updateLocalStorage(newLots);
        return newLots;
    });
  };

  const value = { lots, addLot, updateLot };

  return <LotContext.Provider value={value}>{children}</LotContext.Provider>;
}

export function useLots() {
  const context = useContext(LotContext);
  if (context === undefined) {
    throw new Error('useLots must be used within a LotProvider');
  }
  return context;
}
