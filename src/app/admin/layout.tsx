'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../stores/authStore';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAdmin, isAuthReady } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isAuthReady && !isAdmin) {
      router.push('/login');
    }
  }, [isAuthReady, isAdmin, router]);

  if (!isAuthReady) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Vérification des permissions...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null; // Redirection en cours
  }

  return (
    <div className="h-screen w-full bg-background">
      <main className="flex-1 w-full min-h-screen bg-background">
        {children}
      </main>
    </div>
  );
}
