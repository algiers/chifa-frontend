'use client';

import React, { useEffect, useRef } from 'react';
import { useChatStore } from '@/stores/chatStore';
import MessageBubble from './MessageBubble';
import ChatInputV2 from './ChatInputV2';
import { MessageSquare } from 'lucide-react';

// Version du ChatUIv2 sans header pour être intégrée dans ChatLayoutV2
export default function ChatUIv2Embedded() {
  const { messages, isLoading, error } = useChatStore();
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
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 transition-colors duration-200">
      {/* Messages Container */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-4 py-6 space-y-4 bg-gray-50 dark:bg-gray-900 chat-scrollbar"
      >
        <div className="max-w-4xl mx-auto">
          {messages.length === 0 ? (
            // État vide
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="p-4 bg-blue-100 dark:bg-blue-900/20 rounded-full mb-4">
                <MessageSquare className="w-12 h-12 text-blue-500" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Bienvenue sur Chifa Assistant
              </h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-md">
                Posez vos questions sur les médicaments, les stocks, ou toute autre information pharmaceutique.
              </p>
              
              {/* Suggestions de questions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-8 w-full max-w-2xl">
                {[
                  "Quel est le stock de Paracétamol ?",
                  "Quels sont les médicaments en rupture ?",
                  "Afficher les ventes du mois",
                  "Rechercher un médicament par DCI"
                ].map((suggestion, index) => (
                  <button
                    key={index}
                    className="p-4 text-left bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-sm suggestion-card"
                    onClick={() => {
                      // Ici on pourrait pré-remplir l'input avec la suggestion
                      // setCurrentQuery(suggestion);
                    }}
                  >
                    <span className="text-gray-900 dark:text-gray-100 text-sm">
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
                  <MessageBubble
                    key={message.id}
                    message={message}
                    isStreaming={isStreaming}
                  />
                );
              })}
              
              {/* Indicateur de typing quand l'IA réfléchit */}
              {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
                <div className="flex justify-start">
                  <div className="flex items-start gap-3 max-w-[80%]">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-bl-md px-4 py-3">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full pulse-dot" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full pulse-dot" style={{ animationDelay: '200ms' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full pulse-dot" style={{ animationDelay: '400ms' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          
          {/* Affichage des erreurs */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
              <div className="text-red-800 dark:text-red-200 text-sm">
                {error}
              </div>
            </div>
          )}
          
          {/* Référence pour le scroll automatique */}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <ChatInputV2 />
    </div>
  );
}