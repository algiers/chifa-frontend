'use client';

import React, { useEffect, Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ChatInput from '@/components/chat/ChatInput';
import MessageList from '@/components/chat/MessageList';
import { useAuthStore } from '@/stores/authStore';
import { useChatStore, ChatMessage } from '@/stores/chatStore';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import PharmacyConnectionStatus from '@/components/PharmacyConnectionStatus';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/theme-toggle';
import { AlertCircle, ArrowLeft, Loader2, MessageSquare, Activity, Settings, RefreshCw } from 'lucide-react';

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

  // Clear error if user is properly loaded and profile exists
  useEffect(() => {
    if (user && codePs && pharmacyStatus === 'active' && authError) {
      console.log('[Dashboard] Clearing stale error - user and profile are loaded successfully');
      setError(null);
    }
  }, [user, codePs, pharmacyStatus, authError, setError]);

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
  // Vérifier que l'erreur n'est pas un objet vide et qu'elle a un contenu utile
  const hasRealError = authError && (
    typeof authError === 'string' ||
    (typeof authError === 'object' && authError !== null && (
      (authError.message && authError.message.trim() !== '') ||
      ('code' in authError && authError.code) ||
      ('status' in authError && authError.status) ||
      (Object.keys(authError).length > 0 && JSON.stringify(authError) !== '{}')
    ))
  );
  
  if (hasRealError) {
    console.debug('[Dashboard] authError:', authError);
    let errorMsg = '';
    if (typeof authError === 'string') errorMsg = authError;
    else if (authError.message) errorMsg = authError.message;
    else if (typeof authError === 'object' && 'code' in authError) errorMsg = `Code: ${(authError as any).code}`;
    else if (typeof authError === 'object' && 'status' in authError) errorMsg = `Status: ${(authError as any).status}`;
    else errorMsg = JSON.stringify(authError);
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50 px-4">
        <Card className="border-0 shadow-xl max-w-md w-full">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="text-xl font-bold">Erreur de profil</CardTitle>
            <CardDescription>
              {errorMsg || 'Erreur inconnue lors du chargement de votre profil'}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <Button
              onClick={handleRetryProfile}
              disabled={retryLoading}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {retryLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Nouvelle tentative...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Réessayer
                </>
              )}
            </Button>
            <Button
              onClick={debugProfile}
              variant="outline"
              className="w-full border-green-600 text-green-600 hover:bg-green-50"
            >
              Debug Profil
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  if (!user) {
    if (authLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-muted/50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Chargement des informations utilisateur...</p>
          </div>
        </div>
      );
    }
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50 px-4">
        <Card className="border-0 shadow-xl max-w-md w-full">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle>Connexion requise</CardTitle>
            <CardDescription>Veuillez vous connecter pour accéder au dashboard</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild className="w-full bg-green-600 hover:bg-green-700">
              <a href="/login?redirectTo=/dashboard">Se connecter</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (pharmacyStatus === 'active' || pharmacyStatus === 'active_demo') {
    if (!codePs) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-muted/50 px-4">
          <Card className="border-0 shadow-xl max-w-md w-full">
            <CardHeader className="text-center">
              <CardTitle>Configuration incomplète</CardTitle>
              <CardDescription>Votre code pharmacie est manquant</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button asChild className="w-full bg-green-600 hover:bg-green-700">
                <a href="/complete-pharmacy-profile">Compléter le profil</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }
  }

  if (pharmacyStatus === 'not_registered' || pharmacyStatus === 'pending_pharmacy_details') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50 px-4">
        <Card className="border-0 shadow-xl max-w-md w-full">
          <CardHeader className="text-center">
            <CardTitle>Configuration requise</CardTitle>
            <CardDescription>Veuillez compléter les informations de votre pharmacie</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild className="w-full bg-green-600 hover:bg-green-700">
              <a href="/complete-pharmacy-profile">Configurer ma pharmacie</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const canChat = pharmacyStatus === 'active' || (pharmacyStatus === 'active_demo' && demoCreditsRemaining > 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header with modern design */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" asChild>
                <a href="/">
                  <ArrowLeft className="h-4 w-4" />
                </a>
              </Button>
              <div>
                <h1 className="text-xl font-semibold flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-green-600" />
                  Chat Chifa.ai
                </h1>
                {pharmacyStatus === 'active_demo' && (
                  <Badge variant="secondary" className="text-xs mt-1">
                    Démo - {demoCreditsRemaining} crédits restants
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <PharmacyConnectionStatus />
              <ThemeToggle />
              <Button variant="ghost" size="icon" asChild>
                <a href="/settings">
                  <Settings className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
          
          {pharmacyStatus === 'pending_payment_approval' && (
            <div className="mt-3">
              <div className="bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
                <div className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">
                    Votre compte est en attente d'approbation de paiement. Certaines fonctionnalités peuvent être limitées.
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>
      
      {/* Main chat area */}
      <div className="container mx-auto px-4 py-6 h-[calc(100vh-120px)] flex flex-col">
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <MessageList />
          </div>
        </div>

        {/* Chat input */}
        <div className="mt-4">
          <ChatInput />
        </div>
      </div>
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
