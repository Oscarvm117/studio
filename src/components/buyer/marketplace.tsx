'use client';

import { useState, useMemo } from 'react';
import type { Lot } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { BuyerLotCard } from './lot-card';
import { Search } from 'lucide-react';
import { useLots } from '@/contexts/lot-context';

export function Marketplace() {
  const [searchTerm, setSearchTerm] = useState('');
  const { lots } = useLots();
  const availableLots = lots.filter(lot => lot.status === 'available');

  const filteredLots = useMemo(() => {
    if (!searchTerm) return availableLots;

    return availableLots.filter(lot => 
      lot.productType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lot.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lot.farmerName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, availableLots]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline tracking-tight">Mercado</h1>
        <p className="text-muted-foreground">Explora y compra productos frescos directamente de los agricultores.</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Buscar lotes por producto, ubicación o agricultor..."
          className="w-full pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {filteredLots.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredLots.map(lot => <BuyerLotCard key={lot.id} lot={lot} />)}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 py-24 text-center">
            <h3 className="text-xl font-semibold">No se encontraron lotes</h3>
            <p className="text-muted-foreground">Intenta ajustar tu búsqueda o revisa más tarde.</p>
        </div>
      )}
    </div>
  );
}
