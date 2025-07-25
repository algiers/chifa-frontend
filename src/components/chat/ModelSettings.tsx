'use client';

import React, { useState } from 'react';
import { Settings, Info, RotateCcw } from 'lucide-react';
import { useModelParams } from '../../hooks/useModelConfig';
import { cn } from '../../lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Slider } from '../ui/slider';
import ModelIndicator from './ModelIndicator';

interface ModelSettingsProps {
  onSettingsChange?: (settings: {
    temperature: number;
    maxTokens: number;
  }) => void;
  className?: string;
}

export default function ModelSettings({ onSettingsChange, className }: ModelSettingsProps) {
  const { temperature: defaultTemp, maxTokens: defaultMaxTokens } = useModelParams();
  
  const [isOpen, setIsOpen] = useState(false);
  const [temperature, setTemperature] = useState(defaultTemp);
  const [maxTokens, setMaxTokens] = useState(defaultMaxTokens);

  const handleReset = () => {
    setTemperature(defaultTemp);
    setMaxTokens(defaultMaxTokens);
    onSettingsChange?.({
      temperature: defaultTemp,
      maxTokens: defaultMaxTokens,
    });
  };

  const handleApply = () => {
    onSettingsChange?.({
      temperature,
      maxTokens,
    });
    setIsOpen(false);
  };

  const getTemperatureDescription = (temp: number) => {
    if (temp <= 0.3) return "Très précis et déterministe";
    if (temp <= 0.7) return "Équilibré entre précision et créativité";
    if (temp <= 1.0) return "Créatif et varié";
    return "Très créatif et imprévisible";
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-8 w-8 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200",
            className
          )}
          title="Paramètres du modèle"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Paramètres du modèle</DialogTitle>
          <DialogDescription>
            Ajustez les paramètres pour personnaliser le comportement du modèle IA.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informations du modèle actuel */}
          <ModelIndicator showDetails className="w-full" />

          {/* Température */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Label htmlFor="temperature">Température</Label>
              <div className="group relative">
                <Info className="h-4 w-4 text-gray-400 cursor-help" />
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                  Contrôle la créativité des réponses
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Slider
                id="temperature"
                min={0}
                max={2}
                step={0.1}
                value={[temperature]}
                onValueChange={(value: number[]) => setTemperature(value[0])}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Précis (0.0)</span>
                <span className="font-medium">{temperature.toFixed(1)}</span>
                <span>Créatif (2.0)</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {getTemperatureDescription(temperature)}
              </p>
            </div>
          </div>

          {/* Max Tokens */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Label htmlFor="maxTokens">Longueur maximale</Label>
              <div className="group relative">
                <Info className="h-4 w-4 text-gray-400 cursor-help" />
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                  Limite la longueur des réponses
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Slider
                id="maxTokens"
                min={100}
                max={4000}
                step={100}
                value={[maxTokens]}
                onValueChange={(value: number[]) => setMaxTokens(value[0])}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Court (100)</span>
                <span className="font-medium">{maxTokens} tokens</span>
                <span>Long (4000)</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Environ {Math.round(maxTokens * 0.75)} mots maximum
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Réinitialiser
            </Button>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                Annuler
              </Button>
              <Button
                size="sm"
                onClick={handleApply}
              >
                Appliquer
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
