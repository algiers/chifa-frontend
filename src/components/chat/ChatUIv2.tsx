'use client';

import React, { useEffect, useRef } from 'react';
import { useChatStore } from '../../stores/chatStore';
import MessageFlat from './MessageFlat';
import ChatInputV2 from './ChatInputV2';
import ThemeToggle from './ThemeToggle';
import { TypingIndicator, EmptyState } from './LoadingStates';
import ErrorDisplay from './ErrorDisplay';
import ModelIndicator from './ModelIndicator';
import DebugInfo from './DebugInfo';
import { MessageSquare, Settings } from 'lucide-react';

export default function ChatUIv2() {
  const { messages, isLoading, error, clearChat, setError } = useChatStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll vers le bas quand de nouveaux messages arrivent
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end'
      });
    }
  }, [messages]);

  // Scroll fluide lors du streaming
  useEffect(() => {
    if (isLoading && messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
      
      if (isNearBottom) {
        messagesEndRef.current?.scrollIntoView({ 
          behavior: 'smooth',
          block: 'end'
        });
      }
    }
  }, [messages, isLoading]);

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200 chat-container">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-white/95 via-white/98 to-white/95 dark:from-gray-900/95 dark:via-gray-900/98 dark:to-gray-900/95 glass-effect shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 rounded-lg shadow-lg gentle-pulse">
            <MessageSquare className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Chifa Assistant
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Assistant pharmaceutique intelligent
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ModelIndicator />
          <ThemeToggle />
          <button
            onClick={clearChat}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-200 focus-visible:focus hover-lift"
            title="Nouvelle conversation"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Messages Container */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto bg-white dark:bg-gray-900 chat-scrollbar"
      >
        <div className="w-full">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12">
              <EmptyState />
              {/* Suggestions de questions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-8 w-full max-w-2xl mx-auto px-4">
                {[
                  "Quel est le stock de Paracétamol ?",
                  "Quels sont les médicaments en rupture ?",
                  "Afficher les ventes du mois",
                  "Rechercher un médicament par DCI"
                ].map((suggestion, index) => (
                  <button
                    key={index}
                    className="group p-4 text-left bg-white/80 dark:bg-gray-800/80 glass-effect border border-gray-200/50 dark:border-gray-700/50 rounded-xl hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-lg suggestion-card hover-lift transition-all duration-300 focus-ring hover:bg-white/90 dark:hover:bg-gray-800/90"
                    onClick={() => {
                      // Ici on pourrait pré-remplir l'input avec la suggestion
                      // setCurrentQuery(suggestion);
                    }}
                  >
                    <span className="text-gray-900 dark:text-gray-100 text-sm text-readable group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {suggestion}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            // Messages
            <>
              {messages.map((message, index) => {
                const isLastMessage = index === messages.length - 1;
                const isStreaming = isLastMessage && isLoading && message.role === 'assistant';
                
                return (
                  <MessageFlat
                    key={message.id}
                    message={message}
                    isStreaming={isStreaming}
                  />
                );
              })}
              
              {/* Indicateur de typing quand l'IA réfléchit */}
              {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
                <TypingIndicator />
              )}
            </>
          )}
          
          {/* Affichage des erreurs */}
          {error && (
            <ErrorDisplay 
              error={error} 
              onDismiss={() => setError(null)}
              className="max-w-4xl mx-auto"
            />
          )}
          
          {/* Référence pour le scroll automatique */}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <ChatInputV2 />
      
      {/* Debug Info - à supprimer en production */}
      {process.env.NODE_ENV === 'development' && <DebugInfo />}
    </div>
  );
}