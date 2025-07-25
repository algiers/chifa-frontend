'use client';

import React, { useState } from 'react';
import { cn } from '../../lib/utils';
import { Sparkles } from 'lucide-react';
import ChatSidebarV2 from './ChatSidebarV2';
import ChatUIGemini from './ChatUIGemini';
import PharmacyConnectionStatus from '../PharmacyConnectionStatus';
import ThemeToggle from './ThemeToggle';

interface ChatLayoutProps {
  className?: string;
}

export default function ChatLayout({ className }: ChatLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);

  const handleNewChat = () => {
    setCurrentConversationId(null);
  };

  const handleConversationSelect = (conversationId: string | null) => {
    setCurrentConversationId(conversationId);
  };

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className={cn("flex h-screen bg-white dark:bg-gray-900", className)}>
      {/* Sidebar ChatGPT-like */}
      <ChatSidebarV2 
        onConversationSelect={handleConversationSelect}
        currentConversationId={currentConversationId}
        onNewChat={handleNewChat}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={toggleSidebarCollapse}
      />

      {/* Contenu principal */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Zone de chat */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <ChatUIGemini />
        </div>
      </div>
    </div>
  );
}