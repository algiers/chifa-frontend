/**
 * Error handling utilities for the Chifa.ai + Vercel integration
 */

export enum ErrorType {
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  VALIDATION = 'VALIDATION',
  NETWORK = 'NETWORK',
  API = 'API',
  DATABASE = 'DATABASE',
  CREDITS = 'CREDITS',
  STREAMING = 'STREAMING',
  UNKNOWN = 'UNKNOWN',
}

export interface ChifaError {
  type: ErrorType;
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
  userId?: string;
  conversationId?: string;
}

/**
 * Create a standardized error object
 */
export function createError(
  type: ErrorType,
  code: string,
  message: string,
  details?: any,
  userId?: string,
  conversationId?: string
): ChifaError {
  return {
    type,
    code,
    message,
    details,
    timestamp: new Date(),
    userId,
    conversationId,
  };
}

/**
 * Authentication errors
 */
export const AuthErrors = {
  NOT_AUTHENTICATED: () => createError(
    ErrorType.AUTHENTICATION,
    'AUTH_001',
    'Utilisateur non authentifié. Veuillez vous connecter.'
  ),
  
  SESSION_EXPIRED: () => createError(
    ErrorType.AUTHENTICATION,
    'AUTH_002',
    'Votre session a expiré. Veuillez vous reconnecter.'
  ),
  
  INVALID_CREDENTIALS: () => createError(
    ErrorType.AUTHENTICATION,
    'AUTH_003',
    'Identifiants invalides. Vérifiez votre email et mot de passe.'
  ),
  
  REGISTRATION_FAILED: (details?: any) => createError(
    ErrorType.AUTHENTICATION,
    'AUTH_004',
    'Échec de l\'inscription. Veuillez réessayer.',
    details
  ),
};

/**
 * API errors
 */
export const APIErrors = {
  CHIFA_UNAVAILABLE: () => createError(
    ErrorType.API,
    'API_001',
    'Le service Chifa.ai est temporairement indisponible. Veuillez réessayer plus tard.'
  ),
  
  INVALID_REQUEST: (details?: any) => createError(
    ErrorType.API,
    'API_002',
    'Requête invalide. Vérifiez les données envoyées.',
    details
  ),
  
  RATE_LIMITED: () => createError(
    ErrorType.API,
    'API_003',
    'Trop de requêtes. Veuillez patienter avant de réessayer.'
  ),
  
  TIMEOUT: () => createError(
    ErrorType.API,
    'API_004',
    'Délai d\'attente dépassé. Le service met plus de temps que prévu à répondre.'
  ),
};

/**
 * Credits errors
 */
export const CreditsErrors = {
  INSUFFICIENT_CREDITS: (required: number, available: number) => createError(
    ErrorType.CREDITS,
    'CREDITS_001',
    `Crédits insuffisants. Requis: ${required}, Disponibles: ${available}`,
    { required, available }
  ),
  
  CREDITS_EXPIRED: () => createError(
    ErrorType.CREDITS,
    'CREDITS_002',
    'Vos crédits ont expiré. Veuillez renouveler votre abonnement.'
  ),
  
  DEMO_LIMIT_REACHED: () => createError(
    ErrorType.CREDITS,
    'CREDITS_003',
    'Limite de démonstration atteinte. Créez un compte pour continuer.'
  ),
};

/**
 * Database errors
 */
export const DatabaseErrors = {
  CONNECTION_FAILED: () => createError(
    ErrorType.DATABASE,
    'DB_001',
    'Impossible de se connecter à la base de données.'
  ),
  
  QUERY_FAILED: (details?: any) => createError(
    ErrorType.DATABASE,
    'DB_002',
    'Erreur lors de l\'exécution de la requête.',
    details
  ),
  
  CONVERSATION_NOT_FOUND: (conversationId: string) => createError(
    ErrorType.DATABASE,
    'DB_003',
    'Conversation non trouvée.',
    { conversationId }
  ),
};

/**
 * Streaming errors
 */
export const StreamingErrors = {
  STREAM_INTERRUPTED: () => createError(
    ErrorType.STREAMING,
    'STREAM_001',
    'Le flux de données a été interrompu. Veuillez réessayer.'
  ),
  
  STREAM_TIMEOUT: () => createError(
    ErrorType.STREAMING,
    'STREAM_002',
    'Délai d\'attente du flux dépassé.'
  ),
  
  STREAM_PARSE_ERROR: (details?: any) => createError(
    ErrorType.STREAMING,
    'STREAM_003',
    'Erreur lors de l\'analyse du flux de données.',
    details
  ),
};

/**
 * Convert error to user-friendly message
 */
export function getErrorMessage(error: ChifaError | Error | string): string {
  if (typeof error === 'string') {
    return error;
  }
  
  if (error instanceof Error) {
    return error.message || 'Une erreur inattendue s\'est produite.';
  }
  
  if ('message' in error) {
    return error.message;
  }
  
  return 'Une erreur inattendue s\'est produite.';
}

/**
 * Log error for debugging
 */
export function logError(error: ChifaError, context?: string) {
  const logData = {
    ...error,
    context,
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
    url: typeof window !== 'undefined' ? window.location.href : 'server',
  };
  
  console.error('Chifa Error:', logData);
  
  // In production, you might want to send this to an error tracking service
  if (process.env.NODE_ENV === 'production') {
    // Example: Send to error tracking service
    // errorTrackingService.captureError(logData);
  }
}

/**
 * Handle API response errors
 */
export function handleAPIError(response: Response, context?: string): ChifaError {
  let error: ChifaError;
  
  switch (response.status) {
    case 401:
      error = AuthErrors.NOT_AUTHENTICATED();
      break;
    case 403:
      error = createError(
        ErrorType.AUTHORIZATION,
        'AUTH_005',
        'Accès refusé. Vous n\'avez pas les permissions nécessaires.'
      );
      break;
    case 429:
      error = APIErrors.RATE_LIMITED();
      break;
    case 500:
      error = APIErrors.CHIFA_UNAVAILABLE();
      break;
    case 504:
      error = APIErrors.TIMEOUT();
      break;
    default:
      error = createError(
        ErrorType.API,
        'API_999',
        `Erreur API: ${response.status} ${response.statusText}`
      );
  }
  
  logError(error, context);
  return error;
}

/**
 * Retry mechanism for failed operations
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        break;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
  
  throw lastError!;
}

/**
 * Error boundary helper for React components
 */
export function createErrorBoundaryError(error: Error, errorInfo: any): ChifaError {
  return createError(
    ErrorType.UNKNOWN,
    'REACT_001',
    'Erreur dans l\'interface utilisateur.',
    {
      error: error.message,
      stack: error.stack,
      errorInfo,
    }
  );
}

/**
 * Validate and sanitize error messages for display
 */
export function sanitizeErrorMessage(message: string): string {
  // Remove sensitive information that might be in error messages
  return message
    .replace(/password/gi, '***')
    .replace(/token/gi, '***')
    .replace(/key/gi, '***')
    .replace(/secret/gi, '***')
    .replace(/api[_-]?key/gi, '***');
}