'use client';

import "./globals.css";
import React, { useEffect, useState } from "react";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { SupabaseProvider } from '@/contexts/SupabaseContext';
import { Toaster } from '@/components/ui/sonner';
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
    <html lang="fr">
      <head>
        <title>Chifa.ai</title>
        <meta name="description" content="Interrogez votre base de données pharmacie en langage naturel." />
      </head>
      <body className="antialiased">
        <SupabaseProvider supabase={supabase}>
          {!isInitialAuthCheckDone ? (
            <div className="flex items-center justify-center h-screen">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Initialisation de l'authentification...</p>
              </div>
            </div>
          ) : (
            children
          )}
          <Toaster />
        </SupabaseProvider>
      </body>
    </html>
  );
}
