'use client';

import "./globals.css";
import "../styles/admin-scrollbar.css";
import "../styles/dropdown-fix.css";
import "../styles/chat.css";
import React, { useEffect, useState } from "react";
import { useSupabaseAuth } from '../hooks/useSupabaseAuth';
import { SupabaseProvider } from '../contexts/SupabaseContext';
import { ThemeProvider } from '../components/theme-provider';
import { Toaster } from '../components/ui/sonner';
import { FullScreenLoading } from '../components/ui/loading';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { supabase, handleAuthStateChange } = useSupabaseAuth();
  const [isInitialAuthCheckDone, setIsInitialAuthCheckDone] = useState(false);

  useEffect(() => {
    // Gestionnaire d'événements d'authentification avec le nouveau hook
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      console.log('[Layout] Auth event received:', event, 'Session exists:', !!session);
      
      await handleAuthStateChange(event, session);
      
      // Marquer comme prêt après le premier événement
      console.log('[Layout] Setting auth check done for event:', event);
      setIsInitialAuthCheckDone(true);
    });

    // Timeout de sécurité - si aucun événement d'auth n'est reçu dans 3 secondes
    const timeoutId = setTimeout(() => {
      console.log('[Layout] Auth timeout reached, forcing auth check done');
      setIsInitialAuthCheckDone(true);
    }, 3000);

    return () => {
      authListener?.subscription?.unsubscribe();
      clearTimeout(timeoutId);
    };
  }, [handleAuthStateChange, supabase]);

  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <title>Chifa.ai</title>
        <meta name="description" content="Interrogez votre base de données pharmacie en langage naturel." />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <SupabaseProvider supabase={supabase}>
            {!isInitialAuthCheckDone ? (
              <FullScreenLoading message="Initialisation de l'authentification..." />
            ) : (
              children
            )}
            <Toaster />
          </SupabaseProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
