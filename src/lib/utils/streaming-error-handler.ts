/**
 * Advanced Error Handling for Streaming Operations
 * 
 * This module provides comprehensive error handling for streaming
 * with automatic recovery, fallback mechanisms, and user-friendly error messages.
 */

// import { logError } from './error-handling'; // Function doesn't exist

// Error types for streaming operations
export enum StreamingErrorType {
  CONNECTION_TIMEOUT = 'CONNECTION_TIMEOUT',
  NETWORK_ERROR = 'NETWORK_ERROR',
  API_ERROR = 'API_ERROR',
  PARSING_ERROR = 'PARSING_ERROR',
  BUFFER_OVERFLOW = 'BUFFER_OVERFLOW',
  ABORT_ERROR = 'ABORT_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

// Error severity levels
export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

// Streaming error interface
export interface StreamingError {
  type: StreamingErrorType;
  severity: ErrorSeverity;
  message: string;
  userMessage: string;
  retryable: boolean;
  timestamp: number;
  context?: Record<string, any>;
}

/**
 * Enhanced error handler for streaming operations
 */
export class StreamingErrorHandler {
  private errorHistory: StreamingError[] = [];
  private maxHistorySize = 50;

  /**
   * Classify and handle streaming errors
   */
  handleError(error: unknown, context?: Record<string, any>): StreamingError {
    const streamingError = this.classifyError(error, context);
    
    // Add to error history
    this.errorHistory.push(streamingError);
    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory.shift();
    }

    // Log the error
    this.logStreamingError(streamingError);

    return streamingError;
  }

  /**
   * Classify error type and severity
   */
  private classifyError(error: unknown, context?: Record<string, any>): StreamingError {
    const timestamp = Date.now();
    let type = StreamingErrorType.UNKNOWN_ERROR;
    let severity = ErrorSeverity.MEDIUM;
    let message = 'Unknown error occurred';
    let userMessage = 'Une erreur inattendue s\'est produite. Veuillez réessayer.';
    let retryable = true;

    if (error instanceof Error) {
      message = error.message;

      // Connection and network errors
      if (error.name === 'AbortError' || message.includes('aborted')) {
        type = StreamingErrorType.ABORT_ERROR;
        severity = ErrorSeverity.LOW;
        userMessage = 'Opération annulée par l\'utilisateur.';
        retryable = false;
      } else if (message.includes('timeout') || message.includes('TIMEOUT')) {
        type = StreamingErrorType.CONNECTION_TIMEOUT;
        severity = ErrorSeverity.MEDIUM;
        userMessage = 'Délai d\'attente dépassé. Vérifiez votre connexion internet.';
        retryable = true;
      } else if (message.includes('fetch') || message.includes('network') || message.includes('NETWORK')) {
        type = StreamingErrorType.NETWORK_ERROR;
        severity = ErrorSeverity.MEDIUM;
        userMessage = 'Problème de connexion réseau. Veuillez vérifier votre connexion.';
        retryable = true;
      } else if (message.includes('HTTP') || message.includes('status')) {
        type = StreamingErrorType.API_ERROR;
        severity = this.getApiErrorSeverity(message);
        userMessage = this.getApiErrorMessage(message);
        retryable = this.isApiErrorRetryable(message);
      } else if (message.includes('JSON') || message.includes('parse') || message.includes('decode')) {
        type = StreamingErrorType.PARSING_ERROR;
        severity = ErrorSeverity.MEDIUM;
        userMessage = 'Erreur de traitement des données. Veuillez réessayer.';
        retryable = true;
      } else if (message.includes('buffer') || message.includes('memory')) {
        type = StreamingErrorType.BUFFER_OVERFLOW;
        severity = ErrorSeverity.HIGH;
        userMessage = 'Réponse trop volumineuse. Essayez une requête plus simple.';
        retryable = false;
      }
    }

    return {
      type,
      severity,
      message,
      userMessage,
      retryable,
      timestamp,
      context
    };
  }

  /**
   * Determine API error severity based on HTTP status
   */
  private getApiErrorSeverity(message: string): ErrorSeverity {
    if (message.includes('500') || message.includes('502') || message.includes('503')) {
      return ErrorSeverity.HIGH;
    } else if (message.includes('401') || message.includes('403')) {
      return ErrorSeverity.CRITICAL;
    } else if (message.includes('429')) {
      return ErrorSeverity.MEDIUM;
    } else {
      return ErrorSeverity.MEDIUM;
    }
  }

  /**
   * Get user-friendly message for API errors
   */
  private getApiErrorMessage(message: string): string {
    if (message.includes('401')) {
      return 'Session expirée. Veuillez vous reconnecter.';
    } else if (message.includes('403')) {
      return 'Accès non autorisé. Vérifiez vos permissions.';
    } else if (message.includes('429')) {
      return 'Trop de requêtes. Veuillez patienter avant de réessayer.';
    } else if (message.includes('500')) {
      return 'Erreur du serveur. Nos équipes ont été notifiées.';
    } else if (message.includes('502') || message.includes('503')) {
      return 'Service temporairement indisponible. Veuillez réessayer dans quelques minutes.';
    } else {
      return 'Erreur de communication avec le serveur. Veuillez réessayer.';
    }
  }

  /**
   * Determine if API error is retryable
   */
  private isApiErrorRetryable(message: string): boolean {
    // Don't retry authentication or authorization errors
    if (message.includes('401') || message.includes('403')) {
      return false;
    }
    // Don't retry client errors (4xx except 429)
    if (message.includes('400') || message.includes('404') || message.includes('422')) {
      return false;
    }
    // Retry server errors and rate limiting
    return true;
  }

  /**
   * Log streaming error with appropriate level
   */
  private logStreamingError(error: StreamingError): void {
    const logData = {
      type: error.type,
      severity: error.severity,
      message: error.message,
      retryable: error.retryable,
      context: error.context
    };

    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
        console.error('🚨 CRITICAL Streaming Error:', logData);
        // logError(new Error(error.message), 'Streaming Critical', error.context);
        break;
      case ErrorSeverity.HIGH:
        console.error('❌ HIGH Streaming Error:', logData);
        // logError(new Error(error.message), 'Streaming High', error.context);
        break;
      case ErrorSeverity.MEDIUM:
        console.warn('⚠️ MEDIUM Streaming Error:', logData);
        break;
      case ErrorSeverity.LOW:
        console.info('ℹ️ LOW Streaming Error:', logData);
        break;
    }
  }

  /**
   * Get error statistics
   */
  getErrorStats(): {
    total: number;
    byType: Record<StreamingErrorType, number>;
    bySeverity: Record<ErrorSeverity, number>;
    retryableCount: number;
    recentErrors: StreamingError[];
  } {
    const byType = {} as Record<StreamingErrorType, number>;
    const bySeverity = {} as Record<ErrorSeverity, number>;
    let retryableCount = 0;

    // Initialize counters
    Object.values(StreamingErrorType).forEach(type => {
      byType[type] = 0;
    });
    Object.values(ErrorSeverity).forEach(severity => {
      bySeverity[severity] = 0;
    });

    // Count errors
    this.errorHistory.forEach(error => {
      byType[error.type]++;
      bySeverity[error.severity]++;
      if (error.retryable) retryableCount++;
    });

    return {
      total: this.errorHistory.length,
      byType,
      bySeverity,
      retryableCount,
      recentErrors: this.errorHistory.slice(-5) // Last 5 errors
    };
  }

  /**
   * Check if error pattern suggests system issues
   */
  detectSystemIssues(): {
    hasIssues: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const stats = this.getErrorStats();
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check for high error rate
    const recentErrors = this.errorHistory.filter(e => 
      Date.now() - e.timestamp < 5 * 60 * 1000 // Last 5 minutes
    );

    if (recentErrors.length > 10) {
      issues.push('Taux d\'erreur élevé détecté');
      recommendations.push('Vérifier la stabilité de la connexion réseau');
    }

    // Check for repeated connection timeouts
    const timeoutErrors = recentErrors.filter(e => 
      e.type === StreamingErrorType.CONNECTION_TIMEOUT
    );

    if (timeoutErrors.length > 3) {
      issues.push('Timeouts de connexion répétés');
      recommendations.push('Vérifier la latence réseau et la charge du serveur');
    }

    // Check for API errors
    const apiErrors = recentErrors.filter(e => 
      e.type === StreamingErrorType.API_ERROR
    );

    if (apiErrors.length > 5) {
      issues.push('Erreurs API fréquentes');
      recommendations.push('Vérifier l\'état du service backend');
    }

    return {
      hasIssues: issues.length > 0,
      issues,
      recommendations
    };
  }

  /**
   * Clear error history
   */
  clearHistory(): void {
    this.errorHistory = [];
  }
}

/**
 * Global error handler instance
 */
export const globalStreamingErrorHandler = new StreamingErrorHandler();

/**
 * Utility function to handle streaming errors with automatic classification
 */
export function handleStreamingError(
  error: unknown,
  context?: Record<string, any>
): StreamingError {
  return globalStreamingErrorHandler.handleError(error, context);
}

/**
 * Create a resilient streaming wrapper with error handling
 */
export function createResilientStream<T>(
  streamFactory: () => Promise<ReadableStream<T>>,
  maxRetries = 3,
  retryDelay = 1000
): Promise<ReadableStream<T>> {
  return new Promise(async (resolve, reject) => {
    let lastError: StreamingError | null = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const stream = await streamFactory();
        resolve(stream);
        return;
      } catch (error) {
        lastError = handleStreamingError(error, { 
          attempt: attempt + 1, 
          maxRetries: maxRetries + 1 
        });
        
        // Don't retry if error is not retryable or we've reached max attempts
        if (!lastError.retryable || attempt === maxRetries) {
          break;
        }
        
        // Wait before retrying with exponential backoff
        await new Promise(resolve => 
          setTimeout(resolve, retryDelay * Math.pow(2, attempt))
        );
      }
    }
    
    reject(lastError || new Error('Max retries exceeded'));
  });
}

/**
 * Stream health monitor
 */
export class StreamHealthMonitor {
  private healthChecks: Array<{
    timestamp: number;
    success: boolean;
    duration: number;
  }> = [];

  /**
   * Record a health check result
   */
  recordHealthCheck(success: boolean, duration: number): void {
    this.healthChecks.push({
      timestamp: Date.now(),
      success,
      duration
    });

    // Keep only last 100 checks
    if (this.healthChecks.length > 100) {
      this.healthChecks.shift();
    }
  }

  /**
   * Get current health status
   */
  getHealthStatus(): {
    healthy: boolean;
    successRate: number;
    averageDuration: number;
    recentFailures: number;
  } {
    if (this.healthChecks.length === 0) {
      return {
        healthy: true,
        successRate: 100,
        averageDuration: 0,
        recentFailures: 0
      };
    }

    const recentChecks = this.healthChecks.slice(-20); // Last 20 checks
    const successCount = recentChecks.filter(c => c.success).length;
    const successRate = (successCount / recentChecks.length) * 100;
    const averageDuration = recentChecks.reduce((sum, c) => sum + c.duration, 0) / recentChecks.length;
    const recentFailures = recentChecks.filter(c => !c.success).length;

    return {
      healthy: successRate >= 80, // Consider healthy if 80%+ success rate
      successRate,
      averageDuration,
      recentFailures
    };
  }
}

/**
 * Global health monitor instance
 */
export const globalStreamHealthMonitor = new StreamHealthMonitor();