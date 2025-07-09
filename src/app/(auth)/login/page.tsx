'use client';

import React, { useState, FormEvent, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import AuthForm from '@/components/auth/AuthForm';

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createSupabaseBrowserClient();
  const { setUser, setLoading, setError: setAuthError, setProfileDetails } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoadingState] = useState(false); // Renommé pour éviter conflit avec authStore.isLoading
  const [error, setErrorState] = useState<string | null>(null); // Renommé pour éviter conflit avec authStore.error

  const handleLogin = async (formData: Record<string, string>) => {
    console.log('[LoginPage] handleLogin started. FormData:', formData);
    setIsLoadingState(true);
    setLoading(true); 
    setErrorState(null);
    setAuthError(null); 

    const { email, password } = formData;

    console.log(`[LoginPage] Attempting signInWithPassword for email: ${email}`);
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    console.log('[LoginPage] signInWithPassword response:', { data, signInError });

    if (signInError) {
      console.error('[LoginPage] signInError:', signInError);
      setErrorState(signInError.message);
      setAuthError(new Error(signInError.message));
      setIsLoadingState(false);
      setLoading(false);
      return;
    }

    if (data.user && data.session) {
      console.log('[LoginPage] Login successful. User ID:', data.user.id);
      setUser(data.user); 
      
      const redirectTo = searchParams.get('redirectTo') || '/dashboard';
      console.log(`[LoginPage] Redirecting to: ${redirectTo}`);
      router.push(redirectTo);
      // La redirection est initiée. Les états de chargement seront remis à false ci-dessous.
      // Si la redirection est très rapide, le composant pourrait être démonté avant.
    } else {
      console.warn('[LoginPage] Login issue: No user/session data returned, but no explicit error.');
      setErrorState('Erreur inattendue lors de la connexion (données utilisateur/session manquantes).');
      setAuthError(new Error('Erreur inattendue lors de la connexion (données utilisateur/session manquantes).'));
    }
    
    console.log('[LoginPage] handleLogin finished. Setting loading states to false.');
    setIsLoadingState(false);
    setLoading(false);
  };

  return (
    <div>
      <h2 className="text-center text-3xl font-extrabold text-gray-900 mb-6">
        Connectez-vous à votre compte
      </h2>
      <AuthForm
        mode="login"
        onSubmit={handleLogin}
        isLoading={isLoading}
        error={error}
      />
      <div className="mt-6 text-center">
        <p className="text-sm">
          Pas encore de compte ?{' '}
          <Link href="/register" className="font-medium text-blue-600 hover:text-blue-500">
            Inscrivez-vous
          </Link>
        </p>
        <p className="mt-2 text-sm">
          <Link href="/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
            Mot de passe oublié ?
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Chargement...</p>
      </div>
    </div>}>
      <LoginPageContent />
    </Suspense>
  );
}
