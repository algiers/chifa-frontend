'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Loading({ 
  message = "Chargement...", 
  size = 'md',
  className = ""
}: LoadingProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="text-center">
        <Loader2 className={`animate-spin mx-auto mb-4 ${sizeClasses[size]}`} />
        <p className="text-muted-foreground text-sm">{message}</p>
      </div>
    </div>
  );
}

export function FullScreenLoading({ message = "Initialisation..." }: { message?: string }) {
  return (
    <div className="flex items-center justify-center h-screen bg-background">
      <Loading message={message} size="lg" />
    </div>
  );
} 