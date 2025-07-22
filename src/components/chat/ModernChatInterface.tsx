'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useChatStore } from '@/stores/chatStore';
import { useAuthStore } from '@/stores/authStore';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Bot, User, Send, StopCircle, RotateCcw, Plus } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ModernChatInterfaceProps {
  className?: string;
  currentConversationId?: string | null;
  onNewChat?: () => void;
}

export default function ModernChatInterface({ className }: ModernChatInterfaceProps) {
  const {
    messages,
    currentQuery,
    setCurrentQuery,
    addMessage,
    setLoading,
    setError,
    isLoading,
    currentConversationId,
    setCurrentConversationId,
    clearChat
  } = useChatStore();

  const { callWithAuth } = useSupabaseAuth();
  const { pharmacyStatus, demoCreditsRemaining, codePs } = useAuthStore();
  const [isComponentLoading, setIsComponentLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const canSendMessage =
    (pharmacyStatus === 'active') ||
    (pharmacyStatus === 'active_demo' && demoCreditsRemaining > 0);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const makeApiCall = async (token: string, query: string, userId: string, codePs: string, conversationId: string | null) => {
    const apiUrl = '/api/chat/send-message';

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

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

      if (!response.ok) {
        const errorText = await response.text();
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentQuery.trim() || !canSendMessage || isComponentLoading || isLoading) return;

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

      const { user, codePs: userCodePs } = useAuthStore.getState();

      if (!user || !userCodePs) {
        throw new Error('Informations utilisateur manquantes. Veuillez vous reconnecter.');
      }

      const accessToken = localStorage.getItem('sb-ddeibfjxpwnisguehnmo-auth-token') ||
        sessionStorage.getItem('sb-ddeibfjxpwnisguehnmo-auth-token');

      let authToken = null;
      if (accessToken) {
        try {
          const tokenData = JSON.parse(accessToken);
          authToken = tokenData.access_token;
        } catch (e) {
          console.error('Failed to parse token:', e);
        }
      }

      let apiResult;

      if (authToken) {
        apiResult = await makeApiCall(authToken, userMessageContent, user.id, userCodePs, currentConversationId);
      } else {
        apiResult = await callWithAuth(async (session) => {
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
      console.error('Error sending message:', e);
      
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

  const handleNewChat = () => {
    clearChat();
    setCurrentConversationId(null);
    inputRef.current?.focus();
  };

  const getPlaceholderText = () => {
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
    return 'Posez votre question en langage naturel...';
  };

  return (
    <div className={cn("flex flex-col h-full bg-background", className)}>
      {/* Messages - zone scrollable */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <Bot className="w-16 h-16 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Bienvenue sur Chifa.ai</h2>
            <p className="text-muted-foreground max-w-md">
              Je suis votre assistant intelligent pour gérer votre pharmacie. 
              Posez-moi des questions sur votre stock, vos ventes, ou toute autre information.
            </p>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
            {messages.map((message, index) => (
              <div
                key={message.id || index}
                className={cn(
                  "flex gap-4",
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {message.role !== 'user' && (
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      <Bot className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-2",
                  message.role === 'user' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted'
                )}>
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                      code: ({ children }) => (
                        <code className="bg-muted-foreground/10 px-1 py-0.5 rounded text-sm">
                          {children}
                        </code>
                      ),
                      pre: ({ children }) => (
                        <pre className="bg-muted-foreground/10 p-3 rounded-lg overflow-x-auto">
                          {children}
                        </pre>
                      ),
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>

                {message.role === 'user' && (
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-secondary">
                      <User className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="flex gap-4">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    <Bot className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-muted rounded-2xl px-4 py-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input - toujours visible en bas */}
      <div className="border-t border-border p-4 bg-background">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSubmit} className="relative">
            <Input
              ref={inputRef}
              type="text"
              placeholder={getPlaceholderText()}
              value={currentQuery}
              onChange={(e) => setCurrentQuery(e.target.value)}
              disabled={!canSendMessage || isComponentLoading || isLoading}
              className="pr-12 h-12 rounded-full bg-muted"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!canSendMessage || !currentQuery.trim() || isComponentLoading || isLoading}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full"
            >
              {isLoading ? (
                <StopCircle className="w-4 h-4" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </form>
          <p className="text-xs text-center text-muted-foreground mt-2">
            Chifa.ai peut faire des erreurs. Vérifiez les informations importantes.
          </p>
        </div>
      </div>
    </div>
  );
}
