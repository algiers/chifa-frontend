'use client';

import type { User } from 'next-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

import { PlusIcon, MessageIcon, TrashIcon, BotIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuAction,
  SidebarInput,
  useSidebar,
} from '@/components/ui/sidebar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useChifaAuth } from '@/hooks/useChifaAuth';
import { useChatStore } from '@/stores/chatStore';
import { LogOut, Settings } from 'lucide-react';

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export function ChifaSidebar({ user }: { user: User | undefined }) {
  const router = useRouter();
  const { setOpenMobile } = useSidebar();
  const { logout, supabase } = useChifaAuth();
  const { clearChat, setCurrentConversationId } = useChatStore();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Load conversations
  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);

  const fetchConversations = async () => {
    if (!user) return;

    setIsLoadingConversations(true);
    try {
      const { data, error } = await supabase
        .from('chat_conversations')
        .select('id, title, created_at, updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching conversations:', error);
      } else {
        setConversations(data || []);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setIsLoadingConversations(false);
    }
  };

  const handleNewChat = () => {
    clearChat();
    setCurrentConversationId(null);
    router.push('/dashboard');
    setOpenMobile(false);
  };

  const handleConversationClick = async (conversationId: string) => {
    try {
      const { data: messages, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading conversation:', error);
        return;
      }

      // Convert messages from DB to store format
      const chatMessages = messages.map((msg: any) => ({
        id: msg.id,
        role: msg.role as 'user' | 'assistant' | 'system' | 'error',
        content: msg.content,
        sqlQuery: msg.sql_query,
        sqlResults: msg.sql_results,
        timestamp: new Date(msg.created_at),
      }));

      // Update store with conversation messages
      const { setMessages, setCurrentConversationId } = useChatStore.getState();
      setMessages(chatMessages);
      setCurrentConversationId(conversationId);

      router.push('/dashboard');
      setOpenMobile(false);
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  };

  const deleteConversation = async (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!confirm('Êtes-vous sûr de vouloir supprimer cette conversation ?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('chat_conversations')
        .delete()
        .eq('id', conversationId)
        .eq('user_id', user?.id);

      if (error) {
        console.error('Error deleting conversation:', error);
      } else {
        setConversations(prev => prev.filter(conv => conv.id !== conversationId));
        // If it's the active conversation, clear it
        const { currentConversationId, clearChat } = useChatStore.getState();
        if (currentConversationId === conversationId) {
          clearChat();
        }
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);

    try {
      const result = await logout();
      
      if (result.success) {
        router.push('/login');
      } else {
        console.error('Error during logout:', result.error);
      }
    } catch (e: any) {
      console.error('Unexpected error during logout:', e);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return 'Aujourd\'hui';
    } else if (diffInHours < 48) {
      return 'Hier';
    } else if (diffInHours < 168) { // 7 days
      return `${Math.floor(diffInHours / 24)} jours`;
    } else {
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short'
      });
    }
  };

  return (
    <Sidebar className="group-data-[side=left]:border-r-0">
      <SidebarHeader>
        <SidebarMenu>
          <div className="flex flex-row justify-between items-center">
            <Link
              href="/"
              onClick={() => {
                setOpenMobile(false);
              }}
              className="flex flex-row gap-3 items-center"
            >
              <div className="flex items-center justify-center w-8 h-8 bg-green-600 rounded-lg">
                <BotIcon />
              </div>
              <span className="text-lg font-semibold px-2 hover:bg-muted rounded-md cursor-pointer text-green-600">
                Chifa.ai
              </span>
            </Link>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  type="button"
                  className="p-2 h-fit"
                  onClick={handleNewChat}
                >
                  <PlusIcon />
                </Button>
              </TooltipTrigger>
              <TooltipContent align="end">Nouveau Chat</TooltipContent>
            </Tooltip>
          </div>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* Search */}
        <div className="px-2 mb-2">
          <SidebarInput
            type="text"
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Conversations */}
        <SidebarMenu>
          {isLoadingConversations ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-muted-foreground">Chargement...</div>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              {searchQuery ? 'Aucune conversation trouvée' : 'Aucune conversation'}
            </div>
          ) : (
            filteredConversations.map((conversation) => (
              <SidebarMenuItem key={conversation.id}>
                <SidebarMenuButton
                  onClick={() => handleConversationClick(conversation.id)}
                  className="w-full justify-start"
                >
                  <MessageIcon size={16} />
                  <div className="flex-1 min-w-0">
                    <div className="truncate text-sm font-medium">
                      {conversation.title}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDate(conversation.updated_at)}
                    </div>
                  </div>
                </SidebarMenuButton>
                <SidebarMenuAction
                  onClick={(e) => deleteConversation(conversation.id, e)}
                  showOnHover
                >
                  <TrashIcon size={16} />
                  <span className="sr-only">Supprimer</span>
                </SidebarMenuAction>
              </SidebarMenuItem>
            ))
          )}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter>
        {user && (
          <SidebarMenu>
            <SidebarMenuItem>
              <Link href="/settings">
                <SidebarMenuButton>
                  <Settings />
                  <span>Paramètres</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                <LogOut />
                <span>{isLoggingOut ? 'Déconnexion...' : 'Déconnexion'}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}