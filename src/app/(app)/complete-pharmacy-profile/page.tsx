'use client';

import React, { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button'; // À ajouter via shadcn
import { Input } from '@/components/ui/input';   // À ajouter via shadcn
import { Label } from '@/components/ui/label';   // À ajouter via shadcn
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export default function CompletePharmacyProfilePage() {
  console.log('[CompletePharmacyProfilePage] Mounted');

  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const { 
    user, 
    fullName, 
    email, 
    phoneNumber: currentPhoneNumber, // Depuis le profil utilisateur si déjà là
    codePs: currentCodePs,
    pharmacyName: currentPharmacyName,
    pharmacyAddress: currentPharmacyAddress,
    pharmacyStatus,
    setProfileDetails, 
    setLoading: setAuthLoading, 
    setError: setAuthError 
  } = useAuthStore();

  // Nouvelle logique : utiliser Zustand pour l'état d'auth readiness
  const isAuthReady = useAuthStore((state) => state.isAuthReady);

  const [codePs, setCodePs] = useState(currentCodePs || '');
  const [pharmacyName, setPharmacyName] = useState(currentPharmacyName || '');
  const [address, setAddress] = useState(currentPharmacyAddress || '');
  const [pharmacistName, setPharmacistName] = useState(fullName || ''); // Pré-remplir avec le nom du profil
  const [phoneNumber, setPhoneNumber] = useState(currentPhoneNumber || ''); // Pré-remplir

  const [isLoading, setIsLoadingState] = useState(false);
  const [error, setErrorState] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthReady) return;
    if (
      pharmacyStatus === 'active' ||
      pharmacyStatus === 'active_demo' ||
      pharmacyStatus === 'pending_payment_approval'
    ) {
      router.replace('/dashboard');
    }
    // else: show registration form (handled by return below)
  }, [isAuthReady, pharmacyStatus, router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    console.log('Form submitted');
    event.preventDefault();
    setIsLoadingState(true);
    setAuthLoading(true);
    setErrorState(null);
    setAuthError(null);
    setMessage(null);

    if (!user || !user.email || !user.id) {
      setErrorState("Utilisateur non authentifié ou informations utilisateur manquantes.");
      setAuthError(new Error("Utilisateur non authentifié ou informations utilisateur manquantes."));
      setIsLoadingState(false);
      setAuthLoading(false);
      return;
    }

    try {
      // Étape 1: Appeler directement l'Edge Function Supabase
      const { data: result, error: functionError } = await supabase.functions.invoke('register-pharmacy', {
        body: {
          codePs,
          pharmacyName,
          address,
          pharmacistName,
          phoneNumber,
          email: user.email,
          userId: user.id,
        },
      });

      if (functionError) {
        console.error('Supabase function invocation error:', functionError);
        throw new Error(functionError.message || 'Erreur lors de l\'appel à la fonction d\'enregistrement.');
      }
      
      if (!result || result.error) {
        console.error('Edge function returned an error:', result?.error);
        throw new Error(result?.error || 'Erreur retournée par la fonction d\'enregistrement.');
      }
      
      if (!result.success) {
        console.error('Edge function reported failure:', result.message);
        throw new Error(result.message || 'L\'enregistrement de la pharmacie a échoué.');
      }

      // Rafraîchir le profil depuis Supabase après enregistrement
      const { data: freshProfile, error: freshProfileError } = await supabase
        .from('profiles')
        .select('code_ps, pharmacy_name, pharmacy_address, phone_number, full_name, pharmacy_status')
        .eq('id', user.id)
        .single();

      if (!freshProfileError && freshProfile) {
        setProfileDetails({
          codePs: freshProfile.code_ps,
          pharmacyName: freshProfile.pharmacy_name,
          pharmacyAddress: freshProfile.pharmacy_address,
          phoneNumber: freshProfile.phone_number,
          fullName: freshProfile.full_name,
          pharmacyStatus: freshProfile.pharmacy_status,
        });
      } else {
        // fallback to result if fetch fails
        setProfileDetails({
          codePs: result.codePs,
          pharmacyName: result.pharmacyName,
          pharmacyAddress: address, 
          phoneNumber: phoneNumber, 
          fullName: pharmacistName, 
          pharmacyStatus: result.pharmacyStatus as any,
        });
      }

      toast.success(result.message || 'Informations de la pharmacie enregistrées. Statut : ' + result.pharmacyStatus);
      setMessage(result.message);

      router.push('/dashboard');

    } catch (e: any) {
      console.error('Failed to register pharmacy:', e);
      setErrorState(e.message || 'Une erreur est survenue.');
      setAuthError(e);
      toast.error(e.message || 'Une erreur est survenue.');
    } finally {
      setIsLoadingState(false);
      setAuthLoading(false);
    }
  };
  
  if (!isAuthReady) {
    return <div className="flex items-center justify-center h-screen">Chargement des informations utilisateur...</div>;
  }

  if (
    pharmacyStatus === 'active' ||
    pharmacyStatus === 'active_demo' ||
    pharmacyStatus === 'pending_payment_approval'
  ) {
    return <div className="flex items-center justify-center h-screen">Redirection vers le tableau de bord...</div>;
  }

  if (pharmacyStatus === 'pending_pharmacy_details') {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white shadow-md rounded-lg">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          Compléter les informations de votre pharmacie
        </h1>
        <p className="mb-6 text-sm text-gray-600">
          Ces informations sont nécessaires pour activer votre compte Chifa.ai et connecter notre agent à votre base de données.
        </p>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="pharmacistName">Votre Nom Complet (Pharmacien)</Label>
            <Input
              id="pharmacistName"
              type="text"
              value={pharmacistName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPharmacistName(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          <div>
            <Label htmlFor="codePs">Code PS (Identifiant unique de votre pharmacie)</Label>
            <Input
              id="codePs"
              type="text"
              value={codePs}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCodePs(e.target.value)}
              required
              disabled={isLoading}
              placeholder="Ex: 16010123"
            />
          </div>
          <div>
            <Label htmlFor="pharmacyName">Nom de la Pharmacie</Label>
            <Input
              id="pharmacyName"
              type="text"
              value={pharmacyName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPharmacyName(e.target.value)}
              required
              disabled={isLoading}
              placeholder="Pharmacie Les Glycines"
            />
          </div>
          <div>
            <Label htmlFor="address">Adresse de la Pharmacie</Label>
            <Input
              id="address"
              type="text"
              value={address}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAddress(e.target.value)}
              required
              disabled={isLoading}
              placeholder="123 Rue de la Liberté, Alger"
            />
          </div>
          <div>
            <Label htmlFor="phoneNumber">Votre Numéro de Téléphone</Label>
            <Input
              id="phoneNumber"
              type="tel"
              value={phoneNumber}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhoneNumber(e.target.value)}
              required
              disabled={isLoading}
              placeholder="05 XX XX XX XX"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {message && <p className="text-sm text-green-600">{message}</p>}

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? 'Enregistrement en cours...' : 'Enregistrer les informations'}
          </Button>
        </form>
      </div>
    );
  }

  // Fallback for unexpected status
  return <div className="flex items-center justify-center h-screen">Erreur : statut de pharmacie inconnu ({pharmacyStatus})</div>;
}
