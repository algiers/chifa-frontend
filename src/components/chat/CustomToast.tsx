'use client';

import React from 'react';
import { CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';

interface CustomToastProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  onClose?: () => void;
}

export default function CustomToast({ type, title, message, onClose }: CustomToastProps) {
  const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertCircle,
    info: Info
  };

  const colors = {
    success: 'from-green-500 to-emerald-500',
    error: 'from-red-500 to-rose-500',
    warning: 'from-yellow-500 to-orange-500',
    info: 'from-blue-500 to-cyan-500'
  };

  const bgColors = {
    success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
    info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
  };

  const Icon = icons[type];

  return (
    <div className={`${bgColors[type]} border rounded-lg p-4 shadow-lg glass-effect subtle-bounce max-w-sm`}>
      <div className="flex items-start gap-3">
        <div className={`p-1 rounded-full bg-gradient-to-r ${colors[type]}`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {title}
          </h4>
          {message && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 text-readable">
              {message}
            </p>
          )}
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <XCircle className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}