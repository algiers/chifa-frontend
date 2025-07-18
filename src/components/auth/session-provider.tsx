'use client';

import { SessionProvider } from 'next-auth/react';
import type { Session } from 'next-auth';

interface ChifaSessionProviderProps {
  children: React.ReactNode;
  session?: Session | null;
}

export function ChifaSessionProvider({ children, session }: ChifaSessionProviderProps) {
  return (
    <SessionProvider session={session}>
      {children}
    </SessionProvider>
  );
}