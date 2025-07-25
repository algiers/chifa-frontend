'use client';

import React, { useState, FormEvent } from 'react';
import { useChatStore } from '@/stores/chatStore';
import { useAuthStore } from '@/stores/authStore';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SendHorizonal } from 'lucide-react';
import { toast } from 'sonner';

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
      return "Complétez profil pharmacie";
    }
    if (pharmacyStatus === 'pending_payment_approval') {
      return "Attente validation paiement";
    }
    if (pharmacyStatus === 'demo_credits_exhausted') {
      return "Crédits épuisés - Choisir plan";
    }
    if (!canSendMessage) {
      return "Analytics indisponible";
    }
    return 'Posez votre question en langage naturel... (ex: Rotation de Paracétamol)';
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

            // Solution de contournement : utiliser l'API route Next.js au lieu de l'Edge Function
      console.log('[ChatInput] Using Next.js API route instead of Edge Function...');
      
      // Récupérer les informations utilisateur depuis le store
      const { user, codePs: userCodePs } = useAuthStore.getState();
      
      if (!user || !userCodePs) {
        throw new Error('Informations utilisateur manquantes. Veuillez vous reconnecter.');
      }
      
      console.log('[ChatInput] User info from store:', { userId: user.id, codePs: userCodePs });
      
      // Appeler l'API route Next.js qui peut utiliser le service role key
      const apiUrl = '/api/chat/send-message';
      
      console.log('[ChatInput] Calling Next.js API:', apiUrl);
      console.log('[ChatInput] Request payload:', {
        query: userMessageContent.substring(0, 50) + '...',
        userId: user.id,
        codePs: userCodePs,
        conversationId: currentConversationId,
      });
      
      // Ajouter un timeout de 60 secondes
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log('[ChatInput] Request timeout, aborting...');
        controller.abort();
      }, 60000); // 60 secondes

      let response: Response;
      try {
        response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: userMessageContent,
            userId: user.id,
            codePs: userCodePs,
            conversationId: currentConversationId,
          }),
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
      } catch (error: any) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
          throw new Error('La requête a pris trop de temps (timeout de 60 secondes)');
        }
        throw error;
      }

      console.log('[ChatInput] API response status:', response.status);
      console.log('[ChatInput] API response headers:', Object.fromEntries(response.headers.entries()));

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
        
        // Si c'est une erreur 401, le token est probablement expiré
        if (response.status === 401) {
          errorMessage = 'Token d\'authentification expiré. Veuillez actualiser la page.';
        }
        
        const error = new Error(errorMessage);
        (error as any).status = response.status;
        throw error;
      }

      console.log('[ChatInput] Reading response JSON...');
      const result = await response.json();
      console.log('[ChatInput] Response received:', {
        hasResponse: !!result.response,
        responseLength: result.response?.length || 0,
        hasError: !!result.error
      });

      console.log('[ChatInput] API call successful:', result);

      if (!result || result.error) {
        console.error('[ChatInput] Edge function returned an error:', result?.error);
        throw new Error(result?.error || 'Erreur retournée par l\'agent Chifa.');
      }
      
      addMessage({ 
        role: 'assistant', 
        content: result.response,
        sqlResults: result.sqlResults || null,
      });

      if (result.conversationId && result.conversationId !== currentConversationId) {
        setCurrentConversationId(result.conversationId);
      }
      
      if (result.historySaveError) {
        toast.error(result.historySaveError);
      }

    } catch (e: any) {
      console.error('[ChatInput] Error sending message:', e);
      
      let errorMessage = e.message || 'Une erreur est survenue lors de l\'envoi du message.';
      
      // Messages d'erreur plus spécifiques
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
    <div className="bg-white border-t border-gray-200">
      <div className="max-w-4xl mx-auto px-6 py-6">
        <form onSubmit={handleSubmit} className="relative">
          <div className="relative flex items-end bg-white border border-gray-300 rounded-2xl shadow-sm chat-input-focus focus-within:ring-2 focus-within:ring-chatgpt-accent focus-within:border-chatgpt-accent transition-all duration-200">
            <textarea
              placeholder={placeholderText()}
              value={currentQuery}
              onChange={(e) => {
                setCurrentQuery(e.target.value);
                // Auto-resize
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = Math.min(target.scrollHeight, 200) + 'px';
              }}
              disabled={!canSendMessage || isComponentLoading}
              rows={1}
              className="flex-1 resize-none bg-transparent px-5 py-4 text-base text-gray-900 placeholder:text-gray-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 max-h-48 min-h-[56px] transition-all duration-200"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (currentQuery.trim() && canSendMessage && !isComponentLoading) {
                    handleSubmit(e as any);
                  }
                }
              }}
              style={{
                height: 'auto',
                minHeight: '56px',
              }}
            />
            <div className="flex items-center p-2">
              <Button 
                type="submit" 
                size="sm"
                disabled={!canSendMessage || !currentQuery.trim() || isComponentLoading}
                className="h-10 w-10 p-0 rounded-xl bg-chatgpt-accent hover:bg-chatgpt-accent-hover disabled:opacity-30 disabled:hover:bg-chatgpt-accent text-white transition-all duration-200 shadow-sm chatgpt-hover"
              >
                {isComponentLoading ? (
                  <div className="loading-dots text-white">
                    <div></div>
                    <div></div>
                    <div></div>
                  </div>
                ) : (
                  <SendHorizonal className="w-5 h-5" />
                )}
                <span className="sr-only">Envoyer</span>
              </Button>
            </div>
          </div>
          
          {!canSendMessage && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-700 text-center font-medium">
                {placeholderText()}
              </p>
            </div>
          )}
          
          <div className="flex items-center justify-center mt-3 text-xs text-gray-500">
            <span>Appuyez sur <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs font-mono">Entrée</kbd> pour envoyer • <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs font-mono">Maj+Entrée</kbd> pour une nouvelle ligne</span>
          </div>
        </form>
      </div>
    </div>
  );
}
