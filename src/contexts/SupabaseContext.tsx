'use client';

import { createContext, useContext, ReactNode } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

// Create a new Supabase client instance here, once.
// Or, we can initialize it in RootLayout and pass it to the provider.
// For simplicity and to ensure it's the same one used by RootLayout's useEffect,
// we'll expect the client to be passed into the Provider.

type SupabaseContextType = SupabaseClient | null;

const SupabaseContext = createContext<SupabaseContextType>(null);

export const SupabaseProvider = ({
  children,
  supabase,
}: {
  children: ReactNode;
  supabase: SupabaseClient;
}) => {
  return (
    <SupabaseContext.Provider value={supabase}>
      {children}
    </SupabaseContext.Provider>
  );
};

export const useSupabase = (): SupabaseClient => {
  const context = useContext(SupabaseContext);
  if (context === null) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
};
