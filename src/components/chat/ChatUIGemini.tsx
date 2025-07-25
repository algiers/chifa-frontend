'use client';

import React, { useEffect, useRef } from 'react';
import { useChatStore } from '../../stores/chatStore';
import MessageGemini from './MessageGemini';
import ChatInputGemini from './ChatInputGemini';
import ThemeToggle from './ThemeToggle';
import { TypingIndicator, EmptyState } from './LoadingStates';
import ErrorDisplay from './ErrorDisplay';
import ModelIndicator from './ModelIndicator';
import { Sparkles, Settings } from 'lucide-react';

export default function ChatUIGemini() {
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
    <div className="flex flex-col h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      {/* Header style Gemini authentique */}
      <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Chifa</h1>
            <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded">
              Pro
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          
          <span className="text-xs border border-green-300 dark:border-green-600 text-green-600 dark:text-green-400 px-2 py-1 rounded bg-green-50 dark:bg-green-900/20">
            Connectée
          </span>

          <div className="h-8 w-8 rounded-full bg-blue-600 text-white text-sm flex items-center justify-center font-medium">
            C
          </div>
        </div>
      </header>

      {/* Messages Container */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto bg-white dark:bg-gray-950 custom-scrollbar"
      >
        {messages.length === 0 ? (
          // État vide style Gemini authentique
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center">
              <h2 className="text-4xl font-normal text-blue-500 mb-8">Bonjour</h2>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                Comment puis-je vous aider aujourd'hui ?
              </p>
            </div>
          </div>
        ) : (
          // Messages
          <div className="w-full">
            {messages.map((message, index) => {
              const isLastMessage = index === messages.length - 1;
              const isStreaming = isLastMessage && isLoading && message.role === 'assistant';
              
              return (
                <MessageGemini
                  key={message.id}
                  message={message}
                  isStreaming={isStreaming}
                />
              );
            })}
            
            {/* Indicateur de typing */}
            {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
              <div className="bg-gray-50/50 dark:bg-gray-900/50">
                <div className="max-w-4xl mx-auto px-6 py-8">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-500 text-white flex items-center justify-center shadow-sm">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex space-x-1 mt-2">
                        <div className="w-2 h-2 bg-purple-400 rounded-full pulse-dot" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-blue-400 rounded-full pulse-dot" style={{ animationDelay: '200ms' }}></div>
                        <div className="w-2 h-2 bg-cyan-400 rounded-full pulse-dot" style={{ animationDelay: '400ms' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Affichage des erreurs */}
        {error && (
          <div className="max-w-4xl mx-auto px-6 py-4">
            <ErrorDisplay 
              error={error} 
              onDismiss={() => setError(null)}
            />
          </div>
        )}
        
        {/* Référence pour le scroll automatique */}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <ChatInputGemini />
    </div>
  );
}