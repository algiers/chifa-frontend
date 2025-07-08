'use client';

import React, { useState, FormEvent } from 'react';
import { Button } from '@/components/ui/button'; // Assumant que shadcn/ui Button sera ajouté plus tard
import { Input } from '@/components/ui/input';   // Assumant que shadcn/ui Input sera ajouté plus tard
import { Label } from '@/components/ui/label';   // Assumant que shadcn/ui Label sera ajouté plus tard

interface AuthFormProps {
  mode: 'login' | 'register';
  onSubmit: (formData: Record<string, string>) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  initialData?: Record<string, string>;
}

const AuthForm: React.FC<AuthFormProps> = ({ mode, onSubmit, isLoading, error, initialData = {} }) => {
  const [email, setEmail] = useState(initialData.email || '');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState(initialData.fullName || ''); // Pour l'inscription

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData: Record<string, string> = { email, password };
    if (mode === 'register') {
      formData.fullName = fullName;
    }
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {mode === 'register' && (
        <div>
          <Label htmlFor="fullName">Nom complet</Label>
          <Input
            id="fullName"
            name="fullName"
            type="text"
            autoComplete="name"
            required
            value={fullName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFullName(e.target.value)}
            disabled={isLoading}
            placeholder="Votre nom complet"
          />
        </div>
      )}
      <div>
        <Label htmlFor="email">Adresse email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
            value={email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
            disabled={isLoading}
            placeholder="vous@exemple.com"
        />
      </div>
      <div>
        <Label htmlFor="password">Mot de passe</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          required
          minLength={mode === 'register' ? 6 : undefined}
            value={password}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
            disabled={isLoading}
            placeholder="********"
        />
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <div>
        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading
            ? mode === 'login' ? 'Connexion...' : 'Inscription...'
            : mode === 'login' ? 'Se connecter' : 'S\'inscrire'}
        </Button>
      </div>
    </form>
  );
};

export default AuthForm;
