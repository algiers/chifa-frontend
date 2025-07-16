'use client';

import React from 'react';
import type { ChatMessage } from '@/stores/chatStore';
import { MessageSquare, User, AlertTriangle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import SQLExecutionDisplay from './SQLExecutionDisplay';

interface MessageItemProps {
  message: ChatMessage;
}

const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';
  const isError = message.role === 'error';
  const isSystem = message.role === 'system';

  // System messages
  if (isSystem) {
    return (
      <div className="flex justify-center my-4">
        <div className="bg-muted/50 text-muted-foreground text-sm px-3 py-1 rounded-full">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} group`}>
      <div className={`flex items-start space-x-3 max-w-[85%] ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
        {/* Avatar */}
        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isUser
          ? 'bg-primary text-primary-foreground'
          : isError
            ? 'bg-destructive/10 text-destructive'
            : 'bg-primary/10 text-primary'
          }`}>
          {isUser ? (
            <User className="h-4 w-4" />
          ) : isError ? (
            <AlertTriangle className="h-4 w-4" />
          ) : (
            <MessageSquare className="h-4 w-4" />
          )}
        </div>

        {/* Message content */}
        <div className={`rounded-2xl px-4 py-3 max-w-none ${isUser
          ? 'bg-primary text-primary-foreground'
          : isError
            ? 'bg-destructive/10 text-destructive border border-destructive/20'
            : 'bg-muted text-foreground'
          }`}>
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                // Custom table styling
                table: ({ children, ...props }) => (
                  <div className="overflow-x-auto my-4">
                    <table className="min-w-full divide-y divide-border rounded-lg border" {...props}>
                      {children}
                    </table>
                  </div>
                ),
                thead: ({ children, ...props }) => (
                  <thead className="bg-muted/50" {...props}>
                    {children}
                  </thead>
                ),
                th: ({ children, ...props }) => (
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider" {...props}>
                    {children}
                  </th>
                ),
                td: ({ children, ...props }) => (
                  <td className="px-4 py-2 text-sm border-t border-border" {...props}>
                    {children}
                  </td>
                ),
                // Better paragraph spacing
                p: ({ children, ...props }) => (
                  <p className="mb-2 last:mb-0 leading-relaxed" {...props}>
                    {children}
                  </p>
                ),
                // Code blocks
                code: ({ children, className, ...props }) => {
                  const isInline = !className;
                  return isInline ? (
                    <code className="bg-muted/50 text-foreground px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                      {children}
                    </code>
                  ) : (
                    <code className="block bg-muted/50 text-foreground p-3 rounded-lg text-sm font-mono overflow-x-auto" {...props}>
                      {children}
                    </code>
                  );
                },
                // Lists
                ul: ({ children, ...props }) => (
                  <ul className="list-disc list-inside space-y-1 my-2" {...props}>
                    {children}
                  </ul>
                ),
                ol: ({ children, ...props }) => (
                  <ol className="list-decimal list-inside space-y-1 my-2" {...props}>
                    {children}
                  </ol>
                ),
                // Links
                a: ({ children, ...props }) => (
                  <a className="text-primary hover:underline" {...props}>
                    {children}
                  </a>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>

          {/* Error details */}
          {isError && message.errorMessage && (
            <div className="mt-2 pt-2 border-t border-destructive/20">
              <p className="text-xs text-destructive/80">
                Détail : {message.errorMessage}
              </p>
            </div>
          )}

          {/* SQL results */}
          {isAssistant && message.sqlResults && message.sqlResults.length > 0 && (
            <div className="mt-3">
              <SQLExecutionDisplay sqlResults={message.sqlResults} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageItem;
