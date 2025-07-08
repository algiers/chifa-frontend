/**
 * Configuration centralisée pour LiteLLM côté frontend
 * Permet de changer facilement l'URL du serveur LiteLLM
 */

export const LITELLM_CONFIG = {
  // URL de base du proxy LiteLLM
      API_URL: process.env.NEXT_PUBLIC_LITELLM_API_URL || 'http://litellm.frp.youcef.xyz',
  
  // Clé master pour les opérations administratives
  MASTER_KEY: process.env.NEXT_PUBLIC_LITELLM_MASTER_KEY || 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  
  // Modèle par défaut
  DEFAULT_MODEL: process.env.NEXT_PUBLIC_LITELLM_DEFAULT_MODEL || 'deepseek/deepseek-chat',
  
  // Configuration par défaut pour les appels
  DEFAULT_PARAMS: {
    temperature: 0,
    max_tokens: 4000,
    timeout: 60
  }
} as const;

/**
 * Fonctions utilitaires pour accéder à la configuration
 */
export const getLiteLLMConfig = () => {
  return {
    apiUrl: LITELLM_CONFIG.API_URL,
    masterKey: LITELLM_CONFIG.MASTER_KEY,
    defaultModel: LITELLM_CONFIG.DEFAULT_MODEL,
    defaultParams: LITELLM_CONFIG.DEFAULT_PARAMS
  };
};

/**
 * Retourne l'URL complète pour les endpoints LiteLLM
 */
export const getLiteLLMEndpoints = () => {
  const baseUrl = LITELLM_CONFIG.API_URL;
  
  return {
    chatCompletions: `${baseUrl}/chat/completions`,
    models: `${baseUrl}/v1/models`,
    keys: `${baseUrl}/key`,
    health: `${baseUrl}/health`
  };
};

/**
 * Retourne les headers par défaut pour les appels LiteLLM
 */
export const getLiteLLMHeaders = (apiKey?: string) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  } else if (LITELLM_CONFIG.MASTER_KEY) {
    headers['Authorization'] = `Bearer ${LITELLM_CONFIG.MASTER_KEY}`;
  }
  
  return headers;
};

/**
 * Fonction pour mettre à jour la configuration à chaud (pour les tests)
 */
export const updateLiteLLMConfig = (newConfig: Partial<typeof LITELLM_CONFIG>) => {
  Object.assign(LITELLM_CONFIG, newConfig);
  console.log('[LiteLLM] Configuration mise à jour:', LITELLM_CONFIG);
};

export default LITELLM_CONFIG; 