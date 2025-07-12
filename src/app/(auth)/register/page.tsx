'use client';

import React, { useState, FormEvent, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/theme-toggle';
import { AlertCircle, ArrowLeft, Loader2, CheckCircle, Sparkles } from 'lucide-react';

const plans = {
  free_demo: {
    name: 'Démo Gratuite',
    description: '3 requêtes IA pour découvrir',
    price: '0 DA',
    color: 'bg-blue-500'
  },
  pro_monthly: {
    name: 'Pro Pharmacie',
    description: 'Requêtes illimitées + Analytics',
    price: '4,900 DA/mois',
    color: 'bg-purple-500'
  }
};

function RegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createSupabaseBrowserClient();
  const { setUser, setLoading, setError: setAuthError } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoadingState] = useState(false);
  const [error, setErrorState] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const planFromQuery = searchParams.get('plan') || 'free_demo';
  const selectedPlan = plans[planFromQuery as keyof typeof plans] || plans.free_demo;

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoadingState(true);
    setLoading(true);
    setErrorState(null);
    setAuthError(null);

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          selected_plan: planFromQuery,
        },
      },
    });

    if (signUpError) {
      setErrorState('Erreur lors de l\'inscription: ' + signUpError.message);
      setAuthError(new Error(signUpError.message));
      setIsLoadingState(false);
      setLoading(false);
      return;
    }

    if (signUpData.user) {
      setUser(signUpData.user);
      setSuccess(true);
      
      // Redirect after success
      setTimeout(() => {
        router.push('/complete-pharmacy-profile');
      }, 2000);
    }
    
    setIsLoadingState(false);
    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50 px-4">
        <div className="w-full max-w-md">
          <Card className="border-0 shadow-xl text-center">
            <CardContent className="pt-8 pb-6">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Inscription réussie !</h2>
              <p className="text-muted-foreground mb-4">
                Un email de vérification a été envoyé à <strong>{email}</strong>
              </p>
              <p className="text-sm text-muted-foreground">
                Redirection vers la configuration de votre pharmacie...
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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
            <div className="h-12 w-12 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xl">C</span>
            </div>
            <span className="font-bold text-2xl">Chifa.ai</span>
          </Link>
        </div>

        {/* Selected Plan Badge */}
        <div className="text-center">
          <Badge variant="outline" className="px-4 py-2">
            <Sparkles className="mr-2 h-4 w-4" />
            Plan sélectionné: {selectedPlan.name} - {selectedPlan.price}
          </Badge>
        </div>

        {/* Register Card */}
        <Card className="border-0 shadow-xl">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold">Créer un compte</CardTitle>
            <CardDescription>
              Rejoignez plus de 500 pharmacies qui utilisent Chifa.ai
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleRegister}>
            <CardContent className="space-y-4">
              {/* Error message */}
              {error && (
                <div className="flex items-center space-x-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}

              {/* Full Name field */}
              <div className="space-y-2">
                <Label htmlFor="fullName">Nom complet</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Dr. Mohamed Benali"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={isLoading}
                  required
                  autoComplete="name"
                />
              </div>

              {/* Email field */}
              <div className="space-y-2">
                <Label htmlFor="email">Email professionnel</Label>
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
                  autoComplete="new-password"
                  minLength={6}
                />
                <p className="text-xs text-muted-foreground">
                  Minimum 6 caractères
                </p>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              {/* Submit button */}
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading || !email || !password || !fullName}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Création du compte...
                  </>
                ) : (
                  <>
                    Créer mon compte
                    <Sparkles className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>

              {/* Login link */}
              <div className="text-center text-sm text-muted-foreground">
                Déjà un compte ?{' '}
                <Link 
                  href="/login" 
                  className="text-primary hover:underline font-medium"
                >
                  Se connecter
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground">
          En créant un compte, vous acceptez nos{' '}
          <Link href="/terms" className="underline hover:text-primary">
            conditions d'utilisation
          </Link>{' '}
          et notre{' '}
          <Link href="/privacy" className="underline hover:text-primary">
            politique de confidentialité
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    }>
      <RegisterPageContent />
    </Suspense>
  );
}