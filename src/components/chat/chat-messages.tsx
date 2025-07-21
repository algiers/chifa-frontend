'use client';

import { UIMessage } from '@/lib/adapters/chat-adapters';
import { BotIcon, UserIcon, LoaderIcon } from '@/components/icons';
import { cn } from '@/lib/utils';
import { memo, useMemo } from 'react';
import { useOptimizedMemo, withOptimizedMemo } from '@/lib/utils/react-performance';
import dynamic from 'next/dynamic';
import { SQLResultDisplay } from './sql-result-display';
import { MessageMetadata } from './message-metadata';

// Lazy load heavy components
const ReactMarkdown = dynamic(() => import('react-markdown'), {
  loading: () => <div className="animate-pulse h-20 bg-muted/20 rounded"></div>,
  ssr: false
});

import remarkGfm from 'remark-gfm';

interface ChatMessagesProps {
  messages: UIMessage[];
  isLoading: boolean;
}

// Helper functions for SQL content detection and extraction
function detectSQLContent(content: string): boolean {
  return content.includes('```sql') || 
         content.includes('SELECT') || 
         content.includes('INSERT') || 
         content.includes('UPDATE') || 
         content.includes('DELETE');
}

function extractSQLQuery(content: string): string {
  const sqlMatch = content.match(/```sql\n([\s\S]*?)\n```/);
  if (sqlMatch) {
    return sqlMatch[1].trim();
  }
  
  // Fallback: look for SQL keywords
  const lines = content.split('\n');
  const sqlLines = lines.filter(line => 
    line.trim().match(/^(SELECT|INSERT|UPDATE|DELETE|WITH|CREATE|ALTER|DROP)/i)
  );
  
  return sqlLines.join('\n').trim();
}

function extractSQLResults(content: string): any[] {
  // Try to extract JSON results from the content
  const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[1]);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch (e) {
      console.error('Error parsing SQL results:', e);
    }
  }
  
  // Try to extract table data from markdown tables
  const tableMatch = content.match(/\|[\s\S]*?\|/g);
  if (tableMatch && tableMatch.length > 1) {
    try {
      const rows = tableMatch.slice(2); // Skip header and separator
      const headers = tableMatch[0].split('|').map(h => h.trim()).filter(h => h);
      
      return rows.map(row => {
        const values = row.split('|').map(v => v.trim()).filter(v => v);
        const obj: any = {};
        headers.forEach((header, index) => {
          obj[header] = values[index] || '';
        });
        return obj;
      });
    } catch (e) {
      console.error('Error parsing table data:', e);
    }
  }
  
  return [];
}

function extractExecutionTime(content: string): number | undefined {
  const timeMatch = content.match(/(\d+)\s*ms/);
  return timeMatch ? parseInt(timeMatch[1]) : undefined;
}

// Memoized message component for better performance
const MessageItem = memo(({ message }: { message: UIMessage }) => {
  const msg = message as any;
  
  // Memoize expensive operations
  const hasSQLContent = useMemo(() => {
    return msg.role === 'assistant' && detectSQLContent(msg.content);
  }, [msg.role, msg.content]);
  
  const sqlQuery = useOptimizedMemo(() => 
    hasSQLContent ? extractSQLQuery(msg.content) : '',
    [hasSQLContent, msg.content],
    'sqlQuery'
  );
  
  const sqlResults = useOptimizedMemo(() => 
    hasSQLContent ? extractSQLResults(msg.content) : [],
    [hasSQLContent, msg.content],
    'sqlResults'
  );
  
  const executionTime = useOptimizedMemo(() => 
    hasSQLContent ? extractExecutionTime(msg.content) : undefined,
    [hasSQLContent, msg.content],
    'executionTime'
  );
  
  return (
    <div
      className={cn(
        'flex items-start gap-4 p-4 rounded-lg',
        msg.role === 'user' ? 'bg-muted/50' : 'bg-background'
      )}
    >
      <div className="flex-shrink-0">
        {msg.role === 'user' ? (
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
            <UserIcon size={16} />
          </div>
        ) : (
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-600">
            <BotIcon size={16} />
          </div>
        )}
      </div>
      
      <div className="flex-1 space-y-2 overflow-hidden">
        <div className="font-medium">
          {msg.role === 'user' ? 'Vous' : 'Chifa.ai'}
        </div>
        
        <div className="prose prose-sm max-w-none dark:prose-invert">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              // Custom styling for code blocks
              code: ({ className, children, ...props }: any) => {
                const match = /language-(\w+)/.exec(className || '');
                const language = match ? match[1] : '';
                
                if (props.inline) {
                  return (
                    <code className="bg-muted px-1 py-0.5 rounded text-sm" {...props}>
                      {children}
                    </code>
                  );
                }
                
                return (
                  <div className="relative">
                    {language && (
                      <div className="absolute top-2 right-2 text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                        {language.toUpperCase()}
                      </div>
                    )}
                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
                      <code className={className} {...props}>
                        {children}
                      </code>
                    </pre>
                  </div>
                );
              },
              // Custom styling for tables (SQL results)
              table: ({ children }) => (
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse border border-muted">
                    {children}
                  </table>
                </div>
              ),
              th: ({ children }) => (
                <th className="border border-muted bg-muted/50 px-3 py-2 text-left font-medium">
                  {children}
                </th>
              ),
              td: ({ children }) => (
                <td className="border border-muted px-3 py-2">
                  {children}
                </td>
              ),
              // Custom styling for blockquotes
              blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-green-600 pl-4 italic text-muted-foreground">
                  {children}
                </blockquote>
              ),
            }}
          >
            {msg.content}
          </ReactMarkdown>
        </div>
        
        {/* Display SQL results if present */}
        {hasSQLContent && (
          <SQLResultDisplay
            query={sqlQuery}
            results={sqlResults}
            executionTime={executionTime}
          />
        )}
        
        {/* Display message metadata if available */}
        {msg.role === 'assistant' && msg.metadata && (
          <MessageMetadata metadata={(message as any).metadata} />
        )}
      </div>
    </div>
  );
});

// Optimize the main component with memo
export const ChatMessages = memo(function ChatMessages({ messages, isLoading }: ChatMessagesProps) {
  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-600 mb-4">
          <BotIcon size={24} />
        </div>
        <h3 className="mt-4 text-lg font-semibold">Comment puis-je vous aider aujourd'hui ?</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Posez une question sur votre base de données pharmacie ou décrivez ce dont vous avez besoin.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-2 w-full max-w-md">
          <div className="p-3 bg-muted/50 rounded-lg text-sm">
            💊 "Quels sont les médicaments en rupture de stock ?"
          </div>
          <div className="p-3 bg-muted/50 rounded-lg text-sm">
            📊 "Affiche-moi les ventes du mois dernier"
          </div>
          <div className="p-3 bg-muted/50 rounded-lg text-sm">
            🔍 "Recherche les clients qui ont acheté de l'aspirine"
          </div>
        </div>
      </div>
    );
  }

  // Memoize the messages array to prevent unnecessary re-renders
  const memoizedMessages = useOptimizedMemo(() => messages, [messages], 'memoizedMessages');
  
  return (
    <div className="space-y-6">
      {memoizedMessages.map((message) => (
        <MessageItem key={(message as any).id} message={message} />
      ))}
      
      {isLoading && (
        <div className="flex items-start gap-4 p-4 rounded-lg">
          <div className="flex-shrink-0">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-600">
              <BotIcon size={16} />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <LoaderIcon size={16} />
            <span className="text-sm text-muted-foreground">Chifa.ai réfléchit...</span>
          </div>
        </div>
      )}
    </div>
  );
});