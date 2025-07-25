'use client';

import React, { useState } from 'react';
import { Button } from '../ui/button';
import { createSupabaseBrowserClient } from '../../lib/supabase/client';
import { toast } from 'sonner';

interface TestLoginButtonProps {
  email: string;
  password: string;
}

export default function TestLoginButton({ email, password }: TestLoginButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const testLogin = async () => {
    if (!email || !password) {
      toast.error('Email et mot de passe requis pour tester la connexion');
      return;
    }

    setIsLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      
      // Tester la connexion
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        throw error;
      }

      // Déconnexion immédiate après le test
      await supabase.auth.signOut();
      
      toast.success('✅ Test de connexion réussi ! Les identifiants fonctionnent correctement.');
    } catch (error: any) {
      console.error('Erreur de test de connexion:', error);
      toast.error(`❌ Échec du test de connexion: ${error.message || 'Erreur inconnue'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={testLogin}
      disabled={isLoading || !email || !password}
      variant="outline"
      size="sm"
      className="bg-green-50 hover:bg-green-100 text-green-700 border-green-300"
    >
      {isLoading ? (
        <>
          <span className="animate-spin mr-2">⟳</span> Test en cours...
        </>
      ) : (
        <>🔑 Tester la connexion</>
      )}
    </Button>
  );
}