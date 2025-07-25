'use client';

import React, { useState, FormEvent, useRef, useEffect } from 'react';
import { Send, Paperclip, Mic } from 'lucide-react';
import { useChatStore } from '../../stores/chatStore';
import { useAuthStore } from '../../stores/authStore';
import { useSupabaseAuth } from '../../hooks/useSupabaseAuth';
import { toast } from 'sonner';
import { createSupabaseBrowserClient } from '../../lib/supabase/client';
// Configuration des modèles temporairement simplifiée pour debug

export default function ChatInputV2() {
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
  // Désactiver temporairement le streaming pour debug
  const supportsStreaming = false;

  const { callWithAuth } = useSupabaseAuth();

  const {
    pharmacyStatus,
    demoCreditsRemaining,
    codePs,
  } = useAuthStore();

  const [isComponentLoading, setIsComponentLoading] = useState(false);
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

  // Nettoyage du contrôleur d'abandon lors du démontage du composant
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
    return 'Posez votre question...';
  };

  // Fonction pour gérer le streaming de la réponse (Server-Sent Events)
  const handleStreamResponse = async (response: Response, tempMessageId: string) => {
    if (!response.body) {
      throw new Error('Response body is null');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let responseText = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        
        // Traiter les Server-Sent Events
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6); // Enlever 'data: '
            
            if (data === '[DONE]') {
              // Fin du stream
              break;
            }
            
            try {
              const jsonData = JSON.parse(data);
              
              // Extraire le contenu selon le format
              if (jsonData.response) {
                responseText = jsonData.response;
              } else if (jsonData.content) {
                responseText += jsonData.content;
              } else if (jsonData.choices && jsonData.choices[0]?.delta?.content) {
                responseText += jsonData.choices[0].delta.content;
              } else if (typeof jsonData === 'string') {
                responseText += jsonData;
              }
              
              // Mettre à jour le message en temps réel
              updateMessageById(tempMessageId, { 
                content: responseText 
              });
              
            } catch (parseError) {
              // Si ce n'est pas du JSON valide, traiter comme du texte
              if (data.trim() && data !== '') {
                responseText += data;
                updateMessageById(tempMessageId, { 
                  content: responseText 
                });
              }
            }
          }
        }
      }

      return responseText;
    } catch (error) {
      console.error('[ChatInputV2] Streaming error:', error);
      throw error;
    }
  };

  // Fonction helper pour faire l'appel API avec le nouveau format
  const makeApiCall = async (token: string, userMessage: string, userId: string, pharmacyId: string, conversationId: string | null) => {
    const apiUrl = '/api/chat/send-message';

    // Format temporaire pour compatibilité (sera upgradé ensuite)
    const requestBody = {
      query: userMessage,
      userId: userId,
      codePs: pharmacyId,
      conversationId: conversationId,
      // Nouveaux paramètres pour la configuration des modèles
      model: model,
      temperature: temperature,
      max_tokens: maxTokens,
      stream: supportsStreaming
    };

    console.log('[ChatInputV2] Calling Next.js API:', apiUrl);

    // Créer un nouveau contrôleur d'abandon
    abortControllerRef.current = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log('[ChatInputV2] Request timeout, aborting...');
      abortControllerRef.current?.abort();
    }, 60000);

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': requestBody.stream ? 'text/event-stream' : 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: abortControllerRef.current.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[ChatInputV2] API response error:', response.status, errorText);

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

      // Traitement de la réponse (format ancien temporaire)
      const result = await response.json();

      if (!result || result.error) {
        console.error('[ChatInputV2] API returned an error:', result?.error);
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

      // Récupérer les informations utilisateur depuis le store
      const { user, codePs: userCodePs } = useAuthStore.getState();

      if (!user || !userCodePs) {
        throw new Error('Informations utilisateur manquantes. Veuillez vous reconnecter.');
      }

      // Essayer plusieurs approches pour obtenir un token valide
      const supabase = createSupabaseBrowserClient();
      const { data: sessionData } = await supabase.auth.getSession();
      let authToken = sessionData?.session?.access_token;

      // Si pas de token via Supabase, essayer le localStorage
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
              console.error(`[ChatInputV2] Failed to parse token from ${key}:`, e);
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

      // Ajouter la réponse de l'assistant
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
      console.error('[ChatInputV2] Error sending message:', e);

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
    // Raccourci clavier pour effacer le chat (Ctrl/Cmd + K)
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      const { clearChat } = useChatStore.getState();
      clearChat();
    }
  };

  return (
    <div className="sticky bottom-0 bg-white/95 dark:bg-gray-900/95 glass-effect border-t border-gray-200 dark:border-gray-700 p-4 shadow-lg">
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
        <div className="relative flex items-end gap-3 bg-white/90 dark:bg-gray-800/90 glass-effect rounded-2xl p-3 border border-gray-200/50 dark:border-gray-600/50 chat-input shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-white/95 dark:hover:bg-gray-800/95">
          {/* Bouton d'attachement */}
          <button
            type="button"
            className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 focus-visible:focus"
            disabled={!canSendMessage}
            title="Joindre un fichier"
          >
            <Paperclip className="w-5 h-5" />
          </button>

          {/* Zone de texte */}
          <textarea
            ref={textareaRef}
            value={currentQuery}
            onChange={(e) => setCurrentQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholderText()}
            disabled={!canSendMessage || isComponentLoading || isLoading}
            className="flex-1 bg-transparent border-none outline-none resize-none text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 min-h-[24px] max-h-[200px] py-2 px-1 text-readable focus:placeholder-gray-400 dark:focus:placeholder-gray-500"
            rows={1}
          />

          {/* Boutons d'action */}
          <div className="flex items-center gap-2">
            {/* Bouton micro */}
            <button
              type="button"
              className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 focus-visible:focus"
              disabled={!canSendMessage}
              title="Enregistrement vocal"
            >
              <Mic className="w-5 h-5" />
            </button>

            {/* Bouton d'envoi */}
            <button
              type="submit"
              disabled={!canSendMessage || !currentQuery.trim() || isComponentLoading || isLoading}
              className="flex-shrink-0 p-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-300 dark:disabled:from-gray-600 dark:disabled:to-gray-600 text-white rounded-lg disabled:cursor-not-allowed send-button shadow-sm hover:shadow-md transition-all duration-200 focus-visible:focus"
              title={isComponentLoading || isLoading ? "Envoi en cours..." : "Envoyer le message"}
            >
              {isComponentLoading || isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full loading-spinner" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Message d'état */}
        {!canSendMessage && (
          <p className="text-xs text-red-500 mt-2 text-center">
            {placeholderText()}
          </p>
        )}
      </form>
    </div>
  );
}