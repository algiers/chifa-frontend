/**
 * Configuration centralisée pour tous les services externes côté frontend
 * Permet de gérer facilement toutes les URLs des services
 */

// =================================================================
// Services Configuration (Centralisée) - Tous les services externes
// =================================================================

function buildUrl(host: string, port: number, protocol: string = 'http') {
  if (port === 80 || port === 443) {
    return `${protocol}://${host}`;
  }
  return `${protocol}://${host}:${port}`;
}

export const SERVICES_CONFIG = {
  // LiteLLM Configuration
  LITELLM: {
    API_URL: process.env.NEXT_PUBLIC_LITELLM_API_URL || 'http://litellm.frp.youcef.xyz',
    MASTER_KEY: process.env.NEXT_PUBLIC_LITELLM_MASTER_KEY || 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
    DEFAULT_MODEL: process.env.NEXT_PUBLIC_LITELLM_DEFAULT_MODEL || 'deepseek/deepseek-chat',
    DEFAULT_PARAMS: {
      temperature: 0,
      max_tokens: 4000,
      timeout: 60
    }
  },
  
  // LangGraph Agent Configuration
  LANGGRAPH: {
    BASE_URL: process.env.NEXT_PUBLIC_LANGGRAPH_BASE_URL || 'agent.frp.youcef.xyz',
    PORT: parseInt(process.env.NEXT_PUBLIC_LANGGRAPH_PORT || '80'),
    AGENT_ENDPOINT: process.env.CHIFA_LANGGRAPH_AGENT_URL || buildUrl(process.env.NEXT_PUBLIC_LANGGRAPH_BASE_URL || 'agent.frp.youcef.xyz', parseInt(process.env.NEXT_PUBLIC_LANGGRAPH_PORT || '80')) + '/api/v1/agent/invoke',
    TIMEOUT: parseInt(process.env.NEXT_PUBLIC_LANGGRAPH_TIMEOUT || '120')
  },
  
  // API Services Configuration
  API_SERVICE: {
    BASE_URL: process.env.NEXT_PUBLIC_API_SERVICE_BASE_URL || 'api.frp.youcef.xyz',
    PORT: parseInt(process.env.NEXT_PUBLIC_API_SERVICE_PORT || '80'),
    URL: buildUrl(process.env.NEXT_PUBLIC_API_SERVICE_BASE_URL || 'api.frp.youcef.xyz', parseInt(process.env.NEXT_PUBLIC_API_SERVICE_PORT || '80'))
  },
  
  // Streamlit Configuration
  STREAMLIT: {
    BASE_URL: process.env.NEXT_PUBLIC_STREAMLIT_BASE_URL || 'streamlit.frp.youcef.xyz',
    PORT: parseInt(process.env.NEXT_PUBLIC_STREAMLIT_PORT || '80'),
    URL: buildUrl(process.env.NEXT_PUBLIC_STREAMLIT_BASE_URL || 'streamlit.frp.youcef.xyz', parseInt(process.env.NEXT_PUBLIC_STREAMLIT_PORT || '80'))
  },
  
  // Database External Access
  DATABASE: {
    EXTERNAL_URL: process.env.NEXT_PUBLIC_DATABASE_EXTERNAL_URL || 'postgresql://chifa:1480@db.frp.youcef.xyz:5432/chifa_db'
  }
} as const;

// =================================================================
// LiteLLM Functions (rétrocompatibilité)
// =================================================================

export const getLiteLLMConfig = () => {
  return {
    apiUrl: SERVICES_CONFIG.LITELLM.API_URL,
    masterKey: SERVICES_CONFIG.LITELLM.MASTER_KEY,
    defaultModel: SERVICES_CONFIG.LITELLM.DEFAULT_MODEL,
    defaultParams: SERVICES_CONFIG.LITELLM.DEFAULT_PARAMS
  };
};

export const getLiteLLMEndpoints = () => {
  const baseUrl = SERVICES_CONFIG.LITELLM.API_URL;
  
  return {
    chatCompletions: `${baseUrl}/chat/completions`,
    models: `${baseUrl}/v1/models`,
    keys: `${baseUrl}/key`,
    health: `${baseUrl}/health`
  };
};

export const getLiteLLMHeaders = (apiKey?: string) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  } else if (SERVICES_CONFIG.LITELLM.MASTER_KEY) {
    headers['Authorization'] = `Bearer ${SERVICES_CONFIG.LITELLM.MASTER_KEY}`;
  }
  
  return headers;
};

// =================================================================
// LangGraph Functions (nouvelles fonctions)
// =================================================================

export const getLangGraphConfig = () => {
  return {
    baseUrl: SERVICES_CONFIG.LANGGRAPH.BASE_URL,
    port: SERVICES_CONFIG.LANGGRAPH.PORT,
    agentEndpoint: SERVICES_CONFIG.LANGGRAPH.AGENT_ENDPOINT,
    timeout: SERVICES_CONFIG.LANGGRAPH.TIMEOUT
  };
};

export const getLangGraphEndpoints = () => {
  const baseUrl = SERVICES_CONFIG.LANGGRAPH.BASE_URL;
  const port = SERVICES_CONFIG.LANGGRAPH.PORT;
  const baseUrlWithPort = buildUrl(baseUrl, port, 'http');
  
  return {
    agentInvoke: `${baseUrlWithPort}/api/v1/agent/invoke`,
    pharmacyRegister: `${baseUrlWithPort}/api/v1/pharmacy/register`,
    pharmacyStatus: `${baseUrlWithPort}/api/v1/pharmacy/status`,
    pharmacyValidate: `${baseUrlWithPort}/api/v1/pharmacy/validate`,
    health: `${baseUrlWithPort}/health`
  };
};

export const getLangGraphHeaders = () => {
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
};

// =================================================================
// API Services Functions
// =================================================================

export const getAPIServiceConfig = () => {
  return {
    baseUrl: SERVICES_CONFIG.API_SERVICE.BASE_URL,
    port: SERVICES_CONFIG.API_SERVICE.PORT,
    url: SERVICES_CONFIG.API_SERVICE.URL
  };
};

export const getAPIServiceEndpoints = () => {
  const baseUrl = SERVICES_CONFIG.API_SERVICE.URL;
  
  return {
    health: `${baseUrl}/health`,
    docs: `${baseUrl}/docs`
  };
};

// =================================================================
// Streamlit Functions
// =================================================================

export const getStreamlitConfig = () => {
  return {
    baseUrl: SERVICES_CONFIG.STREAMLIT.BASE_URL,
    port: SERVICES_CONFIG.STREAMLIT.PORT,
    url: SERVICES_CONFIG.STREAMLIT.URL
  };
};

// =================================================================
// Global Configuration Functions
// =================================================================

export const getAllEndpoints = () => {
  const litellmEndpoints = getLiteLLMEndpoints();
  const langgraphEndpoints = getLangGraphEndpoints();
  const apiServiceEndpoints = getAPIServiceEndpoints();
  const streamlitConfig = getStreamlitConfig();
  
  return {
    // LiteLLM
    litellm_api: litellmEndpoints.chatCompletions,
    litellm_models: litellmEndpoints.models,
    litellm_keys: litellmEndpoints.keys,
    litellm_health: litellmEndpoints.health,
    
    // LangGraph
    langgraph_agent: langgraphEndpoints.agentInvoke,
    langgraph_pharmacy_register: langgraphEndpoints.pharmacyRegister,
    langgraph_pharmacy_status: langgraphEndpoints.pharmacyStatus,
    langgraph_pharmacy_validate: langgraphEndpoints.pharmacyValidate,
    langgraph_health: langgraphEndpoints.health,
    
    // API Service
    api_service_health: apiServiceEndpoints.health,
    api_service_docs: apiServiceEndpoints.docs,
    
    // Streamlit
    streamlit: streamlitConfig.url
  };
};

// =================================================================
// Hot Reload Functions (pour les tests)
// =================================================================

export const updateLiteLLMConfig = (newConfig: Partial<typeof SERVICES_CONFIG.LITELLM>) => {
  Object.assign(SERVICES_CONFIG.LITELLM, newConfig);
  console.log('[ServicesConfig] LiteLLM configuration mise à jour:', SERVICES_CONFIG.LITELLM);
};

export const updateLangGraphConfig = (newConfig: Partial<typeof SERVICES_CONFIG.LANGGRAPH>) => {
  Object.assign(SERVICES_CONFIG.LANGGRAPH, newConfig);
  console.log('[ServicesConfig] LangGraph configuration mise à jour:', SERVICES_CONFIG.LANGGRAPH);
};

export const updateServiceConfigs = (configs: {
  litellm?: Partial<typeof SERVICES_CONFIG.LITELLM>,
  langgraph?: Partial<typeof SERVICES_CONFIG.LANGGRAPH>,
  apiService?: Partial<typeof SERVICES_CONFIG.API_SERVICE>,
  streamlit?: Partial<typeof SERVICES_CONFIG.STREAMLIT>
}) => {
  if (configs.litellm) updateLiteLLMConfig(configs.litellm);
  if (configs.langgraph) updateLangGraphConfig(configs.langgraph);
  if (configs.apiService) Object.assign(SERVICES_CONFIG.API_SERVICE, configs.apiService);
  if (configs.streamlit) Object.assign(SERVICES_CONFIG.STREAMLIT, configs.streamlit);
  
  console.log('[ServicesConfig] Configuration complète mise à jour:', SERVICES_CONFIG);
};

// =================================================================
// Helper Functions for Easy Access
// =================================================================

// URLs les plus utilisées
export const getAgentInvokeUrl = () => getLangGraphEndpoints().agentInvoke;
export const getChatCompletionsUrl = () => getLiteLLMEndpoints().chatCompletions;
export const getPharmacyRegisterUrl = () => getLangGraphEndpoints().pharmacyRegister;

// Pour logs et debugging
export const logAllEndpoints = () => {
  console.log('🔍 Configuration actuelle des services:');
  console.table(getAllEndpoints());
};

// Export par défaut
export default SERVICES_CONFIG; 