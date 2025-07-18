'use client';

import React from 'react';
import type { ChatMessage } from '@/stores/chatStore';
import { Bot, User, AlertTriangle, Database, BarChart3 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import SQLExecutionDisplay from './SQLExecutionDisplay';

interface MessageItemProps {
  message: ChatMessage;
  isLast?: boolean;
}

const MessageItem: React.FC<MessageItemProps> = ({ message, isLast = false }) => {
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';
  const isError = message.role === 'error';
  const isSystem = message.role === 'system';

  // System messages
  if (isSystem) {
    return (
      <div className="flex justify-center py-4">
        <div className="bg-gray-100 text-gray-600 text-sm px-4 py-2 rounded-full">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className={`border-b border-gray-100 ${isLast ? '' : ''}`}>
      <div className="max-w-4xl mx-auto px-6 py-6">
        <div className="flex items-start space-x-4">
          {/* Avatar */}
          <div className={`flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0 ${
            isUser
              ? 'bg-gray-700 text-white'
              : isError
                ? 'bg-red-100 text-red-600'
                : 'bg-chatgpt-accent text-white'
          }`}>
            {isUser ? (
              <User className="w-4 h-4" />
            ) : isError ? (
              <AlertTriangle className="w-4 h-4" />
            ) : (
              <Bot className="w-4 h-4" />
            )}
          </div>

          {/* Message content */}
          <div className="flex-1 min-w-0">
            {/* Main text content */}
            <div className={`${isError ? 'text-red-600' : 'text-gray-800'}`}>
              <div className="prose prose-gray max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    // Custom table styling
                    table: ({ children, ...props }) => (
                      <div className="overflow-x-auto my-4 border border-gray-200 rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200" {...props}>
                          {children}
                        </table>
                      </div>
                    ),
                    thead: ({ children, ...props }) => (
                      <thead className="bg-gray-50" {...props}>
                        {children}
                      </thead>
                    ),
                    th: ({ children, ...props }) => (
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" {...props}>
                        {children}
                      </th>
                    ),
                    td: ({ children, ...props }) => (
                      <td className="px-4 py-3 text-sm text-gray-900 border-t border-gray-200" {...props}>
                        {children}
                      </td>
                    ),
                    // Better paragraph spacing
                    p: ({ children, ...props }) => (
                      <p className="mb-3 last:mb-0 leading-relaxed text-gray-800" {...props}>
                        {children}
                      </p>
                    ),
                    // Code blocks
                    code: ({ children, className, ...props }) => {
                      const isInline = !className;
                      return isInline ? (
                        <code className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm font-mono" {...props}>
                          {children}
                        </code>
                      ) : (
                        <code className="block bg-gray-100 text-gray-800 p-4 rounded-lg text-sm font-mono overflow-x-auto" {...props}>
                          {children}
                        </code>
                      );
                    },
                    // Lists
                    ul: ({ children, ...props }) => (
                      <ul className="list-disc list-inside space-y-1 my-3 text-gray-800" {...props}>
                        {children}
                      </ul>
                    ),
                    ol: ({ children, ...props }) => (
                      <ol className="list-decimal list-inside space-y-1 my-3 text-gray-800" {...props}>
                        {children}
                      </ol>
                    ),
                    // Links
                    a: ({ children, ...props }) => (
                      <a className="text-blue-600 hover:text-blue-800 hover:underline" {...props}>
                        {children}
                      </a>
                    ),
                    // Headers
                    h1: ({ children, ...props }) => (
                      <h1 className="text-xl font-semibold text-gray-900 mb-3 mt-4 first:mt-0" {...props}>
                        {children}
                      </h1>
                    ),
                    h2: ({ children, ...props }) => (
                      <h2 className="text-lg font-semibold text-gray-900 mb-2 mt-4 first:mt-0" {...props}>
                        {children}
                      </h2>
                    ),
                    h3: ({ children, ...props }) => (
                      <h3 className="text-base font-semibold text-gray-900 mb-2 mt-3 first:mt-0" {...props}>
                        {children}
                      </h3>
                    ),
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>

              {/* Error details */}
              {isError && message.errorMessage && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">
                    <strong>Détail :</strong> {message.errorMessage}
                  </p>
                </div>
              )}
            </div>

            {/* SQL Results Section */}
            {isAssistant && message.sqlResults && message.sqlResults.length > 0 && (
              <div className="mt-6 space-y-4">
                {/* Results Header */}
                <div className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                  <Database className="w-4 h-4" />
                  <span>Résultats de la requête :</span>
                </div>

                {/* SQL Results Display */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <SQLExecutionDisplay sqlResults={message.sqlResults} />
                </div>

                {/* Chart Placeholder */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <BarChart3 className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">Visualisation de Données (Graphique)</span>
                  </div>
                  <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">
                      Le composant ChartRenderer affichera ici un graphique basé sur les résultats SQL.
                    </p>
                    <div className="mt-4 text-xs text-gray-400 font-mono bg-gray-100 p-2 rounded">
                      {JSON.stringify(message.sqlResults.slice(0, 2), null, 2)}
                      {message.sqlResults.length > 2 && '\n...'}
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      (Ceci est un placeholder - une bibliothèque de graphiques sera intégrée ici)
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageItem;
