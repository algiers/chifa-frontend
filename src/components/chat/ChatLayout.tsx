'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import ChatSidebar from './ChatSidebar';
import ModernChatInterface from './ModernChatInterface';
import { ThemeToggle } from '@/components/theme-toggle';
import PharmacyConnectionStatus from '@/components/PharmacyConnectionStatus';

interface ChatLayoutProps {
  className?: string;
}

export default function ChatLayout({ className }: ChatLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);

  const handleNewChat = () => {
    setCurrentConversationId(null);
  };

  const handleConversationSelect = (conversationId: string | null) => {
    setCurrentConversationId(conversationId);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className={cn("flex h-screen bg-background border-none", className)}>
      {/* Sidebar avec animation */}
      <div className={cn(
        "transition-all duration-300 ease-in-out",
        isSidebarOpen ? "w-64" : "w-0"
      )}>
        <div className={cn(
          "h-full overflow-hidden",
          !isSidebarOpen && "hidden"
        )}>
          <ChatSidebar 
            onConversationSelect={handleConversationSelect}
            currentConversationId={currentConversationId}
            onNewChat={handleNewChat}
          />
        </div>
      </div>

      {/* Contenu principal */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header avec bouton toggle, thème et connectivité */}
        <header className="flex items-center justify-between p-4 border-b border-border bg-background">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              aria-label="Toggle sidebar"
            >
              {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <h1 className="text-lg font-semibold ml-2">Chifa.ai Assistant</h1>
          </div>
          <div className="flex items-center gap-4">
            {/* Bouton thème (croissant/soleil) */}
            <ThemeToggle />
            {/* Bouton connectivité DB */}
            <PharmacyConnectionStatus />
          </div>
        </header>

        {/* Zone de chat */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <ModernChatInterface 
            className="flex-1"
          />
        </div>
      </div>
    </div>
  );
}
