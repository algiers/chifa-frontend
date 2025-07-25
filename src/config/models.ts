/**
 * Configuration centralisée des modèles IA
 * Permet de gérer les modèles de manière flexible et configurable
 */

export interface ModelConfig {
  name: string;
  displayName: string;
  provider: 'openai' | 'deepseek' | 'anthropic' | 'other';
  defaultTemperature: number;
  defaultMaxTokens: number;
  supportedFeatures: {
    streaming: boolean;
    functionCalling: boolean;
    vision: boolean;
  };
}

export interface ModelSettings {
  defaultModel: string;
  fallbackModel: string;
  models: Record<string, ModelConfig>;
  environment: {
    development: string;
    staging: string;
    production: string;
  };
}

// Configuration des modèles disponibles
const AVAILABLE_MODELS: Record<string, ModelConfig> = {
  'deepseek-chat': {
    name: 'deepseek-chat',
    displayName: 'DeepSeek Chat',
    provider: 'deepseek',
    defaultTemperature: 0.7,
    defaultMaxTokens: 2000,
    supportedFeatures: {
      streaming: true,
      functionCalling: true,
      vision: false,
    },
  },
  'gpt-3.5-turbo': {
    name: 'gpt-3.5-turbo',
    displayName: 'GPT-3.5 Turbo',
    provider: 'openai',
    defaultTemperature: 0.7,
    defaultMaxTokens: 2000,
    supportedFeatures: {
      streaming: true,
      functionCalling: true,
      vision: false,
    },
  },
  'gpt-4': {
    name: 'gpt-4',
    displayName: 'GPT-4',
    provider: 'openai',
    defaultTemperature: 0.7,
    defaultMaxTokens: 2000,
    supportedFeatures: {
      streaming: true,
      functionCalling: true,
      vision: false,
    },
  },
  'gpt-4-vision-preview': {
    name: 'gpt-4-vision-preview',
    displayName: 'GPT-4 Vision',
    provider: 'openai',
    defaultTemperature: 0.7,
    defaultMaxTokens: 2000,
    supportedFeatures: {
      streaming: true,
      functionCalling: true,
      vision: true,
    },
  },
};

// Fonction pour obtenir la configuration depuis les variables d'environnement
function getEnvironmentConfig(): Partial<ModelSettings> {
  const config: Partial<ModelSettings> = {};

  // Modèle par défaut depuis l'environnement
  if (process.env.NEXT_PUBLIC_DEFAULT_MODEL) {
    config.defaultModel = process.env.NEXT_PUBLIC_DEFAULT_MODEL;
  }

  // Modèle de fallback depuis l'environnement
  if (process.env.NEXT_PUBLIC_FALLBACK_MODEL) {
    config.fallbackModel = process.env.NEXT_PUBLIC_FALLBACK_MODEL;
  }

  // Configuration par environnement
  const environment: Partial<ModelSettings['environment']> = {};
  
  if (process.env.NEXT_PUBLIC_DEV_MODEL) {
    environment.development = process.env.NEXT_PUBLIC_DEV_MODEL;
  }
  
  if (process.env.NEXT_PUBLIC_STAGING_MODEL) {
    environment.staging = process.env.NEXT_PUBLIC_STAGING_MODEL;
  }
  
  if (process.env.NEXT_PUBLIC_PROD_MODEL) {
    environment.production = process.env.NEXT_PUBLIC_PROD_MODEL;
  }

  if (Object.keys(environment).length > 0) {
    config.environment = environment as ModelSettings['environment'];
  }

  return config;
}

// Configuration par défaut
const DEFAULT_CONFIG: ModelSettings = {
  defaultModel: 'deepseek-chat',
  fallbackModel: 'gpt-3.5-turbo',
  models: AVAILABLE_MODELS,
  environment: {
    development: 'deepseek-chat',
    staging: 'deepseek-chat',
    production: 'deepseek-chat',
  },
};

// Fusion de la configuration par défaut avec celle de l'environnement
const environmentConfig = getEnvironmentConfig();
export const MODEL_CONFIG: ModelSettings = {
  ...DEFAULT_CONFIG,
  ...environmentConfig,
  models: AVAILABLE_MODELS,
  environment: {
    ...DEFAULT_CONFIG.environment,
    ...environmentConfig.environment,
  },
};

/**
 * Obtient le modèle à utiliser selon l'environnement actuel
 */
export function getCurrentModel(): string {
  const env = process.env.NODE_ENV as keyof ModelSettings['environment'];
  
  // Utiliser le modèle spécifique à l'environnement s'il existe
  if (MODEL_CONFIG.environment[env]) {
    return MODEL_CONFIG.environment[env];
  }
  
  // Sinon utiliser le modèle par défaut
  return MODEL_CONFIG.defaultModel;
}

/**
 * Obtient la configuration d'un modèle spécifique
 */
export function getModelConfig(modelName: string): ModelConfig | null {
  return MODEL_CONFIG.models[modelName] || null;
}

/**
 * Valide qu'un modèle existe dans la configuration
 */
export function isValidModel(modelName: string): boolean {
  return modelName in MODEL_CONFIG.models;
}

/**
 * Obtient le modèle de fallback en cas d'erreur
 */
export function getFallbackModel(): string {
  return MODEL_CONFIG.fallbackModel;
}

/**
 * Obtient tous les modèles disponibles
 */
export function getAvailableModels(): ModelConfig[] {
  return Object.values(MODEL_CONFIG.models);
}

/**
 * Valide la configuration des modèles au démarrage
 */
export function validateModelConfiguration(): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Vérifier que le modèle par défaut existe
  if (!isValidModel(MODEL_CONFIG.defaultModel)) {
    errors.push(`Default model '${MODEL_CONFIG.defaultModel}' is not configured`);
  }

  // Vérifier que le modèle de fallback existe
  if (!isValidModel(MODEL_CONFIG.fallbackModel)) {
    errors.push(`Fallback model '${MODEL_CONFIG.fallbackModel}' is not configured`);
  }

  // Vérifier les modèles par environnement
  Object.entries(MODEL_CONFIG.environment).forEach(([env, model]) => {
    if (!isValidModel(model)) {
      warnings.push(`Model '${model}' for environment '${env}' is not configured`);
    }
  });

  // Vérifier qu'au moins un modèle est configuré
  if (Object.keys(MODEL_CONFIG.models).length === 0) {
    errors.push('No models are configured');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// Validation au chargement du module (côté serveur uniquement)
if (typeof window === 'undefined') {
  const validation = validateModelConfiguration();
  
  if (!validation.isValid) {
    console.error('❌ Model configuration validation failed:');
    validation.errors.forEach(error => console.error(`  - ${error}`));
  }
  
  if (validation.warnings.length > 0) {
    console.warn('⚠️  Model configuration warnings:');
    validation.warnings.forEach(warning => console.warn(`  - ${warning}`));
  }
  
  if (validation.isValid) {
    console.log('✅ Model configuration validated successfully');
    console.log(`📋 Current model: ${getCurrentModel()}`);
    console.log(`🔄 Fallback model: ${getFallbackModel()}`);
  }
}