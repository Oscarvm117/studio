import type { Lot, User } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export const mockUsers: User[] = [
  {
    id: 'farmer-1',
    name: 'Carlos Mendoza',
    email: 'carlos@farm.co',
    role: 'farmer',
  },
  {
    id: 'buyer-1',
    name: 'Ana García',
    email: 'ana@grocer.com',
    role: 'buyer',
  },
];

const getImage = (hint: string) => {
  const found = PlaceHolderImages.find(img => img.imageHint.includes(hint));
  return {
    url: found?.imageUrl || PlaceHolderImages[0].imageUrl,
    hint: found?.imageHint || PlaceHolderImages[0].imageHint,
  };
}

export const initialLots: Lot[] = [
  {
    id: 'lot-1',
    farmerId: 'farmer-1',
    farmerName: 'Carlos Mendoza',
    productType: 'Tomates Chonto',
    quantity: 100,
    unit: 'kg',
    harvestDate: new Date('2024-07-10'),
    location: 'Villa de Leyva, Boyacá',
    pricePerKg: 3500,
    certifications: ['Orgánico', 'Cultivado Localmente'],
    status: 'available',
    image: getImage('tomatoes'),
  },
  {
    id: 'lot-2',
    farmerId: 'farmer-1',
    farmerName: 'Carlos Mendoza',
    productType: 'Papa Criolla',
    quantity: 500,
    unit: 'kg',
    harvestDate: new Date('2024-06-25'),
    location: 'Sogamoso, Boyacá',
    pricePerKg: 2000,
    certifications: ['Sostenible', 'Cultivado Localmente'],
    status: 'available',
    image: getImage('potatoes'),
  },
  {
    id: 'lot-3',
    farmerId: 'farmer-1',
    farmerName: 'Carlos Mendoza',
    productType: 'Lechuga Batavia',
    quantity: 50,
    unit: 'docena',
    harvestDate: new Date('2024-07-15'),
    location: 'La Sabana, Cundinamarca',
    pricePerKg: 12000,
    certifications: ['Orgánico', 'Sin OGM'],
    status: 'sold',
    image: getImage('lettuce'),
  },
  {
    id: 'lot-4',
    farmerId: 'farmer-1',
    farmerName: 'Carlos Mendoza',
    productType: 'Café de Origen',
    quantity: 250,
    unit: 'lb',
    harvestDate: new Date('2024-05-20'),
    location: 'Salento, Quindío',
    pricePerKg: 25000,
    certifications: ['Comercio Justo', 'Sostenible'],
    status: 'available',
    image: getImage('coffee'),
  },
];
