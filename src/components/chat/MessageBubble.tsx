'use client';

import React, { useState, useEffect } from 'react';
import { User, Bot, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import type { ChatMessage } from '@/stores/chatStore';

interface MessageBubbleProps {
  message: ChatMessage;
  isStreaming?: boolean;
}

export default function MessageBubble({ message, isStreaming = false }: MessageBubbleProps) {
  const [displayedContent, setDisplayedContent] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copied, setCopied] = useState(false);

  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';
  const isError = message.role === 'error';

  // Animation de typing pour les messages de l'assistant
  useEffect(() => {
    if (isAssistant && message.content && !isStreaming) {
      setIsTyping(true);
      setDisplayedContent('');
      
      let currentIndex = 0;
      const content = message.content;
      
      const typeInterval = setInterval(() => {
        if (currentIndex < content.length) {
          setDisplayedContent(content.slice(0, currentIndex + 1));
          currentIndex++;
        } else {
          setIsTyping(false);
          clearInterval(typeInterval);
        }
      }, 20); // Vitesse de typing

      return () => clearInterval(typeInterval);
    } else {
      setDisplayedContent(message.content);
      setIsTyping(false);
    }
  }, [message.content, isAssistant, isStreaming]);

  // Pour le streaming en temps réel, afficher directement le contenu
  useEffect(() => {
    if (isStreaming) {
      setDisplayedContent(message.content);
      setIsTyping(message.content === '');
    }
  }, [message.content, isStreaming]);

  // Fonction pour copier le contenu du message
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      toast.success('Message copié dans le presse-papiers');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Erreur lors de la copie');
    }
  };

  return (
    <div className={`flex w-full mb-4 ${isUser ? 'justify-end' : 'justify-start'} message-bubble`}>
      <div className={`flex max-w-[85%] md:max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start gap-3`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm ${
          isUser 
            ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white' 
            : isError 
              ? 'bg-gradient-to-br from-red-500 to-red-600 text-white'
              : 'bg-gradient-to-br from-green-500 to-green-600 text-white'
        }`}>
          {isUser ? (
            <User className="w-4 h-4" />
          ) : (
            <Bot className="w-4 h-4" />
          )}
        </div>

        {/* Message bubble */}
        <div className={`relative group px-4 py-3 rounded-2xl shadow-sm hover-lift transition-all duration-200 ${
          isUser
            ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-br-md'
            : isError
              ? 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-bl-md border border-red-200 dark:border-red-800'
              : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-md border border-gray-200 dark:border-gray-700'
        }`}>
          {/* Bouton de copie (visible au hover) */}
          {!isUser && !isError && (
            <Button
              variant="ghost"
              size="icon"
              onClick={copyToClipboard}
              className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity bg-white/10 hover:bg-white/20 dark:bg-black/10 dark:hover:bg-black/20"
            >
              {copied ? (
                <Check className="h-3 w-3 text-green-500" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
          )}
          {/* Contenu du message */}
          <div className="text-sm leading-relaxed whitespace-pre-wrap text-readable">
            {displayedContent}
            {isTyping && (
              <span className="inline-block w-2 h-4 bg-current opacity-75 typing-indicator ml-1 rounded-sm" />
            )}
          </div>

          {/* Affichage des résultats SQL si disponibles (admins seulement) */}
          {message.sqlResults && process.env.NEXT_PUBLIC_SHOW_SQL_DEBUG === 'true' && (
            <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border">
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">Résultats SQL :</div>
              <pre className="sql-results text-gray-800 dark:text-gray-200 overflow-x-auto">
                {JSON.stringify(message.sqlResults, null, 2)}
              </pre>
            </div>
          )}

          {/* Timestamp */}
          <div className={`text-xs mt-2 opacity-70 font-medium ${
            isUser ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
          }`}>
            {message.timestamp.toLocaleTimeString('fr-FR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </div>
        </div>
      </div>
    </div>
  );
}