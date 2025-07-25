'use client';

import React, { useState, useEffect } from 'react';
import { User, Sparkles, Copy, Check, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useAdminMode } from '@/hooks/useAdminMode';
import type { ChatMessage } from '@/stores/chatStore';

interface MessageGeminiProps {
  message: ChatMessage;
  isStreaming?: boolean;
}

export default function MessageGemini({ message, isStreaming = false }: MessageGeminiProps) {
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
      }, 15); // Plus rapide pour un effet plus fluide

      return () => clearInterval(typeInterval);
    } else {
      setDisplayedContent(message.content);
      setIsTyping(false);
    }
  }, [message.content, isAssistant, isStreaming]);

  // Pour le streaming en temps réel
  useEffect(() => {
    if (isStreaming) {
      setDisplayedContent(message.content);
      setIsTyping(message.content === '');
    }
  }, [message.content, isStreaming]);

  // Fonction pour copier le contenu
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      toast.success('Réponse copiée');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Erreur lors de la copie');
    }
  };

  return (
    <div className={`group relative w-full transition-colors duration-200 ${
      isUser 
        ? 'bg-transparent' 
        : isError 
          ? 'bg-red-50/50 dark:bg-red-950/20'
          : 'bg-gray-50 dark:bg-gray-900'
    }`}>
      <div className="max-w-4xl mx-auto px-6 py-6">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-sm ${
            isUser 
              ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white' 
              : isError 
                ? 'bg-gradient-to-br from-red-500 to-red-600 text-white'
                : 'bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-500 text-white'
          }`}>
            {isUser ? (
              <User className="w-5 h-5" />
            ) : (
              <Sparkles className="w-5 h-5" />
            )}
          </div>

          {/* Contenu */}
          <div className="flex-1 min-w-0">
            {/* Message */}
            <div className={`text-base leading-7 ${
              isUser 
                ? 'text-gray-900 dark:text-gray-100 font-medium' 
                : isError
                  ? 'text-red-800 dark:text-red-200'
                  : 'text-gray-800 dark:text-gray-200'
            }`}>
              <div className="whitespace-pre-wrap">
                {displayedContent}
                {isTyping && (
                  <span className="inline-block w-0.5 h-5 bg-blue-500 opacity-75 typing-indicator ml-1 animate-pulse" />
                )}
              </div>
            </div>

            {/* Actions pour les réponses de l'assistant */}
            {!isUser && !isError && displayedContent && !isTyping && (
              <div className="flex items-center gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyToClipboard}
                  className="h-8 px-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-1 text-green-500" />
                      <span className="text-xs">Copié</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-1" />
                      <span className="text-xs">Copier</span>
                    </>
                  )}
                </Button>
                
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-gray-500 hover:text-green-600 dark:text-gray-400 dark:hover:text-green-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                    title="Bonne réponse"
                  >
                    <ThumbsUp className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                    title="Mauvaise réponse"
                  >
                    <ThumbsDown className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Debug SQL pour les admins */}
            {message.sqlResults && showSqlDebug && (
              <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-2 font-medium flex items-center gap-2">
                  <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                  Debug SQL (Admin)
                </div>
                <pre className="sql-results text-gray-800 dark:text-gray-200 overflow-x-auto text-xs font-mono bg-white dark:bg-gray-900 p-3 rounded border">
                  {JSON.stringify(message.sqlResults, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}