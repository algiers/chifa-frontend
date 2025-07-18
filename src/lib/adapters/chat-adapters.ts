/**
 * Chat Data Format Adapters
 * Converts between Chifa.ai format and Vercel AI SDK format
 */

import { CoreMessage } from 'ai';

// Chifa.ai message format (from database)
export interface ChifaMessage {
  id: string;
  conversation_id: string;
  user_id: string;
  role: 'user' | 'assistant' | 'system' | 'error';
  content: string;
  created_at: string;
  sql_query?: string | null;
  sql_results?: any | null;
  metadata?: {
    model_used?: string;
    streaming?: boolean;
    response_length?: number;
    credits_consumed?: number;
    [key: string]: any;
  };
}

// Chifa.ai conversation format (from database)
export interface ChifaConversation {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  metadata?: {
    total_messages?: number;
    last_activity?: string;
    [key: string]: any;
  };
}

// Extended message format for UI display
export interface UIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt?: Date;
  sql_query?: string | null;
  sql_results?: any | null;
  metadata?: {
    model_used?: string;
    streaming?: boolean;
    response_length?: number;
    credits_consumed?: number;
    [key: string]: any;
  };
}

/**
 * Convert Chifa.ai message to Vercel AI SDK CoreMessage format
 */
export function chifaMessageToCoreMessage(chifaMessage: ChifaMessage): any {
  return {
    role: chifaMessage.role,
    content: chifaMessage.content,
  };
}

/**
 * Convert array of Chifa.ai messages to CoreMessage array
 */
export function chifaMessagesToCoreMessages(chifaMessages: ChifaMessage[]): any[] {
  return chifaMessages.map(chifaMessageToCoreMessage);
}

/**
 * Convert Chifa.ai message to UI Message format (for display)
 */
export function chifaMessageToUIMessage(chifaMessage: ChifaMessage): UIMessage {
  return {
    id: chifaMessage.id,
    role: chifaMessage.role as UIMessage['role'],
    content: chifaMessage.content,
    createdAt: new Date(chifaMessage.created_at),
    sql_query: chifaMessage.sql_query,
    sql_results: chifaMessage.sql_results,
    metadata: chifaMessage.metadata,
  };
}

/**
 * Convert array of Chifa.ai messages to UI Message array
 */
export function chifaMessagesToUIMessages(chifaMessages: ChifaMessage[]): UIMessage[] {
  return chifaMessages.map(chifaMessageToUIMessage);
}

/**
 * Convert array of Chifa.ai messages to Vercel AI SDK Message array
 * Alias for chifaMessagesToUIMessages for backward compatibility
 */
export function chifaMessagesToVercel(chifaMessages: ChifaMessage[]): UIMessage[] {
  return chifaMessagesToUIMessages(chifaMessages);
}

/**
 * Convert CoreMessage to Chifa.ai message format (for storage)
 */
export function coreMessageToChifaMessage(
  coreMessage: any,
  conversationId: string,
  userId: string,
  messageId?: string
): Omit<ChifaMessage, 'created_at'> {
  return {
    id: messageId || generateMessageId(),
    conversation_id: conversationId,
    user_id: userId,
    role: coreMessage.role as ChifaMessage['role'],
    content: typeof coreMessage.content === 'string' 
      ? coreMessage.content 
      : JSON.stringify(coreMessage.content),
    sql_query: null,
    sql_results: null,
  };
}

/**
 * Convert UI Message to Chifa.ai message format (for storage)
 */
export function uiMessageToChifaMessage(
  uiMessage: UIMessage,
  conversationId: string,
  userId: string
): Omit<ChifaMessage, 'created_at'> {
  return {
    id: uiMessage.id,
    conversation_id: conversationId,
    user_id: userId,
    role: uiMessage.role as ChifaMessage['role'],
    content: uiMessage.content,
    sql_query: uiMessage.sql_query || null,
    sql_results: uiMessage.sql_results || null,
    metadata: uiMessage.metadata,
  };
}

/**
 * Extract SQL query and results from message content
 * This function parses the message content to extract SQL-related information
 */
export function extractSQLFromContent(content: string): {
  sql_query: string | null;
  sql_results: any | null;
  cleaned_content: string;
} {
  let sql_query: string | null = null;
  let sql_results: any | null = null;
  let cleaned_content = content;

  // Extract SQL query from code blocks
  const sqlCodeBlockRegex = /```sql\\n([\\s\\S]*?)\\n```/gi;
  const sqlMatch = sqlCodeBlockRegex.exec(content);
  
  if (sqlMatch) {
    sql_query = sqlMatch[1].trim();
  }

  // Extract SQL results from JSON blocks or tables
  const resultsRegex = /```(?:json|results)\\n([\\s\\S]*?)\\n```/gi;
  const resultsMatch = resultsRegex.exec(content);
  
  if (resultsMatch) {
    try {
      sql_results = JSON.parse(resultsMatch[1]);
    } catch (error) {
      // If it's not valid JSON, store as text
      sql_results = resultsMatch[1];
    }
  }

  // Clean the content by removing the extracted parts if needed
  // For now, we keep the original content as is
  cleaned_content = content;

  return {
    sql_query,
    sql_results,
    cleaned_content,
  };
}

/**
 * Format SQL results for display
 */
export function formatSQLResults(results: any): string {
  if (!results) return '';
  
  if (typeof results === 'string') {
    return results;
  }
  
  if (Array.isArray(results)) {
    if (results.length === 0) {
      return 'No results found.';
    }
    
    // Format as a simple table
    const headers = Object.keys(results[0]);
    let table = '| ' + headers.join(' | ') + ' |\\n';
    table += '| ' + headers.map(() => '---').join(' | ') + ' |\\n';
    
    results.slice(0, 10).forEach(row => { // Limit to 10 rows for display
      table += '| ' + headers.map(header => String(row[header] || '')).join(' | ') + ' |\\n';
    });
    
    if (results.length > 10) {
      table += `\\n... and ${results.length - 10} more rows`;
    }
    
    return table;
  }
  
  return JSON.stringify(results, null, 2);
}

/**
 * Generate a unique message ID
 */
function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Validate message format
 */
export function validateMessage(message: any): message is any {
  return (
    message &&
    typeof message === 'object' &&
    typeof message.role === 'string' &&
    ['user', 'assistant', 'system'].includes(message.role) &&
    (typeof message.content === 'string' || Array.isArray(message.content))
  );
}

/**
 * Sanitize message content to prevent XSS
 */
export function sanitizeMessageContent(content: string): string {
  // Basic HTML sanitization - in production, use a proper library like DOMPurify
  return content
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Convert conversation metadata for API compatibility
 */
export function adaptConversationMetadata(conversation: ChifaConversation): {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  path: string;
} {
  return {
    id: conversation.id,
    title: conversation.title,
    createdAt: new Date(conversation.created_at),
    updatedAt: new Date(conversation.updated_at),
    path: `/chat/${conversation.id}`,
  };
}

/**
 * Batch convert conversations for sidebar display
 */
export function adaptConversationsForSidebar(conversations: ChifaConversation[]): Array<{
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  path: string;
}> {
  return conversations.map(adaptConversationMetadata);
}

/**
 * Create a new conversation object
 */
export function createNewConversation(
  userId: string,
  title: string,
  conversationId?: string
): Omit<ChifaConversation, 'created_at' | 'updated_at'> {
  return {
    id: conversationId || `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    user_id: userId,
    title: title.substring(0, 100), // Limit title length
    metadata: {
      total_messages: 0,
      last_activity: new Date().toISOString(),
    },
  };
}

/**
 * Update conversation with new message
 */
export function updateConversationWithMessage(
  conversation: ChifaConversation,
  message: ChifaMessage
): Partial<ChifaConversation> {
  const currentMessageCount = conversation.metadata?.total_messages || 0;
  
  return {
    updated_at: new Date().toISOString(),
    metadata: {
      ...conversation.metadata,
      total_messages: currentMessageCount + 1,
      last_activity: message.created_at,
    },
  };
}

/**
 * Error handling for malformed data
 */
export class DataAdapterError extends Error {
  constructor(message: string, public originalData?: any) {
    super(message);
    this.name = 'DataAdapterError';
  }
}

/**
 * Safe adapter function that handles errors gracefully
 */
export function safeAdapt<T, R>(
  data: T,
  adapter: (data: T) => R,
  fallback: R
): R {
  try {
    return adapter(data);
  } catch (error) {
    console.error('Data adapter error:', error);
    return fallback;
  }
}