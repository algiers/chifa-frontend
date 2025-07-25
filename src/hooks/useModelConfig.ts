import { useMemo } from 'react';
import { 
  getCurrentModel, 
  getModelConfig, 
  getAvailableModels, 
  getFallbackModel,
  isValidModel,
  type ModelConfig 
} from '@/config/models';

/**
 * Hook pour utiliser la configuration des modèles côté client
 */
export function useModelConfig() {
  const currentModel = useMemo(() => getCurrentModel(), []);
  const currentModelConfig = useMemo(() => getModelConfig(currentModel), [currentModel]);
  const availableModels = useMemo(() => getAvailableModels(), []);
  const fallbackModel = useMemo(() => getFallbackModel(), []);

  return {
    currentModel,
    currentModelConfig,
    availableModels,
    fallbackModel,
    isValidModel,
    getModelConfig,
  };
}

/**
 * Hook pour obtenir les paramètres d'un modèle spécifique
 */
export function useModelParams(modelName?: string) {
  const { currentModel, currentModelConfig } = useModelConfig();
  
  const targetModel = modelName || currentModel;
  const modelConfig = useMemo(() => 
    getModelConfig(targetModel) || currentModelConfig, 
    [targetModel, currentModelConfig]
  );

  return {
    model: targetModel,
    temperature: modelConfig?.defaultTemperature ?? 0.7,
    maxTokens: modelConfig?.defaultMaxTokens ?? 2000,
    supportsStreaming: modelConfig?.supportedFeatures.streaming ?? true,
    supportsFunctionCalling: modelConfig?.supportedFeatures.functionCalling ?? false,
    supportsVision: modelConfig?.supportedFeatures.vision ?? false,
    displayName: modelConfig?.displayName ?? targetModel,
    provider: modelConfig?.provider ?? 'other',
  };
}