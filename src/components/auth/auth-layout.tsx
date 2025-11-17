import type { ReactNode } from 'react';
import { Logo } from '@/components/common/logo';

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
            <Logo />
        </div>
        {children}
      </div>
    </main>
  );
}
