import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Leaf, Package, CircleDollarSign, Wind } from 'lucide-react';

const stats = [
  {
    title: 'Carbono Reducido',
    value: '1.2t CO2e',
    icon: <Leaf className="h-6 w-6 text-primary" />,
  },
  {
    title: 'Lotes Creados',
    value: '4',
    icon: <Package className="h-6 w-6 text-primary" />,
  },
  {
    title: 'Ingreso Total',
    value: '$60,000',
    icon: <CircleDollarSign className="h-6 w-6 text-primary" />,
  },
  {
    title: 'Emisión Reducida',
    value: '15%',
    icon: <Wind className="h-6 w-6 text-primary" />,
  },
];

export function DashboardStats() {
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
            <p className="text-xs text-muted-foreground">+20.1% desde el mes pasado</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
