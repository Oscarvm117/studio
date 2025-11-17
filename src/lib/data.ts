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
  // Lots are now created dynamically by farmers
];
