'use client';

import React, { useState, FormEvent } from 'react';
import { useChatStore } from '@/stores/chatStore';
import { useAuthStore } from '@/stores/authStore';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SendHorizonal } from 'lucide-react';
import { toast } from 'sonner';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

export default function ChatInput() {
  const {
    currentQuery,
    setCurrentQuery,
    addMessage,
    setLoading,
    setError,
    currentConversationId,
    setCurrentConversationId
  } = useChatStore();

  const { callWithAuth } = useSupabaseAuth();

  const {
    pharmacyStatus,
    demoCreditsRemaining,
    codePs,
  } = useAuthStore();

  const [isComponentLoading, setIsComponentLoading] = useState(false);

  const canSendMessage =
    (pharmacyStatus === 'active') ||
    (pharmacyStatus === 'active_demo' && demoCreditsRemaining > 0);

  const placeholderText = () => {
    if (!codePs && (pharmacyStatus === 'pending_pharmacy_details' || pharmacyStatus === 'not_registered')) {
      return "Veuillez d'abord compléter les informations de votre pharmacie...";
    }
    if (pharmacyStatus === 'pending_payment_approval') {
      return "Votre compte est en attente d'approbation de paiement...";
    }
    if (pharmacyStatus === 'demo_credits_exhausted') {
      return "Vos crédits démo sont épuisés. Veuillez choisir un plan.";
    }
    if (!canSendMessage) {
      return "Vous ne pouvez pas envoyer de message actuellement.";
    }
    return 'Posez votre question en langage naturel... (ex: stock de Paracétamol)';
  };

  // Fonction helper pour faire l'appel API
  const makeApiCall = async (token: string, query: string, userId: string, codePs: string, conversationId: string | null) => {
    const apiUrl = '/api/chat/send-message';

    console.log('[ChatInput] Calling Next.js API:', apiUrl);
    console.log('[ChatInput] Request payload:', {
      query: query.substring(0, 50) + '...',
      userId,
      codePs,
      conversationId,
    });
    console.log('[ChatInput] Auth token (first 50 chars):', token.substring(0, 50) + '...');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log('[ChatInput] Request timeout, aborting...');
      controller.abort();
    }, 60000);

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          query,
          userId,
          codePs,
          conversationId,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log('[ChatInput] API response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[ChatInput] API response error:', response.status, errorText);

        let errorMessage = 'Erreur lors de l\'appel à l\'agent Chifa.';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = `Erreur ${response.status}: ${errorText}`;
        }

        if (response.status === 401) {
          errorMessage = 'Token d\'authentification expiré. Veuillez actualiser la page.';
        }

        const error = new Error(errorMessage);
        (error as any).status = response.status;
        throw error;
      }

      const result = await response.json();
      console.log('[ChatInput] Response received:', {
        hasResponse: !!result.response,
        responseLength: result.response?.length || 0,
        hasError: !!result.error
      });

      if (!result || result.error) {
        console.error('[ChatInput] API returned an error:', result?.error);
        throw new Error(result?.error || 'Erreur retournée par l\'agent Chifa.');
      }

      return result;
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('La requête a pris trop de temps (timeout de 60 secondes)');
      }
      throw error;
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!currentQuery.trim() || !canSendMessage || isComponentLoading) return;

    const userMessageContent = currentQuery;
    addMessage({ role: 'user', content: userMessageContent });
    setCurrentQuery('');

    setLoading(true);
    setIsComponentLoading(true);
    setError(null);

    try {
      if (!codePs) {
        throw new Error("Code PS non disponible. Impossible d'envoyer le message.");
      }

      console.log('[ChatInput] Sending message with robust auth...');

      // Récupérer les informations utilisateur depuis le store
      const { user, codePs: userCodePs } = useAuthStore.getState();

      if (!user || !userCodePs) {
        throw new Error('Informations utilisateur manquantes. Veuillez vous reconnecter.');
      }

      // Essayer plusieurs approches pour obtenir un token valide
      console.log('[ChatInput] Attempting to get a valid token...');

      // 1. Essayer d'abord avec le client Supabase
      const supabase = createSupabaseBrowserClient();
      const { data: sessionData } = await supabase.auth.getSession();
      let authToken = sessionData?.session?.access_token;

      // 2. Si pas de token via Supabase, essayer le localStorage
      if (!authToken) {
        console.log('[ChatInput] No token from Supabase, trying localStorage...');

        // Liste des clés possibles pour les tokens Supabase
        const possibleKeys = [
          'sb-ddeibfjxpwnisguehnmo-auth-token',
          'supabase.auth.token'
        ];

        for (const key of possibleKeys) {
          const accessToken = localStorage.getItem(key) || sessionStorage.getItem(key);
          if (accessToken) {
            try {
              const tokenData = JSON.parse(accessToken);
              if (tokenData.access_token) {
                authToken = tokenData.access_token;
                console.log('[ChatInput] Found token in storage with key:', key);
                break;
              }
            } catch (e) {
              console.error(`[ChatInput] Failed to parse token from ${key}:`, e);
            }
          }
        }
      }

      let apiResult;

      if (authToken) {
        // Faire l'appel API directement avec le token
        console.log('[ChatInput] Using direct token approach...');
        apiResult = await makeApiCall(authToken, userMessageContent, user.id, userCodePs, currentConversationId);
      } else {
        // Fallback: utiliser callWithAuth
        console.log('[ChatInput] No direct token found, using callWithAuth...');
        apiResult = await callWithAuth(async (session) => {
          if (!session || !session.access_token) {
            throw new Error('No valid session available');
          }
          return await makeApiCall(session.access_token, userMessageContent, user.id, userCodePs, currentConversationId);
        });
      }

      console.log('[ChatInput] API call successful:', apiResult);

      addMessage({
        role: 'assistant',
        content: apiResult.response,
        sqlResults: apiResult.sqlResults || null,
      });

      if (apiResult.conversationId && apiResult.conversationId !== currentConversationId) {
        setCurrentConversationId(apiResult.conversationId);
      }

      if (apiResult.historySaveError) {
        toast.error(apiResult.historySaveError);
      }

    } catch (e: any) {
      console.error('[ChatInput] Error sending message:', e);

      let errorMessage = e.message || 'Une erreur est survenue lors de l\'envoi du message.';

      if (e.status === 401) {
        errorMessage = 'Session expirée. Veuillez vous reconnecter.';
      } else if (e.status === 403) {
        errorMessage = 'Accès refusé. Vérifiez vos permissions.';
      } else if (e.status === 500) {
        errorMessage = 'Erreur du serveur. Veuillez réessayer dans quelques instants.';
      }

      setError(errorMessage);
      toast.error(errorMessage);
      addMessage({ role: 'error', content: errorMessage });
    } finally {
      setLoading(false);
      setIsComponentLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-background p-4 border-t border-border shadow-sm"
    >
      <div className="flex items-center space-x-3">
        <Input
          type="text"
          placeholder={placeholderText()}
          value={currentQuery}
          onChange={(e) => setCurrentQuery(e.target.value)}
          disabled={!canSendMessage || isComponentLoading}
          className="flex-1 h-12 px-4 rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500"
        />
        <Button
          type="submit"
          disabled={!canSendMessage || !currentQuery.trim() || isComponentLoading}
          className="h-12 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
        >
          {isComponentLoading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          ) : (
            <SendHorizonal className="w-5 h-5" />
          )}
          <span className="sr-only">Envoyer</span>
        </Button>
      </div>
      {!canSendMessage && (
        <p className="text-xs text-red-500 mt-1 text-center">
          {placeholderText()}
        </p>
      )}
    </form>
  );
}