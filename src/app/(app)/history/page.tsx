'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HistoryRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Rediriger vers le dashboard car l'historique est maintenant intégré dans la sidebar
    router.replace('/dashboard');
  }, [router]);

  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Redirection vers le dashboard...</p>
      </div>
    </div>
  );
}