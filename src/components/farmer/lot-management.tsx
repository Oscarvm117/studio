'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { Lot } from '@/lib/types';
import { useAuth } from '@/contexts/auth-context';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreateLotDialog } from './create-lot-dialog';
import { DashboardStats } from './dashboard-stats';
import { useLots } from '@/contexts/lot-context';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { QRCodeCanvas } from 'qrcode.react';
import { QrCode } from 'lucide-react';

function LotCard({ lot }: { lot: Lot }) {
  const lotInfo = `
Producto: ${lot.productType}
Cantidad: ${lot.quantity} ${lot.unit}
Cosecha: ${new Date(lot.harvestDate).toLocaleDateString('es-CO')}
Ubicación: ${lot.location}
Agricultor: ${lot.farmerName}
  `.trim();

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
        <p><strong>Precio/{lot.unit === 'docena' ? 'doc' : lot.unit}:</strong> ${lot.pricePerKg.toLocaleString('es-CO')} COP</p>
        <p><strong>Cosecha:</strong> {new Date(lot.harvestDate).toLocaleDateString('es-CO')}</p>
      </CardContent>
      <CardFooter className="flex flex-wrap gap-1 justify-between items-center">
        <div className="flex flex-wrap gap-1">
          {lot.certifications.map(cert => (
            <Badge key={cert} variant="secondary" className="bg-accent/20 text-accent-foreground">{cert}</Badge>
          ))}
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="default" size="icon">
              <QrCode className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Información del Lote</DialogTitle>
              <DialogDescription>
                Este código QR contiene los detalles básicos del lote.
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center justify-center p-4">
              <QRCodeCanvas value={lotInfo} size={256} />
            </div>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
}

export function LotManagement() {
  const { user } = useAuth();
  const { userLots, isLoading } = useLots();
  
  if (!user) return null;
  
  const availableLots = userLots.filter(lot => lot.status === 'available');
  const soldLots = userLots.filter(lot => lot.status === 'sold');

  return (
    <div className="space-y-8">
      <DashboardStats lots={userLots} />

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Mis Lotes</h2>
          <CreateLotDialog />
        </div>
        <Tabs defaultValue="available">
          <TabsList>
            <TabsTrigger value="available">Lotes Disponibles ({availableLots.length})</TabsTrigger>
            <TabsTrigger value="sold">Lotes Vendidos ({soldLots.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="available">
            {isLoading ? (
              <div className="flex justify-center items-center py-24">
                 <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              </div>
            ) : availableLots.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {availableLots.map(lot => <LotCard key={lot.id} lot={lot} />)}
              </div>
            ) : (
              <p className="mt-4 text-muted-foreground">No tienes lotes disponibles en este momento.</p>
            )}
          </TabsContent>
          <TabsContent value="sold">
             {isLoading ? (
              <div className="flex justify-center items-center py-24">
                 <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              </div>
            ) : soldLots.length > 0 ? (
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
