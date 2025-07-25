'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import { Plus, MessageSquare, MoreHorizontal, Edit3, Trash2, User, Settings, LogOut, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { createSupabaseBrowserClient } from '../../lib/supabase/client';
import { useAuthStore } from '../../stores/authStore';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ConversationSkeleton } from './LoadingStates';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu';

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}

interface ChatSidebarV2Props {
  className?: string;
  onConversationSelect: (conversationId: string | null) => void;
  currentConversationId: string | null;
  onNewChat: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

interface ConversationData {
  id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
}

export default function ChatSidebarV2({ 
  className, 
  onConversationSelect, 
  currentConversationId,
  onNewChat,
  isCollapsed,
  onToggleCollapse
}: ChatSidebarV2Props) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const supabase = createSupabaseBrowserClient();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  const loadConversations = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          id,
          title,
          created_at,
          updated_at,
          user_id
        `)
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Compter les messages pour chaque conversation
      const conversationsWithCount = await Promise.all(
        data.map(async (conv: ConversationData) => {
          const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id);

          return {
            id: conv.id,
            title: conv.title || `Conversation ${conv.id.slice(0, 8)}`,
            created_at: conv.created_at,
            updated_at: conv.updated_at,
            message_count: count || 0
          };
        })
      );

      setConversations(conversationsWithCount);
      setLoading(false);
    } catch (error) {
      console.error('Error loading conversations:', error);
      setLoading(false);
    }
  };

  const deleteConversation = async (conversationId: string) => {
    try {
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId)
        .eq('user_id', user?.id);

      if (error) throw error;

      setConversations(prev => prev.filter(conv => conv.id !== conversationId));
      
      if (currentConversationId === conversationId) {
        onConversationSelect(null);
        onNewChat();
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };

  const updateConversationTitle = async (conversationId: string, newTitle: string) => {
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ title: newTitle })
        .eq('id', conversationId)
        .eq('user_id', user?.id);

      if (error) throw error;

      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId 
            ? { ...conv, title: newTitle }
            : conv
        )
      );
    } catch (error) {
      console.error('Error updating conversation title:', error);
    }
  };

  const handleEditStart = (conversation: Conversation) => {
    setEditingId(conversation.id);
    setEditTitle(conversation.title);
  };

  const handleEditSave = async () => {
    if (editingId && editTitle.trim()) {
      await updateConversationTitle(editingId, editTitle.trim());
    }
    setEditingId(null);
    setEditTitle('');
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditTitle('');
  };

  const handleConversationClick = (conversationId: string) => {
    onConversationSelect(conversationId);
  };

  const formatRelativeTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
      
      if (diffInHours < 24) {
        return formatDistanceToNow(date, { addSuffix: true, locale: fr });
      } else if (diffInHours < 168) { // 7 days
        return date.toLocaleDateString('fr-FR', { weekday: 'long' });
      } else {
        return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
      }
    } catch {
      return 'Récemment';
    }
  };

  const handleLogout = async () => {
    if (!window.confirm("Êtes-vous sûr de vouloir vous déconnecter ?")) return;
    
    try {
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) {
        console.error('SignOut error:', signOutError);
      }
    } catch (error) {
      console.error('SignOut exception:', error);
    }
    
    useAuthStore.getState().clearAuth();
    
    const keysToRemove = [
      'sb-ddeibfjxpwnisguehnmo-auth-token',
      'auth-storage',
      'supabase.auth.token'
    ];
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
    
    document.cookie = 'sb-ddeibfjxpwnisguehnmo-auth-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax';
    
    window.location.replace('/login');
  };

  // Grouper les conversations par période
  const groupConversations = (conversations: Conversation[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const groups = {
      today: [] as Conversation[],
      yesterday: [] as Conversation[],
      lastWeek: [] as Conversation[],
      lastMonth: [] as Conversation[],
      older: [] as Conversation[]
    };

    conversations.forEach(conv => {
      const convDate = new Date(conv.updated_at);
      if (convDate >= today) {
        groups.today.push(conv);
      } else if (convDate >= yesterday) {
        groups.yesterday.push(conv);
      } else if (convDate >= lastWeek) {
        groups.lastWeek.push(conv);
      } else if (convDate >= lastMonth) {
        groups.lastMonth.push(conv);
      } else {
        groups.older.push(conv);
      }
    });

    return groups;
  };

  const groupedConversations = groupConversations(conversations);

  const ConversationItem = ({ conversation }: { conversation: Conversation }) => (
    <div
      className={cn(
        "group relative flex items-center gap-3 rounded-lg p-3 text-sm cursor-pointer conversation-item transition-all duration-200",
        "hover:bg-gray-100/80 dark:hover:bg-gray-800/80 hover-lift glass-effect",
        currentConversationId === conversation.id && "bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-l-2 border-gradient-to-b from-blue-500 to-purple-500 shadow-sm"
      )}
      onClick={() => handleConversationClick(conversation.id)}
    >
      <MessageSquare className="w-4 h-4 text-gray-500 flex-shrink-0" />
      
      {editingId === conversation.id ? (
        <input
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onBlur={handleEditSave}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleEditSave();
            if (e.key === 'Escape') handleEditCancel();
          }}
          className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-gray-100"
          autoFocus
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span className="flex-1 truncate text-gray-900 dark:text-gray-100">
          {conversation.title}
        </span>
      )}

      {!isCollapsed && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => handleEditStart(conversation)}>
              <Edit3 className="w-4 h-4 mr-2" />
              Renommer
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => deleteConversation(conversation.id)}
              className="text-red-600 dark:text-red-400"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );

  const ConversationGroup = ({ title, conversations }: { title: string; conversations: Conversation[] }) => {
    if (conversations.length === 0) return null;
    
    return (
      <div className="mb-4">
        {!isCollapsed && (
          <h3 className="px-3 py-2 conversation-group-title text-gray-500 dark:text-gray-400">
            {title}
          </h3>
        )}
        <div className="space-y-1">
          {conversations.map((conversation) => (
            <ConversationItem key={conversation.id} conversation={conversation} />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={cn(
      "flex flex-col h-full bg-white/95 dark:bg-gray-900/95 glass-effect border-r border-gray-200/50 dark:border-gray-700/50 sidebar-transition shadow-lg",
      isCollapsed ? "w-16" : "w-64",
      className
    )}>
      {/* Header */}
      <div className="flex flex-col p-3 border-b border-gray-200 dark:border-gray-700">
        {!isCollapsed && (
          <>
            {/* Titre Chifa.ai Assistant */}
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-blue-500" />
              <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Chifa.ai Assistant
              </h1>
            </div>
            
            {/* Bouton Nouveau chat */}
            <Button
              onClick={() => {
                onNewChat();
                onConversationSelect(null);
              }}
              className="w-full justify-start gap-2 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-600"
              variant="outline"
            >
              <Plus className="w-4 h-4" />
              Nouveau chat
            </Button>
          </>
        )}
        
        {isCollapsed && (
          <div className="flex flex-col gap-2">
            <div className="w-10 h-10 rounded bg-blue-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <Button
              onClick={() => {
                onNewChat();
                onConversationSelect(null);
              }}
              size="icon"
              className="w-10 h-10 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-600"
              variant="outline"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        )}
        
        <Button
          onClick={onToggleCollapse}
          variant="ghost"
          size="icon"
          className="ml-auto w-8 h-8 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 focus-visible:focus"
          title={isCollapsed ? "Développer la sidebar" : "Réduire la sidebar"}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
      </div>

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto py-2 sidebar-scrollbar">
        {loading ? (
          <ConversationSkeleton />
        ) : conversations.length === 0 ? (
          !isCollapsed && (
            <div className="text-center text-sm text-gray-500 dark:text-gray-400 p-4">
              Aucune conversation
            </div>
          )
        ) : (
          <div className="px-2">
            <ConversationGroup title="Aujourd'hui" conversations={groupedConversations.today} />
            <ConversationGroup title="Hier" conversations={groupedConversations.yesterday} />
            <ConversationGroup title="7 derniers jours" conversations={groupedConversations.lastWeek} />
            <ConversationGroup title="30 derniers jours" conversations={groupedConversations.lastMonth} />
            <ConversationGroup title="Plus ancien" conversations={groupedConversations.older} />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-3">
        {!isCollapsed ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="w-full flex items-center justify-start gap-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded-lg transition-colors"
              >
                <User className="w-4 h-4" />
                <span className="truncate">{user?.email}</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuItem>
                <Settings className="w-4 h-4 mr-2" />
                Paramètres
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600 dark:text-red-400">
                <LogOut className="w-4 h-4 mr-2" />
                Déconnexion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="w-10 h-10 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg flex items-center justify-center transition-colors"
              >
                <User className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuItem>
                <Settings className="w-4 h-4 mr-2" />
                Paramètres
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600 dark:text-red-400">
                <LogOut className="w-4 h-4 mr-2" />
                Déconnexion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}
