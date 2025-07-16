'use client';

import React, { useEffect, useRef } from 'react';
import { useChatStore } from '@/stores/chatStore';
import MessageItem from './MessageItem';
import { MessageSquare, Sparkles } from 'lucide-react';

export default function MessageList() {
  const { messages, isLoading } = useChatStore();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Empty state when no messages
  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <MessageSquare className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-2xl font-semibold text-foreground mb-3">
            Analytics CHIFA
          </h2>
          <p className="text-muted-foreground mb-6">
            Analysez CA, rotation, assurés par régime. 
            Requêtes naturelles sur base CHIFA_OFFICINE.
          </p>
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 justify-center">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>CA CNAS avril dernier</span>
            </div>
            <div className="flex items-center gap-2 justify-center">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>Top produits rotation T1</span>
            </div>
            <div className="flex items-center gap-2 justify-center">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>Historique DCI CASNOS juin</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto chat-scroll">
      <div className="container mx-auto max-w-4xl px-4 py-6">
        <div className="space-y-6">
          {messages.map((msg) => (
            <div key={msg.id} className="message-enter">
              <MessageItem message={msg} />
            </div>
          ))}
          {isLoading && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
            <div className="flex justify-start message-enter">
              <div className="flex items-start space-x-3 max-w-[85%]">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="h-4 w-4 text-primary" />
                </div>
                <div className="bg-muted rounded-2xl px-4 py-3 max-w-none">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
    </div>
  );
}
