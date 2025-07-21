/**
 * Optimized Database Queries for Chifa.ai
 * 
 * This module provides optimized database query functions with:
 * - Pagination support for conversations and messages
 * - Efficient search functionality
 * - Performance-optimized data loading
 */

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { ChifaConversation, ChifaMessage } from '@/lib/adapters/chat-adapters';

/**
 * Get paginated conversations for a user
 */
export async function getPaginatedConversations(
  userId: string,
  page: number = 1,
  pageSize: number = 20,
  search?: string
): Promise<{
  conversations: ChifaConversation[];
  hasMore: boolean;
  totalPages: number;
}> {
  const supabase = createSupabaseServerClient();
  
  const offset = (page - 1) * pageSize;
  
  const { data, error } = await supabase
    .rpc('get_paginated_conversations', {
      p_user_id: userId,
      p_limit: pageSize,
      p_offset: offset,
      p_search: search || null
    });
  
  if (error) {
    console.error('Error fetching paginated conversations:', error);
    return { conversations: [], hasMore: false, totalPages: 0 };
  }
  
  // Extract hasMore from the first result
  const hasMore = data.length > 0 ? data[0].has_more : false;
  
  // Calculate total pages (approximate)
  const totalPages = hasMore ? page + 1 : page;
  
  // Convert to ChifaConversation format
  const conversations = data.map((conv: any) => ({
    id: conv.id,
    user_id: userId,
    title: conv.title,
    created_at: conv.created_at,
    updated_at: conv.updated_at,
    metadata: {
      total_messages: conv.message_count,
      path: conv.path
    }
  }));
  
  return { conversations, hasMore, totalPages };
}

/**
 * Get paginated messages for a conversation
 */
export async function getPaginatedMessages(
  conversationId: string,
  userId: string,
  limit: number = 50,
  beforeTimestamp?: string
): Promise<{
  messages: ChifaMessage[];
  hasMore: boolean;
}> {
  const supabase = createSupabaseServerClient();
  
  const { data, error } = await supabase
    .rpc('get_paginated_messages', {
      p_conversation_id: conversationId,
      p_user_id: userId,
      p_limit: limit,
      p_before_timestamp: beforeTimestamp || null
    });
  
  if (error) {
    console.error('Error fetching paginated messages:', error);
    return { messages: [], hasMore: false };
  }
  
  // Extract hasMore from the first result
  const hasMore = data.length > 0 ? data[0].has_more : false;
  
  // Convert to ChifaMessage format
  const messages = data.map((msg: any) => ({
    id: msg.id,
    conversation_id: conversationId,
    user_id: userId,
    role: msg.role,
    content: msg.content,
    created_at: msg.created_at,
    sql_query: msg.sql_query,
    sql_results: msg.sql_results,
    metadata: msg.metadata
  }));
  
  return { messages, hasMore };
}

/**
 * Search conversations with optimized query
 */
export async function searchConversationsOptimized(
  userId: string,
  query: string,
  limit: number = 10,
  page: number = 1
): Promise<{
  results: Array<{
    id: string;
    title: string;
    path: string;
    updatedAt: Date;
    snippet?: string;
    matchType: 'title' | 'content';
  }>;
  hasMore: boolean;
}> {
  const supabase = createSupabaseServerClient();
  
  const offset = (page - 1) * limit;
  
  const { data, error } = await supabase
    .rpc('search_conversations_optimized', {
      p_user_id: userId,
      p_query: query,
      p_limit: limit,
      p_offset: offset
    });
  
  if (error) {
    console.error('Error searching conversations:', error);
    return { results: [], hasMore: false };
  }
  
  // Extract hasMore from the first result
  const hasMore = data.length > 0 ? data[0].has_more : false;
  
  // Format results
  const results = data.map((result: any) => ({
    id: result.conversation_id,
    title: result.title,
    path: result.path,
    updatedAt: new Date(result.updated_at),
    snippet: result.snippet,
    matchType: result.match_type as 'title' | 'content'
  }));
  
  return { results, hasMore };
}

/**
 * Get conversation statistics with optimized query
 */
export async function getConversationStatsOptimized(
  userId: string
): Promise<{
  totalConversations: number;
  totalMessages: number;
  averageMessagesPerConversation: number;
  mostRecentActivity?: Date;
  sqlQueryCount: number;
}> {
  const supabase = createSupabaseServerClient();
  
  const { data, error } = await supabase
    .rpc('get_conversation_stats_optimized', {
      p_user_id: userId
    });
  
  if (error || !data || data.length === 0) {
    console.error('Error fetching conversation stats:', error);
    return {
      totalConversations: 0,
      totalMessages: 0,
      averageMessagesPerConversation: 0,
      sqlQueryCount: 0
    };
  }
  
  const stats = data[0];
  
  return {
    totalConversations: stats.total_conversations,
    totalMessages: stats.total_messages,
    averageMessagesPerConversation: stats.avg_messages_per_conversation,
    mostRecentActivity: stats.most_recent_activity ? new Date(stats.most_recent_activity) : undefined,
    sqlQueryCount: stats.sql_query_count
  };
}

/**
 * Get recent conversations with optimized query
 */
export async function getRecentConversationsOptimized(
  userId: string,
  days: number = 7,
  limit: number = 10
): Promise<Array<{
  id: string;
  title: string;
  path: string;
  createdAt: Date;
  updatedAt: Date;
  messageCount: number;
  lastMessage?: string;
}>> {
  const supabase = createSupabaseServerClient();
  
  const { data, error } = await supabase
    .rpc('get_recent_conversations_optimized', {
      p_user_id: userId,
      p_days: days,
      p_limit: limit
    });
  
  if (error) {
    console.error('Error fetching recent conversations:', error);
    return [];
  }
  
  // Format results
  return data.map((conv: any) => ({
    id: conv.id,
    title: conv.title,
    path: conv.path,
    createdAt: new Date(conv.created_at),
    updatedAt: new Date(conv.updated_at),
    messageCount: conv.message_count,
    lastMessage: conv.last_message
  }));
}

/**
 * Performance monitoring for database queries
 */
export async function monitorQueryPerformance<T>(
  queryName: string,
  queryFn: () => Promise<T>
): Promise<T> {
  const startTime = Date.now();
  
  try {
    const result = await queryFn();
    const duration = Date.now() - startTime;
    
    // Log performance metrics
    console.log(`📊 Query Performance: ${queryName} - ${duration}ms`);
    
    // Log slow queries
    if (duration > 500) {
      console.warn(`⚠️ Slow query detected: ${queryName} - ${duration}ms`);
    }
    
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ Query Error: ${queryName} - ${duration}ms`, error);
    throw error;
  }
}