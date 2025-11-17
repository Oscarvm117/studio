'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useState } from 'react';
import type { Lot } from '@/lib/types';

export interface CartItem extends Lot {
  cartQuantity: number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (lot: Lot) => void;
  removeFromCart: (lotId: string) => void;
  updateQuantity: (lotId: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);

  const addToCart = (lot: Lot) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === lot.id);
      if (existingItem) {
        return prevCart.map((item) =>
          item.id === lot.id
            ? { ...item, cartQuantity: Math.min(item.cartQuantity + 1, item.quantity) }
            : item
        );
      }
      return [...prevCart, { ...lot, cartQuantity: 1 }];
    });
  };

  const removeFromCart = (lotId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== lotId));
  };

  const updateQuantity = (lotId: string, quantity: number) => {
    setCart((prevCart) =>
      prevCart.map((item) => {
        if (item.id === lotId) {
          const newQuantity = Math.max(1, Math.min(quantity, item.quantity));
          return { ...item, cartQuantity: newQuantity };
        }
        return item;
      })
    );
  };
  
  const clearCart = () => {
    setCart([]);
  };

  const cartTotal = cart.reduce((total, item) => total + item.pricePerKg * item.cartQuantity, 0);

  const value = {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
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
