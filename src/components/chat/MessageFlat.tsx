'use client';

import React, { useState, useEffect } from 'react';
import { User, Bot, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useAdminMode } from '@/hooks/useAdminMode';
import type { ChatMessage } from '@/stores/chatStore';

interface MessageFlatProps {
  message: ChatMessage;
  isStreaming?: boolean;
}

export default function MessageFlat({ message, isStreaming = false }: MessageFlatProps) {
  const [displayedContent, setDisplayedContent] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const { showSqlDebug } = useAdminMode();

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
      }, 20);

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
    <div className={`group w-full py-6 px-4 ${
      isUser 
        ? 'bg-gray-50 dark:bg-gray-800/50' 
        : isError 
          ? 'bg-red-50 dark:bg-red-900/10'
          : 'bg-white dark:bg-gray-900'
    } border-b border-gray-100 dark:border-gray-800 transition-colors`}>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
            isUser 
              ? 'bg-blue-600 text-white' 
              : isError 
                ? 'bg-red-600 text-white'
                : 'bg-green-600 text-white'
          }`}>
            {isUser ? (
              <User className="w-4 h-4" />
            ) : (
              <Bot className="w-4 h-4" />
            )}
          </div>

          {/* Contenu */}
          <div className="flex-1 min-w-0">
            {/* Nom/Rôle */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {isUser ? 'Vous' : isError ? 'Erreur' : 'Chifa Assistant'}
              </span>
              {!isUser && !isError && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={copyToClipboard}
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  title="Copier la réponse"
                >
                  {copied ? (
                    <Check className="h-3 w-3 text-green-500" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              )}
            </div>

            {/* Message */}
            <div className={`prose prose-sm max-w-none ${
              isUser 
                ? 'text-gray-900 dark:text-gray-100' 
                : isError
                  ? 'text-red-800 dark:text-red-200'
                  : 'text-gray-800 dark:text-gray-200'
            }`}>
              <div className="whitespace-pre-wrap leading-relaxed">
                {displayedContent}
                {isTyping && (
                  <span className="inline-block w-2 h-4 bg-current opacity-75 typing-indicator ml-1 rounded-sm" />
                )}
              </div>
            </div>

            {/* Affichage des résultats SQL si disponibles (admins seulement) */}
            {message.sqlResults && showSqlDebug && (
              <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-2 font-medium">Debug SQL :</div>
                <pre className="sql-results text-gray-800 dark:text-gray-200 overflow-x-auto text-xs">
                  {JSON.stringify(message.sqlResults, null, 2)}
                </pre>
              </div>
            )}

            {/* Timestamp */}
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
              {message.timestamp.toLocaleTimeString('fr-FR', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}