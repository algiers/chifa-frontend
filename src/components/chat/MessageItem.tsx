'use client';

import React from 'react';
import type { ChatMessage } from '@/stores/chatStore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'; // À ajouter via shadcn
import { Bot, User, AlertTriangle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import SQLExecutionDisplay from './SQLExecutionDisplay'; // Importer le nouveau composant

interface MessageItemProps {
  message: ChatMessage;
}

const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';
  const isError = message.role === 'error';
  const isSystem = message.role === 'system';

  const getAvatarContent = () => {
    if (isUser) return <User className="w-5 h-5" />;
    if (isAssistant) return <Bot className="w-5 h-5" />;
    if (isError) return <AlertTriangle className="w-5 h-5 text-red-500" />;
    return null; // Pour les messages système ou autres
  };

  const getAvatarBgColor = () => {
    if (isUser) return 'bg-blue-500 text-white';
    if (isAssistant) return 'bg-green-500 text-white';
    if (isError) return 'bg-red-100'; // L'icône est déjà rouge
    return 'bg-gray-300 text-gray-700';
  };
  
  // Pour les messages système, on pourrait avoir un style différent, ex: centré et plus petit.
  if (isSystem) {
    return (
      <div className="my-2 py-1 px-3 text-xs text-gray-500 text-center italic">
        {message.content}
      </div>
    );
  }

  return (
    <div className={`flex my-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex items-start space-x-3 max-w-[85%] sm:max-w-[75%]`}>
        {!isUser && (
          <Avatar className={`w-8 h-8 ${getAvatarBgColor()}`}>
            {/* <AvatarImage src={isAssistant ? "/path/to/bot-avatar.png" : undefined} /> */}
            <AvatarFallback className={`flex items-center justify-center ${getAvatarBgColor()}`}>
              {getAvatarContent()}
            </AvatarFallback>
          </Avatar>
        )}
        <div
          className={`p-3 rounded-lg shadow-sm break-words
            ${isUser ? 'bg-blue-500 text-white rounded-br-none' : ''}
            ${isAssistant ? 'bg-gray-100 text-gray-800 rounded-bl-none' : ''}
            ${isError ? 'bg-red-50 border border-red-200 text-red-700 rounded-bl-none' : ''}
          `}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              table: ({ node, children, ...props }) => <table className="min-w-full divide-y divide-border border border-border my-2" {...props}>{children}</table>,
              thead: ({ node, children, ...props }) => <thead className="bg-muted" {...props}>{children}</thead>,
              th: ({ node, children, ...props }) => <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider" {...props}>{children}</th>,
              td: ({ node, children, ...props }) => <td className="px-3 py-2 text-sm text-foreground border-t border-border" {...props}>{children}</td>,
              p: ({ node, children, ...props }) => <p className="mb-1 last:mb-0" {...props}>{children}</p>,
            }}
          >
            {message.content}
          </ReactMarkdown>
          {isError && message.errorMessage && (
            <p className="mt-1 text-xs text-red-500">Détail : {message.errorMessage}</p>
          )}
          {/* Affichage des résultats SQL si présents et si l'assistant les a fournis */}
          {isAssistant && message.sqlResults && message.sqlResults.length > 0 && (
            <SQLExecutionDisplay sqlResults={message.sqlResults} />
          )}
        </div>
        {isUser && (
          <Avatar className={`w-8 h-8 ${getAvatarBgColor()}`}>
            {/* <AvatarImage src="/path/to/user-avatar.png" /> */}
            <AvatarFallback className={`flex items-center justify-center ${getAvatarBgColor()}`}>
              {getAvatarContent()}
            </AvatarFallback>
          </Avatar>
        )}
      </div>
    </div>
  );
};

export default MessageItem;
