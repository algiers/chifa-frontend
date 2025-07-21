'use client';

import Link from 'next/link';
import { memo, useState } from 'react';
import {
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TrashIcon } from '@/components/icons';
import { MoreHorizontal, Pencil } from 'lucide-react';
import { ChifaConversation } from '@/lib/adapters/chat-adapters';
import { updateConversationTitle } from '@/lib/utils/conversation-utils';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';

const PureSidebarHistoryItem = ({
  conversation,
  isActive,
  onDelete,
  setOpenMobile,
}: {
  conversation: ChifaConversation;
  isActive: boolean;
  onDelete: (conversationId: string) => void;
  setOpenMobile: (open: boolean) => void;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(conversation.title);

  const handleSaveTitle = async () => {
    if (editTitle.trim() === conversation.title.trim()) {
      setIsEditing(false);
      return;
    }

    try {
      const success = await updateConversationTitle(
        conversation.id,
        conversation.user_id,
        editTitle.trim()
      );

      if (success) {
        toast.success('Titre mis à jour');
        // Update the conversation title in the parent component
        conversation.title = editTitle.trim();
      } else {
        toast.error('Erreur lors de la mise à jour du titre');
        setEditTitle(conversation.title);
      }
    } catch (error) {
      console.error('Error updating title:', error);
      toast.error('Erreur lors de la mise à jour du titre');
      setEditTitle(conversation.title);
    }

    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveTitle();
    } else if (e.key === 'Escape') {
      setEditTitle(conversation.title);
      setIsEditing(false);
    }
  };

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive}>
        {isEditing ? (
          <div className="flex items-center px-2 py-1">
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleSaveTitle}
              onKeyDown={handleKeyDown}
              className="h-6 text-sm border-none bg-transparent p-0 focus-visible:ring-0"
              autoFocus
            />
          </div>
        ) : (
          <Link href={`/chat/${conversation.id}`} onClick={() => setOpenMobile(false)}>
            <span className="truncate">{conversation.title}</span>
          </Link>
        )}
      </SidebarMenuButton>

      {!isEditing && (
        <DropdownMenu modal={true}>
          <DropdownMenuTrigger asChild>
            <SidebarMenuAction
              className="data-[state=open]:bg-chifa-100 data-[state=open]:text-chifa-600 mr-0.5 hover:bg-chifa-50 hover:text-chifa-600 transition-colors"
              showOnHover={!isActive}
            >
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Plus</span>
            </SidebarMenuAction>
          </DropdownMenuTrigger>

          <DropdownMenuContent side="bottom" align="end">
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => setIsEditing(true)}
            >
              <Pencil className="h-4 w-4" />
              <span>Renommer</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              className="cursor-pointer text-destructive focus:bg-destructive/15 focus:text-destructive dark:text-red-500"
              onSelect={() => onDelete(conversation.id)}
            >
              <TrashIcon />
              <span>Supprimer</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </SidebarMenuItem>
  );
};

export const SidebarHistoryItem = memo(PureSidebarHistoryItem, (prevProps, nextProps) => {
  if (prevProps.isActive !== nextProps.isActive) return false;
  if (prevProps.conversation.title !== nextProps.conversation.title) return false;
  return true;
});