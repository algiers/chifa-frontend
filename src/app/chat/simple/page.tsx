'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import ModernChatInterface from '@/components/chat/ModernChatInterface';

export default function SimpleChatPage() {
  const router = useRouter();
  const { user, isLoading } = useAuthStore();
  const isAuthenticated = !!user;

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="flex h-screen bg-background">
      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-hidden">
          <ModernChatInterface />
        </div>
      </div>
    </div>
  );
}