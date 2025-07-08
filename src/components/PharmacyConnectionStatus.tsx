import React, { useEffect, useState } from 'react';

interface Status {
  connected: boolean;
  code_ps?: string;
  service?: string;
  timestamp?: string;
  error?: string;
}

export default function PharmacyConnectionStatus({ apiUrl }: { apiUrl: string }) {
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/pharmacy/connected`);
      const data = await res.json();
      setStatus(data);
    } catch (e) {
      setStatus({ connected: false, error: 'Erreur de connexion au service local.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 15000); // 15s polling
    return () => clearInterval(interval);
  }, [apiUrl]);

  if (loading && !status) return <span className="text-gray-400">Vérification connexion...</span>;

  if (status?.connected) {
    return (
      <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded bg-green-100 text-green-800">
        Connectée {status.code_ps ? `(${status.code_ps})` : ''}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded bg-red-100 text-red-800">
      Déconnectée {status?.error ? `: ${status.error}` : ''}
    </span>
  );
}
