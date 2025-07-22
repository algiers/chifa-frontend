'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Plus, Trash2, Clock, LogOut } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}

interface ChatSidebarProps {
  className?: string;
  onConversationSelect: (conversationId: string | null) => void;
  currentConversationId: string | null;
  onNewChat: () => void;
}

interface ConversationData {
  id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
}

export default function ChatSidebar({ 
  className, 
  onConversationSelect, 
  currentConversationId,
  onNewChat 
}: ChatSidebarProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
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
      // Charger seulement les conversations sans compter les messages pour éviter les erreurs de relation
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          id,
          title,
          created_at,
          updated_at
        `)
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const formattedConversations: Conversation[] = (data as ConversationData[]).map((conv: ConversationData) => ({
        id: conv.id,
        title: conv.title || 'Conversation sans titre',
        created_at: conv.created_at,
        updated_at: conv.updated_at,
        message_count: 0 // On ne compte plus les messages pour éviter les erreurs de relation
      }));

      setConversations(formattedConversations);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
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

  const handleConversationClick = (conversationId: string) => {
    onConversationSelect(conversationId);
  };

  const formatRelativeTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: fr
      });
    } catch {
      return 'Récemment';
    }
  };

  const handleLogout = async () => {
    if (!window.confirm("Êtes-vous sûr de vouloir vous déconnecter ?")) return;
    
    console.log('[ChatSidebar] Starting logout process...');
    
    try {
      // Étape 1: Déconnexion via Supabase
      console.log('[ChatSidebar] Calling Supabase signOut...');
      const { error: signOutError } = await supabase.auth.signOut();
      
      if (signOutError) {
        console.error('[ChatSidebar] SignOut error:', signOutError);
      } else {
        console.log('[ChatSidebar] SignOut successful');
      }
    } catch (error) {
      console.error('[ChatSidebar] SignOut exception:', error);
    }
    
    // Étape 2: Nettoyage côté client (toujours exécuté)
    console.log('[ChatSidebar] Clearing client-side data...');
    
    // Nettoyer le store Zustand
    useAuthStore.getState().clearAuth();
    
    // Nettoyer le localStorage et sessionStorage
    const keysToRemove = [
      'sb-ddeibfjxpwnisguehnmo-auth-token',
      'auth-storage',
      'supabase.auth.token'
    ];
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
      console.log(`[ChatSidebar] Removed ${key} from storage`);
    });
    
    // Nettoyer les cookies
    const cookiesToClear = [
      'sb-ddeibfjxpwnisguehnmo-auth-token'
    ];
    
    cookiesToClear.forEach(cookieName => {
      // Nettoyer pour le domaine actuel
      document.cookie = `${cookieName}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax`;
      // Nettoyer pour le sous-domaine
      document.cookie = `${cookieName}=; Path=/; Domain=${window.location.hostname}; Expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax`;
      console.log(`[ChatSidebar] Cleared cookie ${cookieName}`);
    });
    
    console.log('[ChatSidebar] Client cleanup completed, redirecting...');
    
    // Redirection immédiate
    window.location.replace('/login');
  };

  return (
    <div className={cn("w-64 border-r bg-card flex flex-col", className)}>
      <div className="p-4 border-b border-border">
        <Button 
          onClick={() => {
            onNewChat();
            onConversationSelect(null);
          }} 
          className="w-full justify-start"
          variant="outline"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nouveau chat
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground p-4">
              Aucune conversation
            </div>
          ) : (
            <div className="space-y-1">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={cn(
                    "group relative rounded-lg p-2 hover:bg-accent cursor-pointer transition-colors",
                    currentConversationId === conversation.id && "bg-accent"
                  )}
                  onClick={() => handleConversationClick(conversation.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {conversation.title}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>{formatRelativeTime(conversation.updated_at)}</span>
                        <span>•</span>
                        <span>{conversation.message_count} messages</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteConversation(conversation.id);
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-border">
        <Button 
          onClick={handleLogout}
          className="w-full justify-start"
          variant="ghost"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Déconnexion
        </Button>
      </div>
    </div>
  );
}