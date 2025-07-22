import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';

interface Status {
  connected: boolean;
  code_ps?: string;
  service?: string;
  timestamp?: string;
  error?: string;
}

export default function PharmacyConnectionStatus() {
  const codePs = useAuthStore((s) => s.codePs);
  const [status, setStatus] = useState<'connected' | 'disconnected' | 'loading'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!codePs) {
      setStatus('disconnected');
      setError('Code PS non défini');
      return;
    }
    const healthUrl = `http://ps${codePs}.frp.youcef.xyz/health`;
    let stopped = false;
    const fetchStatus = async () => {
      setStatus('loading');
      setError(null);
      try {
        // Test 1: Vérifier que l'API répond
        const healthRes = await fetch(healthUrl, { 
          method: 'GET', 
          cache: 'no-store',
          signal: AbortSignal.timeout(5000)
        });
        
        if (!healthRes.ok) {
          throw new Error(`API non accessible (${healthRes.status})`);
        }

        // Test 2: Tester la base de données avec une requête simple
        const dbTestRes = await fetch(`http://ps${codePs}.frp.youcef.xyz/execute_query`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: 'SELECT 1;',
            db_id: codePs
          }),
          signal: AbortSignal.timeout(8000)
        });

        if (!dbTestRes.ok) {
          throw new Error(`Test DB échoué (${dbTestRes.status})`);
        }

        const dbResult = await dbTestRes.json();
        
        if (dbResult.error) {
          if (dbResult.error.includes('generator didn\'t yield')) {
            throw new Error('PostgreSQL non démarré');
          } else {
            throw new Error(`Erreur DB: ${dbResult.error}`);
          }
        }

        // Si tout est OK
        if (!stopped) {
          setStatus('connected');
          setError(null);
        }
        
      } catch (e: any) {
        if (!stopped) {
          setStatus('disconnected');
          
          if (e.name === 'AbortError') {
            setError('Timeout');
          } else if (e.message.includes('PostgreSQL non démarré')) {
            setError('DB arrêtée');
          } else {
            setError(e.message || 'Erreur connexion');
          }
        }
      }
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 15000);
    return () => {
      stopped = true;
      clearInterval(interval);
    };
  }, [codePs]);

  if (status === 'loading') {
    return <span className="text-gray-400">Vérification connexion...</span>;
  }
  if (status === 'connected') {
    return (
      <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded bg-green-100 text-green-800">
        Connectée
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded bg-red-100 text-red-800">
      Déconnectée{error ? ` : ${error}` : ''}
    </span>
  );
}
