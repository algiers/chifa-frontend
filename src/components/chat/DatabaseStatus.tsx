'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';

interface DatabaseStatusProps {
  className?: string;
}

interface DatabaseStatusData {
  connected: boolean;
  status: string;
  lastCheck: string;
  error?: string;
}

export default function DatabaseStatus({ className = '' }: DatabaseStatusProps) {
  const { codePs } = useAuthStore();
  const [dbStatus, setDbStatus] = useState<DatabaseStatusData>({
    connected: false,
    status: 'Vérification...',
    lastCheck: new Date().toISOString()
  });
  const [isLoading, setIsLoading] = useState(true);

  const checkDatabaseStatus = async () => {
    if (!codePs) {
      setDbStatus({
        connected: false,
        status: 'Code PS manquant',
        lastCheck: new Date().toISOString()
      });
      setIsLoading(false);
      return;
    }

    try {
      const pharmacyApiUrl = `http://ps${codePs}.frp.youcef.xyz`;
      
      // Test 1: Vérifier si l'API de la pharmacie répond
      const healthResponse = await fetch(`${pharmacyApiUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000) // 5 secondes timeout
      });

      if (!healthResponse.ok) {
        throw new Error(`API pharmacie non accessible (${healthResponse.status})`);
      }

      // Test 2: Vérifier le statut de la base de données
      const dbStatusResponse = await fetch(`${pharmacyApiUrl}/db/status`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });

      if (!dbStatusResponse.ok) {
        throw new Error(`Statut DB non accessible (${dbStatusResponse.status})`);
      }

      const dbStatusData = await dbStatusResponse.json();
      
      // Test 3: Test simple de requête SQL
      const testQueryResponse = await fetch(`${pharmacyApiUrl}/execute_query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: 'SELECT 1 as test;',
          db_id: codePs
        }),
        signal: AbortSignal.timeout(10000) // 10 secondes pour la requête SQL
      });

      if (!testQueryResponse.ok) {
        throw new Error(`Test SQL échoué (${testQueryResponse.status})`);
      }

      const testResult = await testQueryResponse.json();
      
      if (testResult.error) {
        throw new Error(`Erreur SQL: ${testResult.error}`);
      }

      // Si tout est OK
      setDbStatus({
        connected: true,
        status: 'PostgreSQL connecté',
        lastCheck: new Date().toISOString()
      });

    } catch (error: any) {
      console.error('[DatabaseStatus] Error checking database:', error);
      
      let errorMessage = 'Erreur inconnue';
      if (error.name === 'AbortError') {
        errorMessage = 'Timeout de connexion';
      } else if (error.message) {
        errorMessage = error.message;
      }

      setDbStatus({
        connected: false,
        status: 'PostgreSQL déconnecté',
        lastCheck: new Date().toISOString(),
        error: errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Vérifier le statut au montage et toutes les 30 secondes
  useEffect(() => {
    checkDatabaseStatus();
    
    const interval = setInterval(checkDatabaseStatus, 30000); // 30 secondes
    
    return () => clearInterval(interval);
  }, [codePs]);

  // Fonction pour forcer une vérification
  const handleRefresh = () => {
    setIsLoading(true);
    checkDatabaseStatus();
  };

  const getStatusColor = () => {
    if (isLoading) return 'text-yellow-600';
    return dbStatus.connected ? 'text-green-600' : 'text-red-600';
  };

  const getStatusIcon = () => {
    if (isLoading) {
      return (
        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-yellow-600"></div>
      );
    }
    
    return (
      <div className={`w-3 h-3 rounded-full ${
        dbStatus.connected ? 'bg-green-500' : 'bg-red-500'
      }`}></div>
    );
  };

  return (
    <div className={`flex items-center space-x-2 text-sm ${className}`}>
      {getStatusIcon()}
      <span className={getStatusColor()}>
        {isLoading ? 'Vérification DB...' : dbStatus.status}
      </span>
      
      {/* Bouton de refresh */}
      <button
        onClick={handleRefresh}
        disabled={isLoading}
        className="text-gray-400 hover:text-gray-600 transition-colors"
        title="Actualiser le statut de la base de données"
      >
        <svg 
          className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
          />
        </svg>
      </button>

      {/* Afficher l'erreur en tooltip si présente */}
      {dbStatus.error && (
        <span 
          className="text-xs text-red-500 cursor-help" 
          title={`Erreur: ${dbStatus.error}\nDernière vérification: ${new Date(dbStatus.lastCheck).toLocaleString()}`}
        >
          ⚠️
        </span>
      )}
    </div>
  );
}