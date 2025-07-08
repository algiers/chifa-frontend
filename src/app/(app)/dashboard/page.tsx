'use client';

import React, { useEffect, Suspense, useState } from 'react'; // Import Suspense
import { useRouter, useSearchParams } from 'next/navigation';
import ChatInput from '@/components/chat/ChatInput';
import MessageList from '@/components/chat/MessageList';
import { useAuthStore } from '@/stores/authStore';
import { useChatStore, ChatMessage } from '@/stores/chatStore'; // Import useChatStore and ChatMessage
import { createSupabaseBrowserClient } from '@/lib/supabase/client'; 
import PharmacyConnectionStatus from '@/components/PharmacyConnectionStatus'; // Importer le composant PharmacyConnectionStatus
// import SQLExecutionDisplay from '@/components/chat/SQLExecutionDisplay'; // À créer plus tard

function DashboardContent() {
  const user = useAuthStore((s) => s.user);
  const pharmacyStatus = useAuthStore((s) => s.pharmacyStatus);
  const demoCreditsRemaining = useAuthStore((s) => s.demoCreditsRemaining);
  const codePs = useAuthStore((s) => s.codePs);
  const authError = useAuthStore((s) => s.error);
  const authLoading = useAuthStore((s) => s.isLoading);
  const setProfileDetails = useAuthStore((s) => s.setProfileDetails);
  const setError = useAuthStore((s) => s.setError);
  const isAuthReady = useAuthStore((s) => s.isAuthReady);
  const isAdmin = useAuthStore((s) => s.isAdmin);

  // Debug logs pour comprendre l'état du profil
  console.log('[Dashboard] Debug - User:', user?.id, 'PharmacyStatus:', pharmacyStatus, 'CodePs:', codePs, 'Error:', authError);
  const { setMessages, setCurrentConversationId, clearChat, setLoading: setChatLoading, setError: setChatError } = useChatStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createSupabaseBrowserClient();
  const [retryLoading, setRetryLoading] = useState(false);

  // Définir l'URL du service local (à adapter selon l'environnement)
  const LOCAL_API_URL = process.env.NEXT_PUBLIC_LOCAL_API_URL || 'http://localhost:8002';

  // Fonction pour réessayer de charger le profil
  const handleRetryProfile = async () => {
    if (!user) return;
    setRetryLoading(true);
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (profileError && profileError.code !== 'PGRST116') {
        setError(new Error(profileError.message || 'Erreur lors de la récupération du profil utilisateur/pharmacie.'));
        setProfileDetails(null);
      } else if (!profileData) {
        setError(new Error('Profil utilisateur/pharmacie introuvable dans la base.'));
        setProfileDetails(null);
      } else {
        setProfileDetails(profileData);
        setError(null);
      }
    } catch (error) {
      setProfileDetails(null);
      setError(error instanceof Error ? error : new Error(String(error)));
    } finally {
      setRetryLoading(false);
    }
  };

  // Fonction de debug pour afficher les détails du profil
  const debugProfile = async () => {
    if (!user) return;
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      console.log('[Dashboard] Full profile data:', profileData);
      console.log('[Dashboard] Profile error:', profileError);
      
      if (profileData) {
        alert(`Profil trouvé:\n- ID: ${profileData.id}\n- Status: ${profileData.pharmacy_status}\n- Code PS: ${profileData.code_ps || 'NON DÉFINI'}\n- Plan: ${profileData.current_plan_id}\n- Crédits: ${profileData.demo_credits_remaining}`);
      } else {
        alert('Aucun profil trouvé');
      }
    } catch (error) {
      console.error('[Dashboard] Debug error:', error);
      alert('Erreur lors du debug: ' + error);
    }
  };

  useEffect(() => {
    const conversationIdFromUrl = searchParams.get('conversation_id');

    const loadConversation = async (conversationId: string) => {
      // Always clear chat before loading a new conversation
      clearChat();
      setChatLoading(true);
      setChatError(null);
      try {
        const { data, error } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true });

        if (error) {
          throw error;
        }

        if (data && data.length > 0) {
          // Transformer les données récupérées en ChatMessage[]
          const fetchedMessages: ChatMessage[] = data.map((msg: any) => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            sqlQuery: msg.sql_query,
            sqlResults: msg.sql_results,
            errorMessage: msg.error_message,
            timestamp: new Date(msg.created_at),
          }));
          setMessages(fetchedMessages);
          setCurrentConversationId(conversationId);
        } else {
          clearChat();
          setCurrentConversationId(null);
          setChatError('Aucune conversation trouvée.');
        }
      } catch (err: any) {
        console.error('Failed to load conversation:', err);
        setChatError('Erreur lors du chargement de la conversation. La conversation est introuvable ou vous n\'y avez pas accès.');
        clearChat();
        setCurrentConversationId(null);
        // Optionnel: rediriger ou afficher un message si la conversation n'est pas trouvée
        // router.replace('/dashboard');
      } finally {
        setChatLoading(false);
      }
    };

    if (conversationIdFromUrl) {
      loadConversation(conversationIdFromUrl);
    } else {
      // Always clear chat state when starting a new chat
      clearChat();
      setCurrentConversationId(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]); // Dépendance à searchParams pour réagir aux changements d'URL

  useEffect(() => {
    if (isAuthReady && isAdmin) {
      router.replace('/admin/pharmacies');
    }
    if (isAuthReady && !user) {
      router.replace('/login?redirectTo=/dashboard');
    }
  }, [isAuthReady, isAdmin, user, router]);

  useEffect(() => {
    // Redirection si l'utilisateur n'est pas censé être ici
    if (!user) {
      router.push('/login?redirectTo=/dashboard');
      return;
    }
    if (pharmacyStatus === 'not_registered' || pharmacyStatus === 'pending_pharmacy_details') {
      router.push('/complete-pharmacy-profile');
      return;
    }
    if (pharmacyStatus === 'pending_payment_approval') {
      // Peut-être rediriger vers une page d'attente ou afficher un message ici
      // Pour l'instant, on le laisse accéder mais ChatInput sera désactivé.
    }
    if (pharmacyStatus === 'demo_credits_exhausted') {
      router.push('/pricing?reason=credits_exhausted');
      return;
    }
    // Autres statuts comme 'suspended', 'rejected' pourraient aussi rediriger.
  }, [user, pharmacyStatus, router]);

  // Afficher un message d'erreur explicite si le profil ne se charge pas
  if (authError) {
    // Debug log pour vérifier l'état de l'erreur
    console.debug('[Dashboard] authError:', authError);
    let errorMsg = '';
    if (typeof authError === 'string') errorMsg = authError;
    else if (authError.message) errorMsg = authError.message;
    else if (typeof authError === 'object' && 'code' in authError) errorMsg = `Code: ${(authError as any).code}`;
    else if (typeof authError === 'object' && 'status' in authError) errorMsg = `Status: ${(authError as any).status}`;
    else errorMsg = JSON.stringify(authError);
    return (
      <div className="p-6 text-center text-red-600 space-y-4">
        <div>
          <strong>Erreur lors du chargement du profil utilisateur/pharmacie :</strong><br />
          {errorMsg || 'Erreur inconnue.'}
        </div>
        <div className="space-x-2">
          <button
            onClick={handleRetryProfile}
            disabled={retryLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {retryLoading ? 'Nouvelle tentative...' : 'Réessayer'}
          </button>
          <button
            onClick={debugProfile}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Debug Profil
          </button>
        </div>
      </div>
    );
  }
  // Vérification plus précise selon le statut de la pharmacie
  if (!user) {
    if (authLoading) {
      return <div className="p-6 text-center">Chargement des informations utilisateur...</div>;
    }
    return <div className="p-6 text-center text-red-600">Utilisateur non connecté. Veuillez vous connecter.</div>;
  }

  // Pour les statuts qui nécessitent un code_ps
  if (pharmacyStatus === 'active' || pharmacyStatus === 'active_demo') {
    if (!codePs) {
      return <div className="p-6 text-center text-red-600">Code pharmacie manquant. Veuillez compléter votre profil pharmacie.</div>;
    }
  }

  // Pour les statuts en attente ou suspendus, on peut afficher le dashboard mais avec des limitations
  if (pharmacyStatus === 'not_registered' || pharmacyStatus === 'pending_pharmacy_details') {
    return <div className="p-6 text-center">Veuillez compléter les informations de votre pharmacie...</div>;
  }
  
  const canChat = pharmacyStatus === 'active' || (pharmacyStatus === 'active_demo' && demoCreditsRemaining > 0);

  return (
    <div className="flex flex-col h-[calc(100vh-theme.spacing.headerHeight)]"> {/* Ajuster la hauteur si Navbar a une hauteur fixe */}
      <header className="p-4 border-b bg-white shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">Chat avec l'Agent Chifa.ai</h1>
          {pharmacyStatus === 'active_demo' && (
            <p className="text-sm text-gray-600">
              Plan Démo - Crédits restants : {demoCreditsRemaining}
            </p>
          )}
          {pharmacyStatus === 'pending_payment_approval' && (
            <p className="text-sm text-orange-600 bg-orange-100 p-2 rounded-md">
              Votre compte est en attente d'approbation de paiement. Certaines fonctionnalités peuvent être limitées.
            </p>
          )}
        </div>
        <PharmacyConnectionStatus apiUrl={LOCAL_API_URL} /> {/* Ajouter le composant PharmacyConnectionStatus ici */}
      </header>
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Zone d'affichage des messages */}
        <div className="flex-1 overflow-y-auto">
          <MessageList />
        </div>

        {/* Zone d'affichage des résultats SQL (sera conditionnelle) */}
        {/* <div className="h-1/3 border-t p-2 bg-white overflow-auto">
          <SQLExecutionDisplay />
        </div> */}
      </div>

      {/* Zone de saisie */}
      <ChatInput />
    </div>
  );
}

// Wrap DashboardContent with Suspense for useSearchParams
export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const isAuthReady = useAuthStore((s) => s.isAuthReady);
  const isAdmin = useAuthStore((s) => s.isAdmin);
  const router = useRouter();

  useEffect(() => {
    if (isAuthReady && isAdmin) {
      router.replace('/admin/pharmacies');
    }
    if (isAuthReady && !user) {
      router.replace('/login?redirectTo=/dashboard');
    }
  }, [isAuthReady, isAdmin, user, router]);

  if (!isAuthReady) {
    return <div className="p-8 text-center">Chargement du profil...</div>;
  }
  if (!user || isAdmin) {
    return null; // Redirection en cours
  }

  return (
    <Suspense fallback={<div className="p-6 text-center">Chargement de la page...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
