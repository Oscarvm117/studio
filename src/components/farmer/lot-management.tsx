'use client';

import { useState } from 'react';
import Image from 'next/image';
import { initialLots } from '@/lib/data';
import type { Lot } from '@/lib/types';
import { useAuth } from '@/contexts/auth-context';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreateLotDialog } from './create-lot-dialog';
import { DashboardStats } from './dashboard-stats';

function LotCard({ lot }: { lot: Lot }) {
  return (
    <Card className="flex flex-col overflow-hidden transition-all hover:shadow-lg">
      <div className="relative h-40 w-full">
        <Image
          src={lot.image.url}
          alt={lot.productType}
          fill
          style={{ objectFit: 'cover' }}
          data-ai-hint={lot.image.hint}
        />
      </div>
      <CardHeader>
        <CardTitle>{lot.productType}</CardTitle>
        <CardDescription>{lot.location}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow space-y-2">
        <p><strong>Cantidad:</strong> {lot.quantity} {lot.unit}</p>
        <p><strong>Precio/kg:</strong> ${lot.pricePerKg.toLocaleString('es-CO')} COP</p>
        <p><strong>Cosecha:</strong> {lot.harvestDate.toLocaleDateString('es-CO')}</p>
      </CardContent>
      <CardFooter className="flex flex-wrap gap-1">
        {lot.certifications.map(cert => (
          <Badge key={cert} variant="secondary" className="bg-accent/20 text-accent-foreground">{cert}</Badge>
        ))}
      </CardFooter>
    </Card>
  );
}

export function LotManagement() {
  const [lots, setLots] = useState<Lot[]>(initialLots);
  const { user } = useAuth();
  
  if (!user) return null;

  const handleLotCreated = (newLot: Lot) => {
    setLots(prevLots => [newLot, ...prevLots]);
  };

  const userLots = lots.filter(lot => lot.farmerId === user.id);
  const availableLots = userLots.filter(lot => lot.status === 'available');
  const soldLots = userLots.filter(lot => lot.status === 'sold');

  return (
    <div className="space-y-8">
      <DashboardStats lots={userLots} />

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Mis Lotes</h2>
          <CreateLotDialog onLotCreated={handleLotCreated} farmerId={user.id} farmerName={user.name} />
        </div>
        <Tabs defaultValue="available">
          <TabsList>
            <TabsTrigger value="available">Lotes Disponibles</TabsTrigger>
            <TabsTrigger value="sold">Lotes Vendidos</TabsTrigger>
          </TabsList>
          <TabsContent value="available">
            {availableLots.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {availableLots.map(lot => <LotCard key={lot.id} lot={lot} />)}
              </div>
            ) : (
              <p className="mt-4 text-muted-foreground">No tienes lotes disponibles en este momento.</p>
            )}
          </TabsContent>
          <TabsContent value="sold">
            {soldLots.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {soldLots.map(lot => <LotCard key={lot.id} lot={lot} />)}
              </div>
            ) : (
              <p className="mt-4 text-muted-foreground">No has vendido ningún lote todavía.</p>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
