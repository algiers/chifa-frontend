'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useChatStore } from '@/stores/chatStore';
import { useAuthStore } from '@/stores/authStore';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Bot, User, Send, StopCircle, RotateCcw, Plus } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Simple debug version without complex rendering
export default function ModernChatInterfaceDebug() {
  console.log('ModernChatInterfaceDebug: Rendering...');
  
  try {
    // Test store access
    const chatStore = useChatStore();
    console.log('Chat store accessed:', !!chatStore);
    
    const authStore = useAuthStore();
    console.log('Auth store accessed:', !!authStore);
    
    const authHook = useSupabaseAuth();
    console.log('Auth hook accessed:', !!authHook);

    return (
      <div className="flex flex-col h-full bg-background p-4">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Bot className="w-16 h-16 text-muted-foreground mb-4 mx-auto" />
            <h2 className="text-2xl font-semibold mb-2">Debug Mode</h2>
            <p className="text-muted-foreground">
              Stores loaded successfully!
            </p>
            <div className="mt-4 text-sm text-muted-foreground">
              <div>Messages: {chatStore.messages?.length || 0}</div>
              <div>Loading: {chatStore.isLoading ? 'Yes' : 'No'}</div>
              <div>Pharmacy Status: {authStore.pharmacyStatus}</div>
              <div>Code PS: {authStore.codePs || 'Not set'}</div>
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error in ModernChatInterfaceDebug:', error);
    return (
      <div className="flex flex-col h-full bg-background p-4">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-red-500">
            <h2 className="text-2xl font-semibold mb-2">Error</h2>
            <p>{error instanceof Error ? error.message : String(error)}</p>
          </div>
        </div>
      </div>
    );
  }
}