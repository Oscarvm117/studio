'use client';

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Header } from '@/components/common/header';
import type { Role } from '@/lib/types';

interface DashboardLayoutProps {
  children: ReactNode;
  allowedRole: Role;
}

export function DashboardLayout({ children, allowedRole }: DashboardLayoutProps) {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // This effect will run on the client after hydration
    if (!isAuthenticated) {
      router.replace('/login');
    } else if (user?.role !== allowedRole) {
      // Redirect if user has the wrong role
      router.replace(user?.role === 'farmer' ? '/farmer' : '/buyer');
    }
  }, [isAuthenticated, user, allowedRole, router]);

  // Render a loading state or null while checking auth
  if (!isAuthenticated || user?.role !== allowedRole) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex-1">{children}</main>
    </div>
  );
}
