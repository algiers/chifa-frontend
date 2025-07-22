'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';

export default function ChatDatabaseIndicator() {
  const { codePs } = useAuthStore();
  const [isDbConnected, setIsDbConnected] = useState<boolean | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  const checkDatabaseQuick = async () => {
    if (!codePs) {
      setIsDbConnected(false);
      setLastError('Code PS manquant');
      return;
    }

    try {
      const pharmacyApiUrl = `http://ps${codePs}.frp.youcef.xyz`;
      
      // Test rapide avec un timeout court
      const testResponse = await fetch(`${pharmacyApiUrl}/execute_query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: 'SELECT 1;',
          db_id: codePs
        }),
        signal: AbortSignal.timeout(3000) // 3 secondes seulement
      });

      if (!testResponse.ok) {
        throw new Error(`HTTP ${testResponse.status}`);
      }

      const result = await testResponse.json();
      
      if (result.error && result.error.includes('generator didn\'t yield')) {
        throw new Error('PostgreSQL non démarré');
      }
      
      if (result.error) {
        throw new Error(result.error);
      }

      setIsDbConnected(true);
      setLastError(null);

    } catch (error: any) {
      setIsDbConnected(false);
      
      if (error.name === 'AbortError') {
        setLastError('Timeout');
      } else if (error.message.includes('PostgreSQL non démarré')) {
        setLastError('PostgreSQL arrêté');
      } else {
        setLastError(error.message || 'Erreur DB');
      }
    }
  };

  // Vérifier au montage
  useEffect(() => {
    checkDatabaseQuick();
  }, [codePs]);

  // Ne rien afficher si on n'a pas encore testé
  if (isDbConnected === null) {
    return null;
  }

  // Afficher seulement si la DB est déconnectée (pour alerter l'utilisateur)
  if (!isDbConnected) {
    return (
      <div className="flex items-center justify-center p-3 mb-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
          <span className="text-sm text-red-700 font-medium">
            Base de données déconnectée
          </span>
          {lastError && (
            <span className="text-xs text-red-600">
              ({lastError})
            </span>
          )}
          <button
            onClick={checkDatabaseQuick}
            className="text-xs text-red-600 hover:text-red-800 underline ml-2"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  // Si connecté, afficher un petit indicateur discret
  return (
    <div className="flex items-center justify-center p-1 mb-2">
      <div className="flex items-center space-x-1 text-xs text-green-600">
        <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
        <span>DB connectée</span>
      </div>
    </div>
  );
}