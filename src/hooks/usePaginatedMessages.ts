/**
 * Hook for paginated messages with optimized loading
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { ChifaMessage } from '@/lib/adapters/chat-adapters';
import { useOptimizedCallback, useOptimizedMemo } from '@/lib/utils/react-performance';

interface UsePaginatedMessagesOptions {
  conversationId: string;
  limit?: number;
  initialTimestamp?: string;
}

interface UsePaginatedMessagesResult {
  messages: ChifaMessage[];
  isLoading: boolean;
  error: Error | null;
  hasMore: boolean;
  loadMore: () => void;
  refresh: () => void;
}

export function usePaginatedMessages({
  conversationId,
  limit = 50,
  initialTimestamp
}: UsePaginatedMessagesOptions): UsePaginatedMessagesResult {
  const { user } = useAuth();
  const supabase = createClientComponentClient();
  
  const [messages, setMessages] = useState<ChifaMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [beforeTimestamp, setBeforeTimestamp] = useState<string | undefined>(initialTimestamp);
  
  // Memoize the fetch function to prevent unnecessary re-renders
  const fetchMessages = useOptimizedCallback(async (timestamp?: string) => {
    if (!user || !conversationId) {
      setMessages([]);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.rpc('get_paginated_messages', {
        p_conversation_id: conversationId,
        p_user_id: user.id,
        p_limit: limit,
        p_before_timestamp: timestamp || null
      });
      
      if (error) {
        throw new Error(`Failed to fetch messages: ${error.message}`);
      }
      
      // Extract hasMore from the first result
      const moreResults = data.length > 0 ? data[0].has_more : false;
      
      // Convert to ChifaMessage format
      const formattedMessages = data.map((msg: any) => ({
        id: msg.id,
        conversation_id: conversationId,
        user_id: user.id,
        role: msg.role,
        content: msg.content,
        created_at: msg.created_at,
        sql_query: msg.sql_query,
        sql_results: msg.sql_results,
        metadata: msg.metadata
      }));
      
      // If loading more, append to existing messages
      if (timestamp) {
        setMessages(prev => [...prev, ...formattedMessages]);
      } else {
        setMessages(formattedMessages);
      }
      
      setHasMore(moreResults);
      
      // Update the timestamp for next page if we have messages
      if (formattedMessages.length > 0) {
        const oldestMessage = formattedMessages[formattedMessages.length - 1];
        setBeforeTimestamp(oldestMessage.created_at);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      console.error('Error fetching messages:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user, conversationId, limit, supabase], 'fetchMessages');
  
  // Load messages when dependencies change
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages, conversationId]);
  
  // Load more messages
  const loadMore = useCallback(() => {
    if (hasMore && !isLoading && beforeTimestamp) {
      fetchMessages(beforeTimestamp);
    }
  }, [hasMore, isLoading, beforeTimestamp, fetchMessages]);
  
  // Refresh messages
  const refresh = useCallback(() => {
    fetchMessages();
  }, [fetchMessages]);
  
  // Memoize the result to prevent unnecessary re-renders
  return useOptimizedMemo(() => ({
    messages,
    isLoading,
    error,
    hasMore,
    loadMore,
    refresh
  }), [
    messages,
    isLoading,
    error,
    hasMore,
    loadMore,
    refresh
  ], 'usePaginatedMessagesResult');
}