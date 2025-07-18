'use client';

import { useState, useEffect } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Trash2, Share } from 'lucide-react';
import { useChatStore } from '@/stores/chatStore';
import { useRouter } from 'next/navigation';

interface ChatHeaderProps {
  conversationId: string | null;
}

export function ChatHeader({ conversationId }: ChatHeaderProps) {
  const [title, setTitle] = useState<string>('Nouvelle conversation');
  const [isDeleting, setIsDeleting] = useState(false);
  const { clearChat } = useChatStore();
  const router = useRouter();
  
  useEffect(() => {
    if (conversationId) {
      fetchConversationTitle();
    } else {
      setTitle('Nouvelle conversation');
    }
  }, [conversationId]);
  
  const fetchConversationTitle = async () => {
    if (!conversationId) return;
    
    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase
        .from('chat_conversations')
        .select('title')
        .eq('id', conversationId)
        .single();
      
      if (error) {
        console.error('Error fetching conversation title:', error);
        return;
      }
      
      if (data) {
        setTitle(data.title);
      }
    } catch (error) {
      console.error('Error fetching conversation title:', error);
    }
  };
  
  const handleDeleteConversation = async () => {
    if (!conversationId || isDeleting) return;
    
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette conversation ?')) {
      return;
    }
    
    setIsDeleting(true);
    
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase
        .from('chat_conversations')
        .delete()
        .eq('id', conversationId);
      
      if (error) {
        console.error('Error deleting conversation:', error);
        return;
      }
      
      clearChat();
      router.push('/dashboard');
    } catch (error) {
      console.error('Error deleting conversation:', error);
    } finally {
      setIsDeleting(false);
    }
  };
  
  const handleShareConversation = () => {
    // TODO: Implement sharing functionality
    alert('Fonctionnalité de partage à venir');
  };
  
  return (
    <div className="flex items-center justify-between border-b p-4">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="md:hidden" />
        <h1 className="text-lg font-semibold truncate max-w-[200px] sm:max-w-[300px] md:max-w-[500px]">
          {title}
        </h1>
      </div>
      
      <div className="flex items-center gap-2">
        {conversationId && (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleShareConversation}
                  disabled={isDeleting}
                >
                  <Share className="h-4 w-4" />
                  <span className="sr-only">Partager</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Partager la conversation</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDeleteConversation}
                  disabled={isDeleting}
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Supprimer</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Supprimer la conversation</TooltipContent>
            </Tooltip>
          </>
        )}
      </div>
    </div>
  );
}