'use client';

import React from 'react';
import HistorySidebar from '@/components/history/HistorySidebar';

export default function HistoryPage() {
  return (
    <div className="flex h-full">
      <div className="w-1/3 border-r">
        <HistorySidebar />
      </div>
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <h2 className="text-xl font-semibold mb-2">Historique des Conversations</h2>
          <p>Sélectionnez une conversation dans la liste à gauche pour l'afficher.</p>
        </div>
      </div>
    </div>
  );
} 