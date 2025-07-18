'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useChatStore } from '@/stores/chatStore';
import { useAuth } from '@/hooks/useAuth';
import { Chat } from '@/components/chat';
import { loadConversation } from '@/lib/utils/conversation-utils';
import { UIMessage } from '@/lib/adapters/chat-adapters';
import { ChatMessage } from '@/stores/chatStore';

export default function ChatPage() {
  const params = useParams();
  const conversationId = params.id as string;
  const { user, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [initialMessages, setInitialMessages] = useState<any[]>([]);
  const { setCurrentConversationId, setMessages } = useChatStore();
  
  // Convert UIMessage to ChatMessage format
  const convertToChatMessages = (uiMessages: UIMessage[]): ChatMessage[] => {
    return uiMessages.map((msg, index) => {
      const anyMsg = msg as any;
      return {
        id: anyMsg.id || `msg_${index}_${Date.now()}`,
        role: anyMsg.role as ChatMessage['role'],
        content: anyMsg.content,
        sqlQuery: anyMsg.sql_query || null,
        sqlResults: anyMsg.sql_results || null,
        timestamp: anyMsg.createdAt || new Date(),
      };
    });
  };
  
  useEffect(() => {
    if (user && conversationId) {
      loadConversationData();
    }
  }, [user, conversationId]);
  
  const loadConversationData = async () => {
    if (!user || !conversationId) return;
    
    try {
      setIsLoading(true);
      
      const conversation = await loadConversation(conversationId, user.id);
      
      if (conversation) {
        // Messages are already in UI format from loadConversation
        setInitialMessages(conversation.messages);
        
        // Update chat store
        setCurrentConversationId(conversationId);
        setMessages(convertToChatMessages(conversation.messages));
      } else {
        // Conversation not found, redirect to dashboard
        window.location.href = '/dashboard';
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
      window.location.href = '/dashboard';
    } finally {
      setIsLoading(false);
    }
  };
  
  if (authLoading || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold mb-2">Chargement de la conversation...</h2>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return null;
  }
  
  return (
    <div className="flex flex-col h-screen">
      <Chat 
        initialMessages={initialMessages}
        conversationId={conversationId}
      />
    </div>
  );
}