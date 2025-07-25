'use client';

import React from 'react';
import { AlertCircle, RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorDisplayProps {
  error: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export default function ErrorDisplay({ error, onRetry, onDismiss, className = '' }: ErrorDisplayProps) {
  return (
    <div className={`bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4 ${className}`}>
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
        
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
            Une erreur s'est produite
          </h3>
          <p className="text-sm text-red-700 dark:text-red-300 text-readable">
            {error}
          </p>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {onRetry && (
            <Button
              onClick={onRetry}
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30"
              title="Réessayer"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          )}
          
          {onDismiss && (
            <Button
              onClick={onDismiss}
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30"
              title="Fermer"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}