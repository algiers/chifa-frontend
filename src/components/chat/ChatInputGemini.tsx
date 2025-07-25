'use client';

import React, { useState, FormEvent, useRef, useEffect } from 'react';
import { Send, Paperclip, Mic, Square } from 'lucide-react';
import { useChatStore } from '../../stores/chatStore';
import { useAuthStore } from '../../stores/authStore';
import { useSupabaseAuth } from '../../hooks/useSupabaseAuth';
import { toast } from 'sonner';
import { createSupabaseBrowserClient } from '../../lib/supabase/client';

export default function ChatInputGemini() {
  const {
    currentQuery,
    setCurrentQuery,
    addMessage,
    updateMessageById,
    setLoading,
    setError,
    currentConversationId,
    setCurrentConversationId,
    getUUID,
    isLoading
  } = useChatStore();

  // Configuration du modèle - version simplifiée pour debug
  const model = process.env.NEXT_PUBLIC_DEFAULT_MODEL || 'deepseek-chat';
  const temperature = 0.7;
  const maxTokens = 2000;
  const supportsStreaming = false;

  const { callWithAuth } = useSupabaseAuth();

  const {
    pharmacyStatus,
    demoCreditsRemaining,
    codePs,
  } = useAuthStore();

  const [isComponentLoading, setIsComponentLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
    }
  }, [currentQuery]);

  // Nettoyage du contrôleur d'abandon
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

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
    return 'Posez votre question à Chifa Assistant...';
  };

  // Fonction helper pour faire l'appel API
  const makeApiCall = async (token: string, userMessage: string, userId: string, pharmacyId: string, conversationId: string | null) => {
    const apiUrl = '/api/chat/send-message';

    // Format temporaire pour compatibilité
    const requestBody = {
      query: userMessage,
      userId: userId,
      codePs: pharmacyId,
      conversationId: conversationId,
      model: model,
      temperature: temperature,
      max_tokens: maxTokens,
      stream: supportsStreaming
    };

    console.log('[ChatInputGemini] Calling Next.js API:', apiUrl);

    abortControllerRef.current = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log('[ChatInputGemini] Request timeout, aborting...');
      abortControllerRef.current?.abort();
    }, 60000);

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: abortControllerRef.current.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[ChatInputGemini] API response error:', response.status, errorText);

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

      if (!result || result.error) {
        console.error('[ChatInputGemini] API returned an error:', result?.error);
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
    if (!currentQuery.trim() || !canSendMessage || isComponentLoading || isLoading) return;

    const userMessageContent = currentQuery.trim();
    addMessage({ role: 'user', content: userMessageContent });
    setCurrentQuery('');

    setLoading(true);
    setIsComponentLoading(true);
    setError(null);

    try {
      if (!codePs) {
        throw new Error("Code PS non disponible. Impossible d'envoyer le message.");
      }

      const { user, codePs: userCodePs } = useAuthStore.getState();

      if (!user || !userCodePs) {
        throw new Error('Informations utilisateur manquantes. Veuillez vous reconnecter.');
      }

      const supabase = createSupabaseBrowserClient();
      const { data: sessionData } = await supabase.auth.getSession();
      let authToken = sessionData?.session?.access_token;

      if (!authToken) {
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
                break;
              }
            } catch (e) {
              console.error(`[ChatInputGemini] Failed to parse token from ${key}:`, e);
            }
          }
        }
      }

      let apiResult;

      if (authToken) {
        apiResult = await makeApiCall(authToken, userMessageContent, user.id, userCodePs, currentConversationId);
      } else {
        apiResult = await callWithAuth(async (session) => {
          if (!session || !session.access_token) {
            throw new Error('No valid session available');
          }
          return await makeApiCall(session.access_token, userMessageContent, user.id, userCodePs, currentConversationId);
        });
      }

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
      console.error('[ChatInputGemini] Error sending message:', e);

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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (currentQuery.trim() && canSendMessage && !isComponentLoading && !isLoading) {
        handleSubmit(e as any);
      }
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setLoading(false);
    setIsComponentLoading(false);
  };

  return (
    <div className="p-6 border-t border-gray-200 dark:border-gray-800">
      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit}>
          <div className="relative bg-gray-100 dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700">
            
            <textarea
              ref={textareaRef}
              value={currentQuery}
              onChange={(e) => setCurrentQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholderText()}
              disabled={!canSendMessage || isComponentLoading || isLoading}
              className="min-h-[60px] resize-none border-0 bg-transparent px-6 py-4 pr-20 text-base placeholder:text-gray-500 dark:placeholder:text-gray-400 focus-visible:ring-0 focus-visible:outline-none text-gray-900 dark:text-gray-100 w-full"
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
            />

            {/* Action Buttons - Style Gemini */}
            <div className="absolute bottom-3 left-4 flex items-center gap-1">
              <button
                type="button"
                className="h-8 w-8 rounded-full hover:bg-white dark:hover:bg-gray-700 flex items-center justify-center text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                disabled={!canSendMessage}
              >
                <Paperclip className="h-4 w-4" />
              </button>

              <button
                type="button"
                className="h-8 px-3 rounded-full hover:bg-white dark:hover:bg-gray-700 gap-1 flex items-center text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors text-sm"
                disabled={!canSendMessage}
              >
                <Square className="h-4 w-4" />
                <span>Analyse</span>
              </button>
            </div>

            {/* Submit Button - Style Gemini */}
            <div className="absolute bottom-3 right-4 flex items-center gap-2">
              <button
                type="button"
                className="h-8 w-8 rounded-full hover:bg-white dark:hover:bg-gray-700 flex items-center justify-center text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                disabled={!canSendMessage}
              >
                <Mic className="h-4 w-4" />
              </button>

              {currentQuery.trim() && (
                <button
                  type="submit"
                  disabled={!canSendMessage || isComponentLoading || isLoading}
                  className="h-8 w-8 rounded-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white flex items-center justify-center transition-colors"
                >
                  {isComponentLoading || isLoading ? (
                    <Square className="h-4 w-4" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </button>
              )}
            </div>
          </div>
        </form>

        {/* Message d'état */}
        {!canSendMessage && (
          <p className="text-xs text-red-500 mt-3 text-center">
            {placeholderText()}
          </p>
        )}
      </div>
    </div>
  );
}