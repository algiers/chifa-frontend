'use client';

import React from 'react';

export default function DebugInfo() {
  const debugInfo = {
    defaultModel: process.env.NEXT_PUBLIC_DEFAULT_MODEL,
    fallbackModel: process.env.NEXT_PUBLIC_FALLBACK_MODEL,
    nodeEnv: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  };

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-3 rounded-lg text-xs font-mono max-w-sm">
      <div className="font-bold mb-2">Debug Info</div>
      {Object.entries(debugInfo).map(([key, value]) => (
        <div key={key} className="flex justify-between gap-2">
          <span className="text-gray-300">{key}:</span>
          <span className="text-green-300">{value || 'undefined'}</span>
        </div>
      ))}
    </div>
  );
}