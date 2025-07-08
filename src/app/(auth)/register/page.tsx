'use client';

import React, { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import AuthForm from '@/components/auth/AuthForm';

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createSupabaseBrowserClient();
  const { setUser, setLoading, setError: setAuthError, setProfileDetails } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState(''); // Nom complet de l'utilisateur
  const [isLoading, setIsLoadingState] = useState(false); // Renommé pour éviter conflit
  const [error, setErrorState] = useState<string | null>(null); // Renommé pour éviter conflit

  const planFromQuery = searchParams.get('plan') || 'free_demo';

  const handleRegister = async (formData: Record<string, string>) => {
    setIsLoadingState(true);
    setLoading(true);
    setErrorState(null);
    setAuthError(null);

    const { email, password, fullName } = formData;

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (signUpError) {
      setErrorState(signUpError.message);
      setAuthError(new Error(signUpError.message));
      setIsLoadingState(false);
      setLoading(false);
      return;
    }

    if (signUpData.user) {
      setUser(signUpData.user);
      // L'insertion du profil est maintenant gérée par le trigger PostgreSQL.
      // Nous pouvons initialiser le store avec les valeurs par défaut attendues après le trigger.
      setProfileDetails({
        profileId: signUpData.user.id,
        fullName: fullName, // Le trigger utilisera raw_user_meta_data->>'full_name'
        email: signUpData.user.email,
        currentPlanId: planFromQuery as any, // Le trigger mettra 'free_demo' par défaut
        pharmacyStatus: 'pending_pharmacy_details', // Le trigger mettra cela par défaut
        demoCreditsRemaining: planFromQuery === 'free_demo' ? 3 : 0, // Le trigger mettra 3 par défaut
      });
        
      if (signUpData.session) { // Si auto-confirmation est activée
           router.push('/complete-pharmacy-profile');
      } else { // Si confirmation d'email est requise
          alert('Inscription réussie ! Veuillez vérifier votre email pour confirmer votre compte.');
          router.push('/login'); // Rediriger vers login, l'utilisateur se connectera après confirmation.
      }
    } else {
      setErrorState('Erreur inattendue lors de l\'inscription.');
      setAuthError(new Error('Erreur inattendue lors de l\'inscription.'));
    }

    setIsLoadingState(false);
    setLoading(false);
  };

  return (
    <div>
      <h2 className="text-center text-3xl font-extrabold text-gray-900 mb-6">
        Créez votre compte Chifa.ai
      </h2>
      <AuthForm
        mode="register"
        onSubmit={handleRegister}
        isLoading={isLoading}
        error={error}
      />
      <div className="mt-6 text-center">
        <p className="text-sm">
          Déjà un compte ?{' '}
          <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
            Connectez-vous
          </Link>
        </p>
      </div>
    </div>
  );
}
