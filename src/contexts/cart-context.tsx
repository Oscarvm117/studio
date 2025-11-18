'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useState } from 'react';
import type { Lot } from '@/lib/types';
import { useFirebase } from '@/firebase';
import { doc, writeBatch } from 'firebase/firestore';

export interface CartItem extends Lot {
  cartQuantity: number; // Will always be 1, representing one lot
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (lot: Lot) => void;
  removeFromCart: (lotId: string) => void;
  clearCart: () => void;
  checkout: () => Promise<void>;
  cartTotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const { firestore } = useFirebase();

  const addToCart = (lot: Lot) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === lot.id);
      if (existingItem) {
        // If lot is already in cart, do nothing.
        // Optionally, you could show a toast message here.
        return prevCart;
      }
      // cartQuantity will always be 1, representing the entire lot.
      return [...prevCart, { ...lot, cartQuantity: 1 }];
    });
  };

  const removeFromCart = (lotId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== lotId));
  };
  
  // updateQuantity function is removed as it's no longer needed.

  const clearCart = () => {
    setCart([]);
  };

  const checkout = async () => {
    if (cart.length === 0) return;

    const batch = writeBatch(firestore);

    cart.forEach(item => {
      // The path to the lot is /users/{farmerId}/lots/{lotId}
      const lotRef = doc(firestore, 'users', item.farmerId, 'lots', item.id);
      batch.update(lotRef, { status: 'sold' });
    });

    await batch.commit();
    clearCart();
  };


  // The total is now calculated based on the full quantity of each lot.
  const cartTotal = cart.reduce((total, item) => total + (item.pricePerKg * item.quantity), 0);

  const value = {
    cart,
    addToCart,
    removeFromCart,
    clearCart,
    checkout,
    cartTotal,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
