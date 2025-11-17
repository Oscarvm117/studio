'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { units, certifications } from '@/lib/types';
import type { Lot } from '@/lib/types';
import { CertificationPicker } from './certification-picker';
import { useToast } from '@/hooks/use-toast';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const lotSchema = z.object({
  productType: z.string().min(1, 'El tipo de producto es requerido.'),
  quantity: z.coerce.number().min(1, 'La cantidad debe ser mayor a 0.'),
  unit: z.enum(units),
  harvestDate: z.date({ required_error: 'La fecha de cosecha es requerida.' }),
  location: z.string().min(1, 'La ubicación es requerida.'),
  pricePerKg: z.coerce.number().min(1, 'El precio debe ser mayor a 0.'),
  certifications: z.array(z.enum(certifications)).optional().default([]),
});

interface CreateLotDialogProps {
  onLotCreated: (newLot: Omit<Lot, 'id' | 'farmerId' | 'farmerName' | 'status'>) => void;
}

export function CreateLotDialog({ onLotCreated }: CreateLotDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const getLotImage = (productType: string) => {
    const hint = productType.toLowerCase();
    const found = PlaceHolderImages.find(img => hint.includes(img.id.toLowerCase()));
    if (found) {
        return { url: found.imageUrl, hint: found.imageHint };
    }
    // Default to a generic field image if no specific one is found
    const fieldImage = PlaceHolderImages.find(img => img.id === 'lettuce');
    return { 
        url: fieldImage?.imageUrl || PlaceHolderImages[0].imageUrl, 
        hint: fieldImage?.imageHint || 'field crop'
    };
  };

  const form = useForm<z.infer<typeof lotSchema>>({
    resolver: zodResolver(lotSchema),
    defaultValues: {
      productType: '',
      quantity: 0,
      unit: 'kg',
      location: '',
      pricePerKg: 0,
      certifications: [],
    },
  });

  async function onSubmit(values: z.infer<typeof lotSchema>) {
    const newLotData = {
      image: getLotImage(values.productType),
      ...values,
    };
    onLotCreated(newLotData);
    toast({
        title: '¡Lote Creado!',
        description: `El lote de ${values.productType} ha sido agregado al mercado.`,
    });
    setOpen(false);
    form.reset();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-accent text-accent-foreground hover:bg-accent/90">Crear Lote</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Lote</DialogTitle>
          <DialogDescription>
            Completa los detalles de tu producto para ponerlo a la venta en el mercado.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="productType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de producto</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Tomate Chonto" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cantidad de producto</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Ej: 100" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unidad</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una unidad" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {units.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="harvestDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fecha de cosecha</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={'outline'}
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? (
                              format(field.value, 'PPP')
                            ) : (
                              <span>Elige una fecha</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date('1900-01-01')
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ubicación</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Villa de Leyva, Boyacá" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="pricePerKg"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Precio por kg (COP)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Ej: 3500" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <CertificationPicker control={form.control} />

            <DialogFooter>
              <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">Aceptar</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
