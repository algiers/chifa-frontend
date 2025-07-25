'use client';

import React, { useEffect, useRef } from 'react';
import MessageItem from './MessageItem';
import { useChatStore } from '../../stores/chatStore';
import { Skeleton } from '../ui/skeleton'; // À ajouter via shadcn

export default function MessageList() {
  const { messages, isLoading } = useChatStore();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]); // Défiler quand de nouveaux messages arrivent ou quand le chargement change

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background rounded-t-lg">
      {messages.map((msg) => (
        <MessageItem key={msg.id} message={msg} />
      ))}
      {isLoading && messages.length > 0 && messages[messages.length -1].role === 'user' && (
        // Afficher un skeleton seulement si le dernier message est de l'utilisateur et qu'on attend une réponse
        <div className="flex my-3 justify-start">
          <div className="flex items-start space-x-3 max-w-[85%] sm:max-w-[75%]">
            <Skeleton className="w-8 h-8 rounded-full bg-muted" />
            <div className="p-3 rounded-lg shadow-sm bg-card w-48">
              <Skeleton className="h-4 w-3/4 bg-muted mb-2" />
              <Skeleton className="h-4 w-1/2 bg-muted" />
            </div>
          </div>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}
