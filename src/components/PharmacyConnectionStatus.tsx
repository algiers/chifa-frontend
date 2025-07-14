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
        const res = await fetch(healthUrl, { method: 'GET', cache: 'no-store' });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json();
        if (data.status === 'healthy') {
          if (!stopped) setStatus('connected');
        } else {
          if (!stopped) {
            setStatus('disconnected');
            setError('Service non healthy');
          }
        }
      } catch (e: any) {
        if (!stopped) {
          setStatus('disconnected');
          setError('Erreur de connexion au service local');
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
