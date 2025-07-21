'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { register, isLoading } = useAuth();
  const router = useRouter();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!email || !password || !confirmPassword) {
      setError('Veuillez remplir tous les champs');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    
    try {
      await register(email, password, name);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue lors de l\'inscription');
    }
  };
  
  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-green-600">Chifa.ai</h1>
          <h2 className="mt-6 text-2xl font-bold tracking-tight">Créer un compte</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Ou{' '}
            <Link href="/login" className="font-medium text-green-600 hover:text-green-500">
              se connecter à un compte existant
            </Link>
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-destructive/15 p-3 rounded-md">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
          
          <div className="space-y-4 rounded-md">
            <div>
              <label htmlFor="name" className="block text-sm font-medium">
                Nom complet (optionnel)
              </label>
              <Input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1"
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium">
                Mot de passe
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1"
              />
            </div>
            
            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium">
                Confirmer le mot de passe
              </label>
              <Input
                id="confirm-password"
                name="confirm-password"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          
          <div>
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Création du compte...' : 'Créer un compte'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}