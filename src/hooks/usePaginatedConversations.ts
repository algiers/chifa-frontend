/**
 * Hook for paginated conversations with optimized loading
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { ChifaConversation } from '@/lib/adapters/chat-adapters';
import { useOptimizedCallback, useOptimizedMemo } from '@/lib/utils/react-performance';

interface UsePaginatedConversationsOptions {
  pageSize?: number;
  initialPage?: number;
  searchQuery?: string;
}

interface UsePaginatedConversationsResult {
  conversations: ChifaConversation[];
  isLoading: boolean;
  error: Error | null;
  page: number;
  hasMore: boolean;
  totalPages: number;
  loadNextPage: () => void;
  loadPreviousPage: () => void;
  goToPage: (page: number) => void;
  refresh: () => void;
  search: (query: string) => void;
}

export function usePaginatedConversations({
  pageSize = 20,
  initialPage = 1,
  searchQuery = ''
}: UsePaginatedConversationsOptions = {}): UsePaginatedConversationsResult {
  const { user } = useAuth();
  const supabase = createClientComponentClient();
  
  const [conversations, setConversations] = useState<ChifaConversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [page, setPage] = useState(initialPage);
  const [hasMore, setHasMore] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState(searchQuery);
  
  // Memoize the fetch function to prevent unnecessary re-renders
  const fetchConversations = useOptimizedCallback(async (currentPage: number, query: string) => {
    if (!user) {
      setConversations([]);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const offset = (currentPage - 1) * pageSize;
      
      const { data, error } = await supabase.rpc('get_paginated_conversations', {
        p_user_id: user.id,
        p_limit: pageSize,
        p_offset: offset,
        p_search: query || null
      });
      
      if (error) {
        throw new Error(`Failed to fetch conversations: ${error.message}`);
      }
      
      // Extract hasMore from the first result
      const moreResults = data.length > 0 ? data[0].has_more : false;
      
      // Calculate total pages (approximate)
      const pages = moreResults ? currentPage + 1 : currentPage;
      
      // Convert to ChifaConversation format
      const formattedConversations = data.map((conv: any) => ({
        id: conv.id,
        user_id: user.id,
        title: conv.title,
        created_at: conv.created_at,
        updated_at: conv.updated_at,
        metadata: {
          total_messages: conv.message_count,
          path: conv.path
        }
      }));
      
      setConversations(formattedConversations);
      setHasMore(moreResults);
      setTotalPages(pages);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      console.error('Error fetching conversations:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user, pageSize, supabase], 'fetchConversations');
  
  // Load conversations when dependencies change
  useEffect(() => {
    fetchConversations(page, search);
  }, [fetchConversations, page, search]);
  
  // Navigation functions
  const loadNextPage = useCallback(() => {
    if (hasMore) {
      setPage(prevPage => prevPage + 1);
    }
  }, [hasMore]);
  
  const loadPreviousPage = useCallback(() => {
    if (page > 1) {
      setPage(prevPage => prevPage - 1);
    }
  }, [page]);
  
  const goToPage = useCallback((newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  }, [totalPages]);
  
  const refresh = useCallback(() => {
    fetchConversations(page, search);
  }, [fetchConversations, page, search]);
  
  const handleSearch = useCallback((query: string) => {
    setSearch(query);
    setPage(1); // Reset to first page when searching
  }, []);
  
  // Memoize the result to prevent unnecessary re-renders
  return useOptimizedMemo(() => ({
    conversations,
    isLoading,
    error,
    page,
    hasMore,
    totalPages,
    loadNextPage,
    loadPreviousPage,
    goToPage,
    refresh,
    search: handleSearch
  }), [
    conversations,
    isLoading,
    error,
    page,
    hasMore,
    totalPages,
    loadNextPage,
    loadPreviousPage,
    goToPage,
    refresh,
    handleSearch
  ], 'usePaginatedConversationsResult');
}