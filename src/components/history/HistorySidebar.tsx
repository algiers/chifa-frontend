'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { HardDriveDownload, MessageSquarePlus, Trash2 } from 'lucide-react'; // Placeholder icons
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useChatStore } from '@/stores/chatStore'; // Ajouté pour clearChat

interface Conversation {
  id: string; // UUID
  title: string | null;
  created_at: string;
  // user_id: string; // Pas besoin de l'afficher ici
  // code_ps: string | null;
}

export default function HistorySidebar() {
  const { user } = useAuthStore();
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();
  const pathname = usePathname();
  const { currentConversationId } = useChatStore();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConversations = async () => {
      if (!user) {
        setIsLoading(false);
        setConversations([]);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const { data, error: dbError } = await supabase
          .from('chat_conversations')
          .select('id, title, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (dbError) throw dbError;
        setConversations(data || []);
      } catch (e: any) {
        console.error('Error fetching conversations:', e);
        setError('Impossible de charger l\'historique.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchConversations();
  }, [user, supabase]);

  const handleNewChat = () => {
    // Clear chat state before starting a new chat
    useChatStore.getState().clearChat();
    useChatStore.getState().setCurrentConversationId(null);
    router.push('/dashboard');
  };
  
  const handleDeleteConversation = async (conversationId: string) => {
    if (!user || !window.confirm("Êtes-vous sûr de vouloir supprimer cette conversation ?")) return;
    try {
        const { error: deleteError } = await supabase
            .from('chat_conversations')
            .delete()
            .eq('id', conversationId)
            .eq('user_id', user.id);

        if (deleteError) throw deleteError;
        
        setConversations(prev => prev.filter(c => c.id !== conversationId));
        
        // If the deleted conversation was active, clear chat and redirect
        if (currentConversationId === conversationId) {
          useChatStore.getState().clearChat();
          useChatStore.getState().setCurrentConversationId(null);
          router.push('/dashboard');
        }

    } catch (e: any) {
        console.error("Failed to delete conversation:", e);
        setError("Erreur lors de la suppression.");
    }
  };


  return (
    <aside className="w-72 bg-gray-50 border-r border-gray-200 p-4 flex flex-col h-full">
      <Button onClick={handleNewChat} className="w-full mb-4">
        <MessageSquarePlus className="w-4 h-4 mr-2" />
        Nouveau Chat
      </Button>
      
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
        Historique
      </h3>
      {isLoading && (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-8 w-full rounded" />)}
        </div>
      )}
      {!isLoading && error && <p className="text-sm text-red-500">{error}</p>}
      {!isLoading && !error && conversations.length === 0 && (
        <p className="text-sm text-gray-500">Aucune conversation pour le moment.</p>
      )}
      
      <nav className="flex-1 overflow-y-auto space-y-1 -mr-2 pr-2"> {/* Simple scrollbar styling */}
        {conversations.map((convo) => (
          <div key={convo.id} className="group flex items-center justify-between rounded-md hover:bg-gray-100">
            <Link
              href={`/dashboard?conversation_id=${convo.id}`} // Ou /chat/${convo.id}
              className={`block w-full px-3 py-2 text-sm rounded-md 
                ${pathname.includes(convo.id) ? 'bg-gray-200 text-gray-900 font-medium' : 'text-gray-700 hover:text-gray-900'}`}
            >
              {convo.title || new Date(convo.created_at).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </Link>
            <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => handleDeleteConversation(convo.id)}
                className="p-1 h-auto opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500"
                aria-label="Supprimer la conversation"
            >
                <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        ))}
      </nav>

      {/* Section pour exporter/importer l'historique - fonctionnalité future */}
      {/* <div className="mt-auto pt-4 border-t border-gray-200">
        <Button variant="outline" className="w-full">
          <HardDriveDownload className="w-4 h-4 mr-2" />
          Exporter l'historique
        </Button>
      </div> */}
    </aside>
  );
}
