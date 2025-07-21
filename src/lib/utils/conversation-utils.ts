/**
 * Conversation Utilities
 * Helper functions for managing conversations in the Vercel AI integration
 */

import { createSupabaseClientClient } from '@/lib/auth/supabase-auth-adapter';
import { 
  ChifaMessage, 
  ChifaConversation, 
  chifaMessagesToUIMessages,
  adaptConversationsForSidebar,
  createNewConversation,
  updateConversationWithMessage,
  UIMessage
} from '@/lib/adapters/chat-adapters';

/**
 * Get all conversations for a user
 */
export async function getUserConversations(userId: string): Promise<Array<{
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  path: string;
}>> {
  const supabase = createSupabaseClientClient();
  
  const { data: conversations, error } = await supabase
    .from('chat_conversations')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching conversations:', error);
    return [];
  }
  
  return adaptConversationsForSidebar(conversations as ChifaConversation[]);
}

/**
 * Get a specific conversation with its messages
 */
export async function getConversationWithMessages(
  conversationId: string,
  userId: string
): Promise<{
  conversation: ChifaConversation | null;
  messages: UIMessage[];
}> {
  const supabase = createSupabaseClientClient();
  
  // Get the conversation
  const { data: conversation, error: convError } = await supabase
    .from('chat_conversations')
    .select('*')
    .eq('id', conversationId)
    .eq('user_id', userId)
    .single();
  
  if (convError || !conversation) {
    console.error('Error fetching conversation:', convError);
    return { conversation: null, messages: [] };
  }
  
  // Get the messages
  const { data: messages, error: msgError } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  
  if (msgError) {
    console.error('Error fetching messages:', msgError);
    return { conversation: conversation as ChifaConversation, messages: [] };
  }
  
  return {
    conversation: conversation as ChifaConversation,
    messages: chifaMessagesToUIMessages(messages as ChifaMessage[]),
  };
}

/**
 * Create a new conversation
 */
export async function createConversation(
  userId: string,
  title: string,
  conversationId?: string
): Promise<ChifaConversation | null> {
  const supabase = createSupabaseClientClient();
  
  const newConversation = createNewConversation(userId, title, conversationId);
  
  const { data, error } = await supabase
    .from('chat_conversations')
    .insert({
      ...newConversation,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error creating conversation:', error);
    return null;
  }
  
  return data as ChifaConversation;
}

/**
 * Update conversation title
 */
export async function updateConversationTitle(
  conversationId: string,
  userId: string,
  newTitle: string
): Promise<boolean> {
  const supabase = createSupabaseClientClient();
  
  const { error } = await supabase
    .from('chat_conversations')
    .update({ 
      title: newTitle.substring(0, 100),
      updated_at: new Date().toISOString(),
    })
    .eq('id', conversationId)
    .eq('user_id', userId);
  
  if (error) {
    console.error('Error updating conversation title:', error);
    return false;
  }
  
  return true;
}

/**
 * Delete a conversation and all its messages
 */
export async function deleteConversation(
  conversationId: string,
  userId: string
): Promise<boolean> {
  const supabase = createSupabaseClientClient();
  
  // Delete messages first (due to foreign key constraints)
  const { error: msgError } = await supabase
    .from('chat_messages')
    .delete()
    .eq('conversation_id', conversationId)
    .eq('user_id', userId);
  
  if (msgError) {
    console.error('Error deleting messages:', msgError);
    return false;
  }
  
  // Delete the conversation
  const { error: convError } = await supabase
    .from('chat_conversations')
    .delete()
    .eq('id', conversationId)
    .eq('user_id', userId);
  
  if (convError) {
    console.error('Error deleting conversation:', convError);
    return false;
  }
  
  return true;
}

/**
 * Add a message to a conversation
 */
export async function addMessageToConversation(
  conversationId: string,
  userId: string,
  role: 'user' | 'assistant' | 'system',
  content: string,
  messageId?: string,
  metadata?: any
): Promise<ChifaMessage | null> {
  const supabase = createSupabaseClientClient();
  
  const message: Omit<ChifaMessage, 'created_at'> = {
    id: messageId || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    conversation_id: conversationId,
    user_id: userId,
    role,
    content,
    sql_query: null,
    sql_results: null,
    metadata,
  };
  
  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      ...message,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error adding message:', error);
    return null;
  }
  
  // Update conversation's updated_at timestamp
  await supabase
    .from('chat_conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', conversationId)
    .eq('user_id', userId);
  
  return data as ChifaMessage;
}

/**
 * Get conversation statistics
 */
export async function getConversationStats(userId: string): Promise<{
  totalConversations: number;
  totalMessages: number;
  averageMessagesPerConversation: number;
}> {
  const supabase = createSupabaseClientClient();
  
  // Get conversation count
  const { count: conversationCount } = await supabase
    .from('chat_conversations')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);
  
  // Get message count
  const { count: messageCount } = await supabase
    .from('chat_messages')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);
  
  const totalConversations = conversationCount || 0;
  const totalMessages = messageCount || 0;
  const averageMessagesPerConversation = totalConversations > 0 
    ? Math.round(totalMessages / totalConversations * 100) / 100 
    : 0;
  
  return {
    totalConversations,
    totalMessages,
    averageMessagesPerConversation,
  };
}

/**
 * Search conversations by title or content
 */
export async function searchConversations(
  userId: string,
  query: string,
  limit: number = 10
): Promise<Array<{
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  path: string;
  snippet?: string;
}>> {
  const supabase = createSupabaseClientClient();
  
  // Search in conversation titles
  const { data: conversations, error } = await supabase
    .from('chat_conversations')
    .select('*')
    .eq('user_id', userId)
    .ilike('title', `%${query}%`)
    .order('updated_at', { ascending: false })
    .limit(limit);
  
  if (error) {
    console.error('Error searching conversations:', error);
    return [];
  }
  
  // Also search in message content
  const { data: messageMatches, error: msgError } = await supabase
    .from('chat_messages')
    .select('conversation_id, content')
    .eq('user_id', userId)
    .ilike('content', `%${query}%`)
    .limit(limit);
  
  if (msgError) {
    console.error('Error searching messages:', msgError);
  }
  
  // Combine results
  const conversationResults = adaptConversationsForSidebar(conversations as ChifaConversation[]);
  
  // Add message-based results
  if (messageMatches) {
    const messageConversationIds = [...new Set(messageMatches.map((m: any) => m.conversation_id))];
    
    for (const convId of messageConversationIds) {
      if (!conversationResults.find(c => c.id === convId)) {
        const { data: conv } = await supabase
          .from('chat_conversations')
          .select('*')
          .eq('id', convId)
          .eq('user_id', userId)
          .single();
        
        if (conv) {
          const adapted = adaptConversationsForSidebar([conv as ChifaConversation])[0];
          const matchingMessage = messageMatches.find((m: any) => m.conversation_id === convId);
          
          conversationResults.push({
            ...adapted,
            snippet: matchingMessage?.content.substring(0, 100) + '...',
          } as any);
        }
      }
    }
  }
  
  return conversationResults.slice(0, limit);
}

/**
 * Get recent conversations (last 7 days)
 */
export async function getRecentConversations(
  userId: string,
  limit: number = 5
): Promise<Array<{
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  path: string;
}>> {
  const supabase = createSupabaseClientClient();
  
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const { data: conversations, error } = await supabase
    .from('chat_conversations')
    .select('*')
    .eq('user_id', userId)
    .gte('updated_at', sevenDaysAgo.toISOString())
    .order('updated_at', { ascending: false })
    .limit(limit);
  
  if (error) {
    console.error('Error fetching recent conversations:', error);
    return [];
  }
  
  return adaptConversationsForSidebar(conversations as ChifaConversation[]);
}

/**
 * Check if user owns a conversation
 */
export async function userOwnsConversation(
  conversationId: string,
  userId: string
): Promise<boolean> {
  const supabase = createSupabaseClientClient();
  
  const { data, error } = await supabase
    .from('chat_conversations')
    .select('id')
    .eq('id', conversationId)
    .eq('user_id', userId)
    .single();
  
  return !error && !!data;
}

/**
 * Generate a conversation title from the first message
 */
export function generateConversationTitle(firstMessage: string): string {
  // Clean the message and take first few words
  const cleaned = firstMessage
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  const words = cleaned.split(' ').slice(0, 6);
  let title = words.join(' ');
  
  if (cleaned.split(' ').length > 6) {
    title += '...';
  }
  
  return title || 'New Conversation';
}

/**
 * Load a conversation by ID
 * Alias for getConversationWithMessages for backward compatibility
 */
export async function loadConversation(
  conversationId: string,
  userId: string
): Promise<{
  conversation: ChifaConversation | null;
  messages: UIMessage[];
}> {
  return getConversationWithMessages(conversationId, userId);
}