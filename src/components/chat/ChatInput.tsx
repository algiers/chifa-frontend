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
    return 'CA CHIFA T1 2025';
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
    <div className="p-4">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-end bg-background border border-input rounded-2xl shadow-sm focus-within:ring-2 focus-within:ring-ring focus-within:border-transparent">
          <textarea
            placeholder={placeholderText()}
            value={currentQuery}
            onChange={(e) => {
              setCurrentQuery(e.target.value);
              // Auto-resize
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = Math.min(target.scrollHeight, 128) + 'px';
            }}
            disabled={!canSendMessage || isComponentLoading}
            rows={1}
            className="flex-1 resize-none bg-transparent px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 max-h-32 min-h-[44px] transition-all duration-200"
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
              minHeight: '44px',
            }}
          />
          <div className="flex items-center p-2">
            <Button 
              type="submit" 
              size="sm"
              disabled={!canSendMessage || !currentQuery.trim() || isComponentLoading}
              className="h-8 w-8 p-0 rounded-full bg-primary hover:bg-primary/90 disabled:opacity-50"
            >
              {isComponentLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent"></div>
              ) : (
                <SendHorizonal className="w-4 h-4" />
              )}
              <span className="sr-only">Envoyer</span>
            </Button>
          </div>
        </div>
        
        {!canSendMessage && (
          <p className="text-xs text-destructive mt-2 text-center">
            {placeholderText()}
          </p>
        )}
        
        <div className="flex items-center justify-center mt-2 text-xs text-muted-foreground">
          <span>Entrée = Envoyer • Maj+Entrée = Nouvelle ligne</span>
        </div>
      </form>
    </div>
  );
}
