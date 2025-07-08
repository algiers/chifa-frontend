'use client';

import React, { useState, FormEvent } from 'react';
import Link from 'next/link';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

export default function ForgotPasswordPage() {
  const supabase = createSupabaseBrowserClient();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePasswordReset = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setMessage(null);
    setError(null);

    // Obtenir l'URL de redirection. Elle doit être configurée dans les templates d'email Supabase.
    // Par exemple, pour rediriger vers une page de réinitialisation de mot de passe sur votre site.
    // Pour l'instant, Supabase enverra un lien magique ou un lien de réinitialisation à l'email.
    // La page de redirection doit être configurée dans les paramètres d'authentification de Supabase.
    // Exemple: `${window.location.origin}/auth/reset-password`
    // Pour cette démo, nous n'implémentons pas la page de saisie du nouveau mot de passe,
    // Supabase gère l'envoi de l'email.

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      // redirectTo: `${window.location.origin}/auth/callback?next=/update-password`, // Exemple de redirection
    });

    if (resetError) {
      setError(resetError.message);
    } else {
      setMessage('Si un compte existe pour cette adresse email, un lien de réinitialisation du mot de passe a été envoyé.');
    }

    setIsLoading(false);
  };

  return (
    <div>
      <h2 className="text-center text-3xl font-extrabold text-gray-900 mb-6">
        Mot de passe oublié ?
      </h2>
      <p className="text-center text-sm text-gray-600 mb-6">
        Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
      </p>
      <form onSubmit={handlePasswordReset} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Adresse email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            disabled={isLoading}
          />
        </div>

        {message && (
          <p className="text-sm text-green-600">{message}</p>
        )}
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isLoading ? 'Envoi en cours...' : 'Envoyer le lien de réinitialisation'}
          </button>
        </div>
      </form>
      <div className="mt-6 text-center">
        <p className="text-sm">
          Vous vous souvenez de votre mot de passe ?{' '}
          <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
            Connectez-vous
          </Link>
        </p>
      </div>
    </div>
  );
}
