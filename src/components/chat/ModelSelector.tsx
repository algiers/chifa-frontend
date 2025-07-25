'use client';

import React, { useState } from 'react';
import { Check, ChevronDown, Brain, Zap, Eye, Settings as SettingsIcon } from 'lucide-react';
import { useModelConfig } from '../../hooks/useModelConfig';
import { cn } from '../../lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

interface ModelSelectorProps {
  onModelChange?: (modelName: string) => void;
  selectedModel?: string;
  className?: string;
}

export default function ModelSelector({ 
  onModelChange, 
  selectedModel, 
  className 
}: ModelSelectorProps) {
  const { currentModel, availableModels, getModelConfig } = useModelConfig();
  const [isOpen, setIsOpen] = useState(false);
  
  const activeModel = selectedModel || currentModel;
  const activeModelConfig = getModelConfig(activeModel);

  const handleModelSelect = (modelName: string) => {
    onModelChange?.(modelName);
    setIsOpen(false);
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

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm",
            className
          )}
        >
          <span className="text-base">{getProviderIcon(activeModelConfig?.provider || 'other')}</span>
          <span className={cn("font-medium", getProviderColor(activeModelConfig?.provider || 'other'))}>
            {activeModelConfig?.displayName || activeModel}
          </span>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Sélectionner un modèle</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {availableModels.map((model) => (
          <DropdownMenuItem
            key={model.name}
            onClick={() => handleModelSelect(model.name)}
            className="flex items-start gap-3 p-3 cursor-pointer"
          >
            <div className="flex items-center gap-2 flex-1">
              <span className="text-base">{getProviderIcon(model.provider)}</span>
              
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className={cn("font-medium text-sm", getProviderColor(model.provider))}>
                    {model.displayName}
                  </span>
                  {activeModel === model.name && (
                    <Check className="w-4 h-4 text-green-500" />
                  )}
                </div>
                
                <div className="text-xs text-gray-500 dark:text-gray-400 capitalize mb-1">
                  {model.provider}
                </div>
                
                <div className="flex items-center gap-3 text-xs">
                  <div className={cn(
                    "flex items-center gap-1",
                    model.supportedFeatures.streaming ? "text-green-600 dark:text-green-400" : "text-gray-400"
                  )}>
                    <Zap className="w-3 h-3" />
                    <span>Stream</span>
                  </div>
                  
                  <div className={cn(
                    "flex items-center gap-1",
                    model.supportedFeatures.functionCalling ? "text-blue-600 dark:text-blue-400" : "text-gray-400"
                  )}>
                    <SettingsIcon className="w-3 h-3" />
                    <span>Functions</span>
                  </div>
                  
                  <div className={cn(
                    "flex items-center gap-1",
                    model.supportedFeatures.vision ? "text-purple-600 dark:text-purple-400" : "text-gray-400"
                  )}>
                    <Eye className="w-3 h-3" />
                    <span>Vision</span>
                  </div>
                </div>
              </div>
            </div>
          </DropdownMenuItem>
        ))}
        
        <DropdownMenuSeparator />
        <div className="p-2 text-xs text-gray-500 dark:text-gray-400">
          Le modèle par défaut est configuré via les variables d'environnement
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}