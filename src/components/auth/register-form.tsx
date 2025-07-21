'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useChifaAuth } from '@/hooks/useChifaAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BotIcon } from '@/components/icons';

export function RegisterForm() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const { register } = useChifaAuth();
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      setIsLoading(false);
      return;
    }

    try {
      const result = await register(formData.email, formData.password, formData.fullName);
      
      if (result.success) {
        setSuccess('Compte créé avec succès ! Vérifiez votre email pour confirmer votre compte.');
        // Optionally redirect to login after a delay
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } else {
        setError(result.error || 'Erreur lors de la création du compte');
      }
    } catch (error) {
      setError('Erreur inattendue lors de la création du compte');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-green-600">
            <BotIcon />
          </div>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-foreground">
            Créer un compte Chifa.ai
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Rejoignez Chifa.ai pour accéder à l'assistant IA pour pharmaciens
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="fullName">Nom complet</Label>
              <Input
                id="fullName"
                name="fullName"
                type="text"
                autoComplete="name"
                required
                value={formData.fullName}
                onChange={handleChange}
                className="mt-1"
                placeholder="Votre nom complet"
              />
            </div>

            <div>
              <Label htmlFor="email">Adresse email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="mt-1"
                placeholder="votre@email.com"
              />
            </div>

            <div>
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={handleChange}
                className="mt-1"
                placeholder="••••••••"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Minimum 6 caractères
              </p>
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="mt-1"
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-destructive/15 p-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {success && (
            <div className="rounded-md bg-green-50 p-3">
              <p className="text-sm text-green-800">{success}</p>
            </div>
          )}

          <Button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700"
            disabled={isLoading}
          >
            {isLoading ? 'Création...' : 'Créer le compte'}
          </Button>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Déjà un compte ?{' '}
              <a
                href="/login"
                className="font-medium text-green-600 hover:text-green-500"
              >
                Se connecter
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}