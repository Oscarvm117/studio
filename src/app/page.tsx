'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, user, isAuthLoading } = useAuth();

  useEffect(() => {
    // Only perform redirects once the authentication state is fully resolved.
    if (isAuthLoading) {
      return; // Wait until loading is complete.
    }
    
    if (isAuthenticated && user) {
        // If authenticated and user data is available, redirect to the correct dashboard.
        router.replace(user.role === 'farmer' ? '/farmer' : '/buyer');
    } else {
        // If not authenticated, redirect to the login page.
        router.replace('/login');
    }
  }, [isAuthLoading, isAuthenticated, user, router]);

  // Display a loading spinner while the auth state is being determined.
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
    </div>
  );
}
