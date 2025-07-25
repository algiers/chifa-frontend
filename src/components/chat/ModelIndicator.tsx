'use client';

import React from 'react';
import { Brain, Zap, Eye, Settings } from 'lucide-react';
import { useModelParams } from '../../hooks/useModelConfig';
import { cn } from '../../lib/utils';

interface ModelIndicatorProps {
  className?: string;
  showDetails?: boolean;
}

export default function ModelIndicator({ className, showDetails = false }: ModelIndicatorProps) {
  const { 
    displayName, 
    provider, 
    supportsStreaming, 
    supportsFunctionCalling, 
    supportsVision,
    temperature,
    maxTokens
  } = useModelParams();

  const getProviderColor = (provider: string) => {
    switch (provider) {
      case 'openai':
        return 'text-green-600 dark:text-green-400';
      case 'deepseek':
        return 'text-blue-600 dark:text-blue-400';
      case 'anthropic':
        return 'text-purple-600 dark:text-purple-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'openai':
        return '🤖';
      case 'deepseek':
        return '🧠';
      case 'anthropic':
        return '🎭';
      default:
        return '⚡';
    }
  };

  if (!showDetails) {
    return (
      <div className={cn(
        "flex items-center gap-2 px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-xs",
        className
      )}>
        <span className="text-sm">{getProviderIcon(provider)}</span>
        <span className={cn("font-medium", getProviderColor(provider))}>
          {displayName}
        </span>
      </div>
    );
  }

  return (
    <div className={cn(
      "bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 shadow-sm",
      className
    )}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{getProviderIcon(provider)}</span>
        <div>
          <h3 className={cn("font-semibold text-sm", getProviderColor(provider))}>
            {displayName}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
            {provider}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center gap-1">
          <Settings className="w-3 h-3 text-gray-400" />
          <span className="text-gray-600 dark:text-gray-400">
            Temp: {temperature}
          </span>
        </div>
        
        <div className="flex items-center gap-1">
          <Brain className="w-3 h-3 text-gray-400" />
          <span className="text-gray-600 dark:text-gray-400">
            {maxTokens} tokens
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
        <div className={cn(
          "flex items-center gap-1 text-xs",
          supportsStreaming ? "text-green-600 dark:text-green-400" : "text-gray-400"
        )}>
          <Zap className="w-3 h-3" />
          <span>Stream</span>
        </div>
        
        <div className={cn(
          "flex items-center gap-1 text-xs",
          supportsFunctionCalling ? "text-blue-600 dark:text-blue-400" : "text-gray-400"
        )}>
          <Settings className="w-3 h-3" />
          <span>Functions</span>
        </div>
        
        <div className={cn(
          "flex items-center gap-1 text-xs",
          supportsVision ? "text-purple-600 dark:text-purple-400" : "text-gray-400"
        )}>
          <Eye className="w-3 h-3" />
          <span>Vision</span>
        </div>
      </div>
    </div>
  );
}