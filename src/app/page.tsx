'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, user, isAuthLoading } = useAuth();

  useEffect(() => {
    if (isAuthLoading) {
      // Wait until authentication is resolved
      return;
    }
    
    if (isAuthenticated && user) {
        router.replace(user.role === 'farmer' ? '/farmer' : '/buyer');
    } else {
        router.replace('/login');
    }
  }, [router, isAuthenticated, user, isAuthLoading]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
    </div>
  );
}
