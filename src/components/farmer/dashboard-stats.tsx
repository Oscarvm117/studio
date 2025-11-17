'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Leaf, Package, CircleDollarSign, Wind } from 'lucide-react';
import type { Lot } from '@/lib/types';
import { useMemo } from 'react';

interface DashboardStatsProps {
  lots: Lot[];
}

export function DashboardStats({ lots }: DashboardStatsProps) {
  const stats = useMemo(() => {
    const createdLots = lots.length;
    const soldLots = lots.filter(lot => lot.status === 'sold');
    const totalIncome = soldLots.reduce((sum, lot) => sum + (lot.pricePerKg * lot.quantity), 0);

    return [
      {
        title: 'Carbono Reducido',
        value: '0t CO2e', // Placeholder
        icon: <Leaf className="h-6 w-6 text-primary" />,
        change: '+0% desde el mes pasado',
      },
      {
        title: 'Lotes Creados',
        value: createdLots.toString(),
        icon: <Package className="h-6 w-6 text-primary" />,
        change: 'Total de lotes creados',
      },
      {
        title: 'Ingreso Total',
        value: `$${totalIncome.toLocaleString('es-CO')}`,
        icon: <CircleDollarSign className="h-6 w-6 text-primary" />,
        change: `Basado en ${soldLots.length} lotes vendidos`,
      },
      {
        title: 'Emisión Reducida',
        value: '0%', // Placeholder
        icon: <Wind className="h-6 w-6 text-primary" />,
        change: '+0% desde el mes pasado',
      },
    ];
  }, [lots]);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            {stat.icon}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">{stat.change}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
