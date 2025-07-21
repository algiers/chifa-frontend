'use client';

import { useChat } from '@ai-sdk/react';
import { useEffect, useRef, memo } from 'react';
import { useRouter } from 'next/navigation';
import type { UIMessage } from '@/lib/adapters/chat-adapters';
import { useChatStore } from '@/stores/chatStore';
import { ChatHeader } from './chat-header';
import { v4 as uuidv4 } from 'uuid';
import { 
  useOptimizedMemo, 
  useOptimizedCallback, 
  usePerformanceMonitor,
  useThrottle
} from '@/lib/utils/react-performance';
import { usePaginatedMessages } from '@/hooks/usePaginatedMessages';

// Lazy load heavy components
import dynamic from 'next/dynamic';

const ChatPanel = dynamic(() => import('./chat-panel').then(mod => ({ default: mod.ChatPanel })), {
  loading: () => <div className="border-t p-4 h-[100px] flex items-center justify-center">
    <div className="animate-pulse">Chargement de l'interface de saisie...</div>
  </div>,
  ssr: false
});

const ChatMessages = dynamic(() => import('./chat-messages').then(mod => ({ default: mod.ChatMessages })), {
  loading: () => <div className="flex-1 overflow-y-auto p-4 space-y-6 animate-pulse">
    <div className="h-20 bg-muted/30 rounded-lg"></div>
    <div className="h-32 bg-muted/20 rounded-lg"></div>
  </div>,
  ssr: false
});

interface ChatProps {
  initialMessages?: UIMessage[];
  conversationId?: string | null;
  className?: string;
}

// Memoized component to prevent unnecessary re-renders
export const Chat = memo(function Chat({
  initialMessages = [],
  conversationId = null,
  className,
}: ChatProps) {
  // Monitor performance
  usePerformanceMonitor('Chat');
  
  const router = useRouter();
  const { messages: storeMessages, currentConversationId, setCurrentConversationId, isLoading } = useChatStore();
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  // Use paginated messages for optimized loading if we have a conversation ID
  const {
    messages: paginatedMessages,
    isLoading: isPaginationLoading,
    hasMore: hasMoreMessages,
    loadMore: loadMoreMessages
  } = usePaginatedMessages({
    conversationId: currentConversationId || '',
    limit: 50
  });
  
  // Convert store messages to AI SDK format if available
  const storeMessagesFormatted = useOptimizedMemo(() => storeMessages.map(msg => ({
    id: msg.id,
    role: msg.role as 'user' | 'assistant' | 'system',
    content: msg.content,
  })), [storeMessages], 'storeMessagesFormatted');
  
  // Use either provided initialMessages, paginated messages, or messages from the store
  const startingMessages = currentConversationId && paginatedMessages.length > 0 
    ? paginatedMessages.map(msg => ({
        id: msg.id,
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content
      }))
    : storeMessages.length > 0 
      ? storeMessagesFormatted 
      : initialMessages;
  
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    error,
    append,
    setMessages,
  } = useChat();
  
  // Update chat store when messages change
  useEffect(() => {
    if (messages.length > 0) {
      const formattedMessages = messages.map(msg => {
        const anyMsg = msg as any;
        return {
          id: anyMsg.id,
          role: anyMsg.role as 'user' | 'assistant' | 'system' | 'error',
          content: anyMsg.content,
          timestamp: new Date(),
        };
      });
      
      useChatStore.getState().setMessages(formattedMessages);
    }
  }, [messages]);
  
  // Handle form submission with validation - optimized with useOptimizedCallback
  const handleFormSubmit = useOptimizedCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      
      if (input.trim() === '') return;
      
      handleSubmit(e);
    },
    [input, handleSubmit],
    'handleFormSubmit'
  );
  
  return (
    <div className="flex flex-col h-full">
      <ChatHeader conversationId={currentConversationId} />
      
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-6"
        onScroll={useThrottle((e) => {
          // Load more messages when scrolling to top
          if (e.currentTarget.scrollTop < 100 && hasMoreMessages && !isPaginationLoading) {
            loadMoreMessages();
          }
        }, 200)}
      >
        <ChatMessages messages={messages as any} isLoading={isLoading} />
        
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">
              Erreur: {error.message || 'Une erreur est survenue'}
            </p>
          </div>
        )}
      </div>
      
      <div className="border-t p-4">
        <ChatPanel
          input={input}
          handleInputChange={handleInputChange}
          handleSubmit={handleFormSubmit}
          isLoading={isLoading}
          showSuggestions={messages.length === 0}
        />
      </div>
    </div>
  );
});