'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';

export default function ChatRedirectPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  useEffect(() => {
    // Redirect to appropriate page based on authentication status
    if (user) {
      router.push('/chat-v2');
    } else {
      router.push('/login');
    }
  }, [user, router]);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-green-600 mb-4">Chifa.ai</h1>
        <p className="text-muted-foreground">Redirection en cours...</p>
      </div>
    </div>
  );
}