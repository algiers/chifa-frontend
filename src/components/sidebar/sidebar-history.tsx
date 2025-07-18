'use client';

import { isToday, isYesterday, subMonths, subWeeks } from 'date-fns';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Search } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  useSidebar,
} from '@/components/ui/sidebar';
import { LoaderIcon } from '@/components/icons';
import { SidebarHistoryItem } from './sidebar-history-item';
import { deleteConversation } from '@/lib/utils/conversation-utils';
import { ChifaConversation } from '@/lib/adapters/chat-adapters';
import { usePaginatedConversations } from '@/hooks/usePaginatedConversations';
import { useThrottle } from '@/lib/utils/react-performance';

type GroupedConversations = {
  today: ChifaConversation[];
  yesterday: ChifaConversation[];
  lastWeek: ChifaConversation[];
  lastMonth: ChifaConversation[];
  older: ChifaConversation[];
};

const groupConversationsByDate = (conversations: ChifaConversation[]): GroupedConversations => {
  const now = new Date();
  const oneWeekAgo = subWeeks(now, 1);
  const oneMonthAgo = subMonths(now, 1);

  return conversations.reduce(
    (groups, conversation) => {
      const conversationDate = new Date(conversation.updated_at || conversation.created_at);

      if (isToday(conversationDate)) {
        groups.today.push(conversation);
      } else if (isYesterday(conversationDate)) {
        groups.yesterday.push(conversation);
      } else if (conversationDate > oneWeekAgo) {
        groups.lastWeek.push(conversation);
      } else if (conversationDate > oneMonthAgo) {
        groups.lastMonth.push(conversation);
      } else {
        groups.older.push(conversation);
      }

      return groups;
    },
    {
      today: [],
      yesterday: [],
      lastWeek: [],
      lastMonth: [],
      older: [],
    } as GroupedConversations,
  );
};

interface SidebarHistoryProps {
  user: any;
}

export function SidebarHistory({ user }: SidebarHistoryProps) {
  const { setOpenMobile } = useSidebar();
  const { id } = useParams();
  const router = useRouter();
  
  const [conversations, setConversations] = useState<ChifaConversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Use paginated conversations hook for optimized loading
  const {
    conversations: paginatedConversations,
    isLoading: isPaginationLoading,
    hasMore,
    loadNextPage,
    refresh
  } = usePaginatedConversations({
    pageSize: 30,
    initialPage: 1
  });
  
  // Update local state when paginated conversations change
  useEffect(() => {
    if (paginatedConversations.length > 0) {
      setConversations(paginatedConversations);
      setIsLoading(false);
    }
  }, [paginatedConversations]);
  
  // Load more conversations when scrolling to bottom
  const handleScroll = useThrottle((e: React.UIEvent<HTMLUListElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop - clientHeight < 200 && hasMore && !isPaginationLoading) {
      loadNextPage();
    }
  }, 200);

  const handleDelete = async () => {
    if (!deleteId || !user) return;

    try {
      const success = await deleteConversation(deleteId, user.id);
      
      if (success) {
        // Update local state
        setConversations(prev => prev.filter(conv => conv.id !== deleteId));
        toast.success('Conversation supprimée');
        
        // Refresh the paginated conversations
        refresh();
        
        // Redirect if current conversation was deleted
        if (deleteId === id) {
          router.push('/dashboard');
        }
      } else {
        toast.error('Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast.error('Erreur lors de la suppression');
    }

    setShowDeleteDialog(false);
    setDeleteId(null);
  };

  if (!user) {
    return (
      <SidebarGroup>
        <SidebarGroupContent>
          <div className="px-2 text-muted-foreground w-full flex flex-row justify-center items-center text-sm gap-2">
            Connectez-vous pour sauvegarder vos conversations !
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  if (isLoading) {
    return (
      <SidebarGroup>
        <div className="px-2 py-1 text-xs text-sidebar-foreground/50">
          Aujourd'hui
        </div>
        <SidebarGroupContent>
          <div className="flex flex-col">
            {[44, 32, 28, 64, 52].map((item) => (
              <div
                key={item}
                className="rounded-md h-8 flex gap-2 px-2 items-center"
              >
                <div
                  className="h-4 rounded-md flex-1 max-w-[--skeleton-width] bg-chifa-100 animate-pulse"
                  style={
                    {
                      '--skeleton-width': `${item}%`,
                    } as React.CSSProperties
                  }
                />
              </div>
            ))}
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  if (conversations.length === 0) {
    return (
      <SidebarGroup>
        <SidebarGroupContent>
          <div className="px-2 text-muted-foreground w-full flex flex-row justify-center items-center text-sm gap-2">
            Vos conversations apparaîtront ici une fois que vous commencerez à discuter !
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  const groupedConversations = groupConversationsByDate(conversations);

  return (
    <>
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu onScroll={handleScroll} className="overflow-y-auto max-h-[calc(100vh-200px)]">
            <div className="flex flex-col gap-6">
              {groupedConversations.today.length > 0 && (
                <div>
                  <div className="px-2 py-1 text-xs text-sidebar-foreground/50">
                    Aujourd'hui
                  </div>
                  {groupedConversations.today.map((conversation) => (
                    <SidebarHistoryItem
                      key={conversation.id}
                      conversation={conversation}
                      isActive={conversation.id === id}
                      onDelete={(conversationId) => {
                        setDeleteId(conversationId);
                        setShowDeleteDialog(true);
                      }}
                      setOpenMobile={setOpenMobile}
                    />
                  ))}
                </div>
              )}

              {groupedConversations.yesterday.length > 0 && (
                <div>
                  <div className="px-2 py-1 text-xs text-sidebar-foreground/50">
                    Hier
                  </div>
                  {groupedConversations.yesterday.map((conversation) => (
                    <SidebarHistoryItem
                      key={conversation.id}
                      conversation={conversation}
                      isActive={conversation.id === id}
                      onDelete={(conversationId) => {
                        setDeleteId(conversationId);
                        setShowDeleteDialog(true);
                      }}
                      setOpenMobile={setOpenMobile}
                    />
                  ))}
                </div>
              )}

              {groupedConversations.lastWeek.length > 0 && (
                <div>
                  <div className="px-2 py-1 text-xs text-sidebar-foreground/50">
                    7 derniers jours
                  </div>
                  {groupedConversations.lastWeek.map((conversation) => (
                    <SidebarHistoryItem
                      key={conversation.id}
                      conversation={conversation}
                      isActive={conversation.id === id}
                      onDelete={(conversationId) => {
                        setDeleteId(conversationId);
                        setShowDeleteDialog(true);
                      }}
                      setOpenMobile={setOpenMobile}
                    />
                  ))}
                </div>
              )}

              {groupedConversations.lastMonth.length > 0 && (
                <div>
                  <div className="px-2 py-1 text-xs text-sidebar-foreground/50">
                    30 derniers jours
                  </div>
                  {groupedConversations.lastMonth.map((conversation) => (
                    <SidebarHistoryItem
                      key={conversation.id}
                      conversation={conversation}
                      isActive={conversation.id === id}
                      onDelete={(conversationId) => {
                        setDeleteId(conversationId);
                        setShowDeleteDialog(true);
                      }}
                      setOpenMobile={setOpenMobile}
                    />
                  ))}
                </div>
              )}

              {groupedConversations.older.length > 0 && (
                <div>
                  <div className="px-2 py-1 text-xs text-sidebar-foreground/50">
                    Plus ancien
                  </div>
                  {groupedConversations.older.map((conversation) => (
                    <SidebarHistoryItem
                      key={conversation.id}
                      conversation={conversation}
                      isActive={conversation.id === id}
                      onDelete={(conversationId) => {
                        setDeleteId(conversationId);
                        setShowDeleteDialog(true);
                      }}
                      setOpenMobile={setOpenMobile}
                    />
                  ))}
                </div>
              )}
            </div>
          </SidebarMenu>

          {conversations.length >= 100 && (
            <div className="px-2 text-muted-foreground w-full flex flex-row justify-center items-center text-sm gap-2 mt-8">
              Vous avez atteint la fin de votre historique de conversations.
            </div>
          )}
        </SidebarGroupContent>
      </SidebarGroup>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action ne peut pas être annulée. Cela supprimera définitivement votre
              conversation et la retirera de nos serveurs.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Continuer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}