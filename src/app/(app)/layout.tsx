'use client'; // Pour utiliser des hooks comme useAuthStore et useEffect pour la redirection

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import Navbar from '@/components/layout/Navbar'; // À créer
import Sidebar from '@/components/layout/Sidebar'; // À créer

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, pharmacyStatus } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    // Ce layout est pour les routes protégées. Le middleware devrait déjà avoir fait son travail.
    // Mais une vérification supplémentaire ici peut être utile, ou pour gérer des états spécifiques.
    if (!user) {
      // Normalement géré par le middleware, mais comme double sécurité ou si le store se désynchronise.
      // router.push('/login');
    }
    // Exemple de redirection si le profil pharmacie n'est pas complet et que l'utilisateur n'est pas sur la page pour le compléter
    // if (user && pharmacyStatus === 'pending_pharmacy_details' && window.location.pathname !== '/complete-pharmacy-profile') {
    //   router.push('/complete-pharmacy-profile');
    // }
  }, [user, pharmacyStatus, router]);

  // Si l'utilisateur n'est pas encore chargé ou si la redirection est en cours, on peut afficher un loader.
  // Pour l'instant, on assume que le middleware gère la redirection principale.
  // if (!user) {
  //   return <div>Chargement de la session...</div>; // Ou un spinner global
  // }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
