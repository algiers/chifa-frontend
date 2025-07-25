'use client';

import React from 'react';
import { MessageSquare, Bot } from 'lucide-react';
import ParticleBackground from './ParticleBackground';

export function MessageSkeleton() {
  return (
    <div className="flex w-full mb-4 justify-start">
      <div className="flex max-w-[85%] md:max-w-[80%] items-start gap-3">
        {/* Avatar skeleton */}
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
        
        {/* Message bubble skeleton */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl rounded-bl-md p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded loading-shimmer w-3/4" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded loading-shimmer w-1/2" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded loading-shimmer w-2/3" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function ConversationSkeleton() {
  return (
    <div className="space-y-2 px-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-lg">
          <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="flex-1 h-4 bg-gray-200 dark:bg-gray-700 rounded loading-shimmer" />
        </div>
      ))}
    </div>
  );
}

export function TypingIndicator() {
  return (
    <div className="flex justify-start mb-4">
      <div className="flex items-start gap-3 max-w-[80%]">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-green-600 text-white flex items-center justify-center shadow-sm">
          <Bot className="w-4 h-4" />
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl rounded-bl-md px-4 py-3 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-gray-400 rounded-full pulse-dot" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full pulse-dot" style={{ animationDelay: '200ms' }}></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full pulse-dot" style={{ animationDelay: '400ms' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function EmptyState() {
  return (
    <div className="relative flex flex-col items-center justify-center h-full text-center py-12 new-message">
      <ParticleBackground />
      
      <div className="relative z-10">
        <div className="p-4 bg-gradient-to-br from-blue-100 via-blue-200 to-purple-200 dark:from-blue-900/20 dark:via-blue-800/20 dark:to-purple-800/20 rounded-full mb-6 shadow-lg gentle-pulse">
          <MessageSquare className="w-12 h-12 text-blue-500 dark:text-blue-400" />
        </div>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-3 hover-lift">
          Bienvenue sur Chifa Assistant
        </h2>
        <p className="text-gray-600 dark:text-gray-400 max-w-md text-readable">
          Posez vos questions sur les médicaments, les stocks, ou toute autre information pharmaceutique.
        </p>
        
        {/* Indicateur visuel subtil */}
        <div className="flex space-x-1 mt-6">
          <div className="w-2 h-2 bg-blue-400 rounded-full pulse-dot" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-purple-400 rounded-full pulse-dot" style={{ animationDelay: '200ms' }}></div>
          <div className="w-2 h-2 bg-blue-400 rounded-full pulse-dot" style={{ animationDelay: '400ms' }}></div>
        </div>
      </div>
    </div>
  );
}