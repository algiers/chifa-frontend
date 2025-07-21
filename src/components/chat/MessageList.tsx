'use client';

import React, { useEffect, useRef } from 'react';
import { useChatStore } from '@/stores/chatStore';
import MessageItem from './MessageItem';
import { Bot, Sparkles, BarChart3, TrendingUp, Database } from 'lucide-react';

export default function MessageList() {
  const { messages, isLoading } = useChatStore();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Empty state when no messages - ChatGPT style
  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white">
        <div className="text-center max-w-2xl mx-auto px-6">
          {/* Logo et titre principal */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center justify-center w-12 h-12 bg-chatgpt-accent rounded-xl mr-4">
              <Bot className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-4xl font-semibold text-gray-800">Chifa.ai</h1>
          </div>
          
          <p className="text-lg text-gray-600 mb-12 leading-relaxed">
            Analysez votre pharmacie avec l'intelligence artificielle. 
            Posez vos questions en langage naturel sur votre base CHIFA_OFFICINE.
          </p>

          {/* Exemples de requêtes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-gray-50 hover:bg-gray-100 transition-colors duration-200 rounded-xl p-6 cursor-pointer border border-gray-200">
              <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg mb-4 mx-auto">
                <BarChart3 className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-medium text-gray-800 mb-2">Chiffre d'affaires</h3>
              <p className="text-sm text-gray-600">"CA CNAS avril dernier"</p>
            </div>
            
            <div className="bg-gray-50 hover:bg-gray-100 transition-colors duration-200 rounded-xl p-6 cursor-pointer border border-gray-200">
              <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-lg mb-4 mx-auto">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="font-medium text-gray-800 mb-2">Rotation produits</h3>
              <p className="text-sm text-gray-600">"Top produits rotation T1"</p>
            </div>
            
            <div className="bg-gray-50 hover:bg-gray-100 transition-colors duration-200 rounded-xl p-6 cursor-pointer border border-gray-200">
              <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-lg mb-4 mx-auto">
                <Database className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="font-medium text-gray-800 mb-2">Historique DCI</h3>
              <p className="text-sm text-gray-600">"Historique DCI CASNOS juin"</p>
            </div>
          </div>

          <div className="text-sm text-gray-500">
            <p>Commencez par taper votre question dans la zone de saisie ci-dessous</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-white">
      <div className="max-w-4xl mx-auto">
        <div className="space-y-0">
          {messages.map((msg, index) => (
            <div key={msg.id} className="message-enter">
              <MessageItem message={msg} isLast={index === messages.length - 1} />
            </div>
          ))}
          
          {/* Loading indicator */}
          {isLoading && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
            <div className="border-b border-gray-100 py-6">
              <div className="max-w-4xl mx-auto px-6">
                <div className="flex items-start space-x-4">
                  <div className="flex items-center justify-center w-8 h-8 bg-chatgpt-accent rounded-full flex-shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 pt-1">
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
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
