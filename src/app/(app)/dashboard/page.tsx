'use client';

import React, { useEffect, Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ChatLayout from '@/components/chat/ChatLayout';
import { useAuthStore } from '@/stores/authStore';
import { useChatStore } from '@/stores/chatStore';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Loader2, RefreshCw } from 'lucide-react';

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

  const { 
    setMessages, 
    setCurrentConversationId, 
    clearChat, 
    setLoading: setChatLoading, 
    setError: setChatError,
    currentConversationId
  } = useChatStore();
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createSupabaseBrowserClient();
  const [retryLoading, setRetryLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Clear error if user is properly loaded and profile exists
  useEffect(() => {
    if (user && codePs && pharmacyStatus === 'active' && authError) {
      setError(null);
    }
  }, [user, codePs, pharmacyStatus, authError, setError]);

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

  useEffect(() => {
    const conversationIdFromUrl = searchParams.get('conversation_id');

    const loadConversation = async (conversationId: string) => {
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
          const fetchedMessages = data.map((msg: any) => ({
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
        setChatError('Erreur lors du chargement de la conversation.');
        clearChat();
        setCurrentConversationId(null);
      } finally {
        setChatLoading(false);
      }
    };

    if (conversationIdFromUrl) {
      loadConversation(conversationIdFromUrl);
    } else {
      clearChat();
      setCurrentConversationId(null);
    }
  }, [searchParams, clearChat, setChatLoading, setChatError, setMessages, setCurrentConversationId]);

  useEffect(() => {
    if (isAuthReady && isAdmin) {
      router.replace('/admin/pharmacies');
    }
    if (isAuthReady && !user) {
      router.replace('/login?redirectTo=/dashboard');
    }
  }, [isAuthReady, isAdmin, user, router]);

  useEffect(() => {
    if (!user) {
      router.push('/login?redirectTo=/dashboard');
      return;
    }
    if (pharmacyStatus === 'not_registered' || pharmacyStatus === 'pending_pharmacy_details') {
      router.push('/complete-pharmacy-profile');
      return;
    }
    if (pharmacyStatus === 'demo_credits_exhausted') {
      router.push('/pricing?reason=credits_exhausted');
      return;
    }
  }, [user, pharmacyStatus, router]);

  const handleNewChat = () => {
    clearChat();
    setCurrentConversationId(null);
    // Remove conversation_id from URL
    const url = new URL(window.location.href);
    url.searchParams.delete('conversation_id');
    window.history.replaceState({}, '', url.toString());
  };

  const handleConversationSelect = (conversationId: string | null) => {
    setCurrentConversationId(conversationId);
    if (conversationId) {
      const url = new URL(window.location.href);
      url.searchParams.set('conversation_id', conversationId);
      window.history.replaceState({}, '', url.toString());
    } else {
      const url = new URL(window.location.href);
      url.searchParams.delete('conversation_id');
      window.history.replaceState({}, '', url.toString());
    }
  };

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
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50 px-4">
        <Card className="border-0 shadow-xl max-w-md w-full">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="text-xl font-bold">Erreur de profil</CardTitle>
            <CardDescription>
              {typeof authError === 'string' ? authError : authError.message || 'Erreur inconnue'}
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

  return (
    <div className="h-screen flex flex-col bg-background">
      <ChatLayout />
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
