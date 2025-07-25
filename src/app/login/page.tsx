'use client';

import React, { useState, FormEvent, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createSupabaseBrowserClient } from '../../lib/supabase/client';
import { useAuthStore } from '../../stores/authStore';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import { ThemeToggle } from '../../components/theme-toggle';
import { AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createSupabaseBrowserClient();
  const { setUser, setLoading, setError: setAuthError } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoadingState] = useState(false);
  const [error, setErrorState] = useState<string | null>(null);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    console.log('[LoginPage] handleLogin started');
    setIsLoadingState(true);
    setLoading(true);
    setErrorState(null);
    setAuthError(null);

    console.log(`[LoginPage] Attempting signInWithPassword for email: ${email}`);
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    console.log('[LoginPage] signInWithPassword response:', { data, signInError });

    if (signInError) {
      console.error('[LoginPage] signInError:', signInError);
      setErrorState('Email ou mot de passe incorrect');
      setAuthError(new Error(signInError.message));
      setIsLoadingState(false);
      setLoading(false);
      return;
    }

    if (data.user && data.session) {
      console.log('[LoginPage] Login successful. User ID:', data.user.id);
      setUser(data.user);
      
      const redirectTo = searchParams.get('redirectTo') || '/chat';
      console.log(`[LoginPage] Redirecting to: ${redirectTo}`);
      router.push(redirectTo);
    } else {
      console.warn('[LoginPage] Login issue: No user/session data returned');
      setErrorState('Erreur inattendue lors de la connexion');
      setAuthError(new Error('Erreur inattendue lors de la connexion'));
    }
    
    console.log('[LoginPage] handleLogin finished');
    setIsLoadingState(false);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header with back button and theme toggle */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <ThemeToggle />
        </div>

        {/* Logo and brand */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center space-x-2">
            <div className="h-12 w-12 rounded-lg bg-green-600 flex items-center justify-center">
              <span className="text-white font-bold text-xl">C</span>
            </div>
            <span className="font-bold text-2xl">Chifa.ai</span>
          </Link>
        </div>

        {/* Login Card */}
        <Card className="border-0 shadow-xl">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold">Se connecter</CardTitle>
            <CardDescription>
              Entrez vos identifiants pour accéder à votre pharmacie
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              {/* Error message */}
              {error && (
                <div className="flex items-center space-x-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}

              {/* Email field */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="votre@pharmacie.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                  autoComplete="email"
                />
              </div>

              {/* Password field */}
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                  autoComplete="current-password"
                />
              </div>

              {/* Forgot password link */}
              <div className="text-right">
                <Link 
                  href="/forgot-password" 
                  className="text-sm text-muted-foreground hover:text-green-600 transition-colors"
                >
                  Mot de passe oublié ?
                </Link>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              {/* Submit button */}
              <Button 
                type="submit" 
                className="w-full bg-green-600 hover:bg-green-700" 
                disabled={isLoading || !email || !password}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connexion...
                  </>
                ) : (
                  'Se connecter'
                )}
              </Button>

              {/* Register link */}
              <div className="text-center text-sm text-muted-foreground">
                Pas encore de compte ?{' '}
                <Link 
                  href="/register" 
                  className="text-green-600 hover:underline font-medium"
                >
                  S'inscrire
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground">
          En vous connectant, vous acceptez nos{' '}
          <Link href="/terms" className="underline hover:text-green-600">
            conditions d'utilisation
          </Link>{' '}
          et notre{' '}
          <Link href="/privacy" className="underline hover:text-green-600">
            politique de confidentialité
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  );
}