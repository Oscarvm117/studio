'use client';

import Image from 'next/image';
import { useCart } from '@/contexts/cart-context';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetDescription,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart as ShoppingCartIcon, Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

export function ShoppingCart() {
  const { cart, removeFromCart, cartTotal, checkout } = useCart();
  const { toast } = useToast();
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    
    setIsCheckingOut(true);
    try {
      await checkout();
      toast({
          title: '¡Pedido Realizado!',
          description: `Tu compra por un total de $${cartTotal.toLocaleString('es-CO')} ha sido exitosa.`,
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error al procesar la compra',
        description: error.message || 'No se pudo completar el pedido. Por favor, intenta de nuevo.',
      });
    } finally {
      setIsCheckingOut(false);
    }
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <ShoppingCartIcon className="h-5 w-5" />
          {cart.length > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 h-5 w-5 justify-center rounded-full p-1 text-xs"
            >
              {cart.length}
            </Badge>
          )}
          <span className="sr-only">Abrir carrito</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="flex w-full flex-col pr-0 sm:max-w-lg">
        <SheetHeader className="px-6">
          <SheetTitle>Carrito de Compras</SheetTitle>
          <SheetDescription>
            Revisa los lotes en tu carrito antes de finalizar la compra. Cada lote se compra completo.
          </SheetDescription>
        </SheetHeader>
        <Separator />
        {cart.length > 0 ? (
          <>
            <ScrollArea className="flex-1">
              <div className="flex flex-col gap-4 p-6">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-start gap-4">
                    <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md">
                      <Image
                        src={item.image.url}
                        alt={item.productType}
                        fill
                        style={{ objectFit: 'cover' }}
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold">{item.productType}</h4>
                      <p className="text-sm text-muted-foreground">
                        ${item.pricePerKg.toLocaleString('es-CO')} / {item.unit}
                      </p>
                      <div className="mt-2 flex items-center justify-between">
                        <p className="text-sm font-medium">{item.quantity} {item.unit}</p>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => removeFromCart(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Eliminar</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <SheetFooter className="bg-background/95 p-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="flex w-full flex-col gap-4">
                    <Separator />
                    <div className="flex justify-between text-lg font-semibold">
                        <span>Total:</span>
                        <span>${cartTotal.toLocaleString('es-CO')}</span>
                    </div>
                    <Button onClick={handleCheckout} className="w-full" disabled={isCheckingOut}>
                        {isCheckingOut && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Finalizar Compra
                    </Button>
                </div>
            </SheetFooter>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center">
              <ShoppingCartIcon className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">Tu carrito está vacío</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Agrega productos para empezar a comprar.
              </p>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
