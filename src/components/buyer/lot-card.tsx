import Image from 'next/image';
import type { Lot } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShoppingBasket } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface LotCardProps {
  lot: Lot;
}

export function BuyerLotCard({ lot }: LotCardProps) {
    const { toast } = useToast();

    const handleBuy = () => {
        toast({
            title: '¡Compra Exitosa!',
            description: `Has comprado el lote de ${lot.productType} de ${lot.farmerName}.`,
        });
    }

  return (
    <Card className="flex flex-col overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1">
      <div className="relative h-48 w-full">
        <Image
          src={lot.image.url}
          alt={lot.productType}
          fill
          style={{ objectFit: 'cover' }}
          className="transition-transform group-hover:scale-105"
          data-ai-hint={lot.image.hint}
        />
        <Badge className="absolute top-2 right-2 bg-primary/80 text-primary-foreground backdrop-blur-sm">
            {lot.location}
        </Badge>
      </div>
      <CardHeader>
        <div className='flex justify-between items-start'>
            <div>
                <CardTitle className="font-headline">{lot.productType}</CardTitle>
                <CardDescription>Vendido por: {lot.farmerName}</CardDescription>
            </div>
            <div className="text-lg font-bold text-primary">
                ${lot.pricePerKg.toLocaleString('es-CO')}
                <span className='text-sm font-normal text-muted-foreground'> / {lot.unit === 'docena' ? 'doc' : lot.unit}</span>
            </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow space-y-2 text-sm">
        <p><strong>Disponibles:</strong> {lot.quantity} {lot.unit}</p>
        <p><strong>Cosecha:</strong> {lot.harvestDate.toLocaleDateString('es-CO')}</p>
        <div className="flex flex-wrap gap-1 pt-2">
            {lot.certifications.map(cert => (
            <Badge key={cert} variant="outline" className="border-primary/50 text-primary">{cert}</Badge>
            ))}
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90" onClick={handleBuy}>
          <ShoppingBasket className="mr-2 h-4 w-4" />
          Comprar
        </Button>
      </CardFooter>
    </Card>
  );
}
