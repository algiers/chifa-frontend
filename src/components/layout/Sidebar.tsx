'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useUIStore } from '@/stores/uiStore';
import { useAuthStore } from '@/stores/authStore';
import { useChatStore } from '@/stores/chatStore';
import {
  Settings,
  X,
  LogOut,
  MessageSquarePlus,
  MessageSquare,
  Search,
  Trash2,
  PanelLeftClose,
  PanelLeft,
  Bot,
  Edit3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { createBrowserClient } from '@supabase/ssr';

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

interface NavItem {
  href: string;
  label: string;
  icon?: React.ElementType;
}

// Helper function pour créer les icônes avec le bon typage
const createIcon = (IconComponent: React.ElementType | undefined, className: string) => {
  if (!IconComponent) return null;
  const Component = IconComponent as React.ComponentType<{ className?: string }>;
  return <Component className={className} />;
};

const bottomNavItems: NavItem[] = [
  { href: '/chat-v2', label: 'Test Chat V2', icon: MessageSquare },
  { href: '/settings', label: 'Paramètres', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isMobileSidebarOpen, setMobileSidebarOpen, toggleMobileSidebar, isSidebarCollapsed, toggleSidebarCollapsed } = useUIStore();
  const { user, clearAuth } = useAuthStore();
  const { clearChat, setCurrentConversationId } = useChatStore();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Fermer le sidebar mobile lors d'un changement de route
  useEffect(() => {
    if (isMobileSidebarOpen) {
      setMobileSidebarOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, setMobileSidebarOpen]);

  // Charger les conversations
  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);

  const fetchConversations = async () => {
    if (!user) return;

    setIsLoadingConversations(true);
    try {
      const supabase = createSupabaseBrowserClient();
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
    if (isMobileSidebarOpen) setMobileSidebarOpen(false);
  };

  const handleConversationClick = async (conversationId: string) => {
    try {
      const supabase = createSupabaseBrowserClient();
      const { data: messages, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading conversation:', error);
        return;
      }

      // Convertir les messages de la DB vers le format du store
      const chatMessages = messages.map((msg: any) => ({
        id: msg.id,
        role: msg.role as 'user' | 'assistant' | 'system' | 'error',
        content: msg.content,
        sqlQuery: msg.sql_query,
        sqlResults: msg.sql_results,
        timestamp: new Date(msg.created_at),
      }));

      // Mettre à jour le store avec les messages de la conversation
      const { setMessages, setCurrentConversationId } = useChatStore.getState();
      setMessages(chatMessages);
      setCurrentConversationId(conversationId);

      router.push('/dashboard');
      if (isMobileSidebarOpen) setMobileSidebarOpen(false);
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
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase
        .from('chat_conversations')
        .delete()
        .eq('id', conversationId)
        .eq('user_id', user?.id);

      if (error) {
        console.error('Error deleting conversation:', error);
      } else {
        setConversations(prev => prev.filter(conv => conv.id !== conversationId));
        // Si c'est la conversation active, la nettoyer
        const { currentConversationId, clearChat } = useChatStore.getState();
        if (currentConversationId === conversationId) {
          clearChat();
        }
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
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
    } else if (diffInHours < 168) { // 7 jours
      return `${Math.floor(diffInHours / 24)} jours`;
    } else {
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short'
      });
    }
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        console.error('Supabase configuration missing');
        setIsLoggingOut(false);
        return;
      }

      const isolatedSupabaseClient = createBrowserClient(supabaseUrl, supabaseAnonKey);
      const { error } = await isolatedSupabaseClient.auth.signOut();

      if (error) {
        console.error('Error during logout:', error);
      } else {
        clearAuth();
        router.push('/login');
      }
    } catch (e: any) {
      console.error('Unexpected error during logout:', e);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Header - Logo et titre */}
      <div className="flex items-center justify-between p-3 mb-2">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-8 h-8 bg-chatgpt-accent rounded-lg">
            <Bot className="w-5 h-5 text-white" />
          </div>
          {!isSidebarCollapsed && (
            <div>
              <h1 className="text-lg font-semibold text-chatgpt-primary">Chifa.ai</h1>
              <p className="text-xs text-chatgpt-muted">Assistant IA</p>
            </div>
          )}
        </div>

        {/* Boutons de contrôle */}
        <div className="flex items-center space-x-1">
          {/* Toggle sidebar pour desktop */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:flex h-8 w-8 text-chatgpt-muted hover:text-chatgpt-primary hover:bg-chatgpt-medium transition-colors rounded-lg"
            onClick={toggleSidebarCollapsed}
          >
            {isSidebarCollapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </Button>

          {/* Fermer pour mobile */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-8 w-8 text-chatgpt-muted hover:text-chatgpt-primary hover:bg-chatgpt-medium transition-colors rounded-lg"
            onClick={toggleMobileSidebar}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {!isSidebarCollapsed && (
        <>
          {/* Bouton Nouveau Chat */}
          <div className="px-3 mb-4">
            <Button
              onClick={handleNewChat}
              className="w-full flex items-center justify-start space-x-3 px-3 py-3 rounded-xl bg-transparent border border-chatgpt-medium text-chatgpt-secondary hover:bg-chatgpt-medium hover:text-chatgpt-primary transition-all duration-200 group"
              variant="ghost"
            >
              <Edit3 className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span className="font-medium">Nouveau Chat</span>
            </Button>
          </div>

          {/* Barre de recherche */}
          <div className="px-3 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-chatgpt-muted" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 bg-chatgpt-medium border-0 rounded-xl text-chatgpt-primary placeholder-chatgpt-muted focus:outline-none focus:ring-2 focus:ring-chatgpt-accent/50 text-sm transition-all"
              />
            </div>
          </div>

          {/* Liste des conversations */}
          <div className="flex-1 overflow-y-auto px-3 space-y-1 sidebar-scroll">
            {isLoadingConversations ? (
              <div className="flex items-center justify-center py-8">
                <div className="loading-dots text-chatgpt-accent">
                  <div></div>
                  <div></div>
                  <div></div>
                </div>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="text-center py-8 text-chatgpt-muted text-sm">
                {searchQuery ? 'Aucune conversation trouvée' : 'Aucune conversation'}
              </div>
            ) : (
              <>
                {filteredConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    onClick={() => handleConversationClick(conversation.id)}
                    className="group flex items-center justify-between p-3 rounded-xl hover:bg-chatgpt-medium cursor-pointer transition-all duration-200 chatgpt-hover"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start space-x-3">
                        <MessageSquare className="w-4 h-4 text-chatgpt-muted flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-chatgpt-primary truncate font-medium leading-tight">
                            {conversation.title}
                          </p>
                          <p className="text-xs text-chatgpt-muted mt-1">
                            {formatDate(conversation.updated_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 ml-2">
                      <Button
                        onClick={(e) => deleteConversation(conversation.id, e)}
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-chatgpt-muted hover:text-red-400 hover:bg-chatgpt-light rounded-lg"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Navigation du bas */}
          <div className="mt-auto pt-4 border-t border-chatgpt-medium px-3 space-y-1">
            {bottomNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-3 px-3 py-3 rounded-xl transition-all duration-200 ${pathname === item.href
                  ? 'bg-chatgpt-medium text-chatgpt-primary'
                  : 'text-chatgpt-secondary hover:text-chatgpt-primary hover:bg-chatgpt-medium'
                  }`}
                onClick={() => isMobileSidebarOpen && setMobileSidebarOpen(false)}
              >
                {createIcon(item.icon, 'w-4 h-4')}
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            ))}

            {/* Bouton de déconnexion */}
            {user && (
              <Button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full flex items-center space-x-3 px-3 py-3 rounded-xl bg-transparent text-chatgpt-secondary hover:text-chatgpt-primary hover:bg-chatgpt-medium transition-all duration-200 disabled:opacity-50"
                variant="ghost"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-medium">{isLoggingOut ? 'Déconnexion...' : 'Déconnexion'}</span>
              </Button>
            )}
          </div>
        </>
      )}

      {/* Version réduite quand collapsed */}
      {isSidebarCollapsed && (
        <div className="flex flex-col items-center space-y-3 px-2 h-full">
          {/* Bouton Nouveau Chat réduit */}
          <Button
            onClick={handleNewChat}
            className="w-10 h-10 p-0 rounded-xl bg-transparent border border-chatgpt-medium text-chatgpt-muted hover:bg-chatgpt-medium hover:text-chatgpt-primary transition-all duration-200"
            variant="ghost"
            title="Nouveau Chat"
          >
            <Edit3 className="w-4 h-4" />
          </Button>

          {/* Conversations récentes (icônes seulement) */}
          <div className="flex flex-col space-y-2 w-full">
            {filteredConversations.slice(0, 5).map((conversation) => (
              <Button
                key={conversation.id}
                onClick={() => handleConversationClick(conversation.id)}
                className="w-10 h-10 p-0 rounded-xl bg-transparent text-chatgpt-muted hover:bg-chatgpt-medium hover:text-chatgpt-primary transition-all duration-200"
                variant="ghost"
                title={conversation.title}
              >
                <MessageSquare className="w-4 h-4" />
              </Button>
            ))}
          </div>

          {/* Navigation du bas réduite */}
          <div className="mt-auto pt-4 border-t border-chatgpt-medium flex flex-col items-center space-y-2 w-full">
            {bottomNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 ${pathname === item.href
                  ? 'bg-chatgpt-medium text-chatgpt-primary'
                  : 'text-chatgpt-muted hover:text-chatgpt-primary hover:bg-chatgpt-medium'
                  }`}
                onClick={() => isMobileSidebarOpen && setMobileSidebarOpen(false)}
                title={item.label}
              >
                {createIcon(item.icon, 'w-4 h-4')}
              </Link>
            ))}

            {/* Bouton de déconnexion réduit */}
            {user && (
              <Button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-10 h-10 p-0 rounded-xl bg-transparent text-chatgpt-muted hover:text-chatgpt-primary hover:bg-chatgpt-medium transition-all duration-200 disabled:opacity-50"
                variant="ghost"
                title={isLoggingOut ? 'Déconnexion...' : 'Déconnexion'}
              >
                <LogOut className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Sidebar pour écrans larges */}
      <aside
        className={`${isSidebarCollapsed ? 'w-16' : 'w-64'
          } bg-chatgpt-dark text-white p-4 space-y-2 hidden md:flex md:flex-col min-h-screen sticky top-0 transition-all duration-300 ease-in-out border-r border-gray-700`}
      >
        {sidebarContent}
      </aside>

      {/* Sidebar pour mobile (overlay) */}
      {isMobileSidebarOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setMobileSidebarOpen(false)}
            aria-hidden="true"
          />
          {/* Contenu du Sidebar Mobile */}
          <aside className="fixed top-0 left-0 w-64 h-full bg-chatgpt-dark text-white p-4 space-y-2 z-50 transform transition-transform ease-in-out duration-300 md:hidden flex flex-col border-r border-gray-700">
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  );
}
