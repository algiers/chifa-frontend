'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';

export default function DebugChatPage() {
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
    <div className="flex flex-col h-screen bg-background p-4">
      <h1 className="text-2xl font-bold mb-4">Chat Debug - User: {user.email}</h1>
      <div className="flex-1 bg-white rounded-lg p-4">
        <p className="text-gray-600">Chat interface should appear here</p>
        <p className="text-sm text-gray-500">User ID: {user.id}</p>
      </div>
    </div>
  );
}