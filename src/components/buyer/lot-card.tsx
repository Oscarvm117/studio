import Image from 'next/image';
import type { Lot } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/contexts/cart-context';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { QRCodeCanvas } from 'qrcode.react';
import { QrCode } from 'lucide-react';

interface LotCardProps {
  lot: Lot;
}

export function BuyerLotCard({ lot }: LotCardProps) {
  const { toast } = useToast();
  const { addToCart } = useCart();

  const handleAddToCart = () => {
    addToCart(lot);
    toast({
      title: '¡Producto añadido!',
      description: `${lot.productType} ha sido añadido a tu carrito.`,
    });
  }

  const lotInfo = `
Producto: ${lot.productType}
Cantidad: ${lot.quantity} ${lot.unit}
Cosecha: ${new Date(lot.harvestDate).toLocaleDateString('es-CO')}
Ubicación: ${lot.location}
Agricultor: ${lot.farmerName}
  `.trim();

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
        <p><strong>Cosecha:</strong> {new Date(lot.harvestDate).toLocaleDateString('es-CO')}</p>
        <div className="flex flex-wrap gap-1 pt-2">
            {lot.certifications.map(cert => (
            <Badge key={cert} variant="outline" className="border-primary/50 text-primary">{cert}</Badge>
            ))}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between items-center gap-2">
        <Button className="flex-grow bg-accent text-accent-foreground hover:bg-accent/90" onClick={handleAddToCart}>
          <ShoppingCart className="mr-2 h-4 w-4" />
          Agregar al Carrito
        </Button>
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
