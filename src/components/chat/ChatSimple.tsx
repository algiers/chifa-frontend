'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useChatStore } from '@/stores/chatStore';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bot, User, Send } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ChatSimple() {
  const {
    messages,
    currentQuery,
    setCurrentQuery,
    addMessage,
    setLoading,
    setError,
    isLoading,
  } = useChatStore();

  const { pharmacyStatus, demoCreditsRemaining, codePs } = useAuthStore();
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentQuery.trim() || !canSendMessage || isLoading) return;

    const userMessageContent = currentQuery;
    addMessage({ role: 'user', content: userMessageContent });
    setCurrentQuery('');
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/chat/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: userMessageContent,
          codePs: codePs || 'demo',
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'appel à l\'API');
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      addMessage({
        role: 'assistant',
        content: data.response,
        sqlResults: data.sqlResults || null,
      });

    } catch (error: any) {
      console.error('Error sending message:', error);
      setError(error.message || 'Une erreur est survenue');
      addMessage({ role: 'error', content: error.message || 'Une erreur est survenue' });
    } finally {
      setLoading(false);
    }
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
    <div className="flex flex-col h-full bg-background">
      {/* Messages */}
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
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                    <Bot className="w-4 h-4" />
                  </div>
                )}
                
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-2",
                    message.role === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted'
                  )}
                >
                  <div className="whitespace-pre-wrap">{message.content}</div>
                </div>

                {message.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="flex gap-4 justify-start">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                  <Bot className="w-4 h-4" />
                </div>
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

      {/* Input */}
      <div className="border-t border-border p-4 bg-background">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSubmit} className="relative">
            <Input
              ref={inputRef}
              type="text"
              placeholder={getPlaceholderText()}
              value={currentQuery}
              onChange={(e) => setCurrentQuery(e.target.value)}
              disabled={!canSendMessage || isLoading}
              className="pr-12 h-12 rounded-full bg-muted"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!canSendMessage || !currentQuery.trim() || isLoading}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
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