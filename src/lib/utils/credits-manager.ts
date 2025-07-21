import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { CreditsErrors, createError, ErrorType } from './error-handling';

/**
 * Credits management system for Chifa.ai
 */

export interface UserCredits {
  user_id: string;
  total_credits: number;
  used_credits: number;
  remaining_credits: number;
  demo_credits: number;
  demo_used: number;
  subscription_type: 'free' | 'demo' | 'basic' | 'premium' | 'enterprise';
  credits_expire_at?: string;
  last_reset_at: string;
  created_at: string;
  updated_at: string;
}

export interface CreditTransaction {
  id: string;
  user_id: string;
  conversation_id?: string;
  message_id?: string;
  credits_used: number;
  operation_type: 'chat' | 'sql_query' | 'analysis' | 'export';
  metadata?: {
    model_used?: string;
    processing_time?: number;
    tokens_used?: number;
    [key: string]: any;
  };
  created_at: string;
}

/**
 * Default credit costs for different operations
 */
export const CREDIT_COSTS = {
  SIMPLE_CHAT: 1,
  SQL_QUERY: 2,
  COMPLEX_ANALYSIS: 3,
  DATA_EXPORT: 5,
  STREAMING_CHAT: 1,
} as const;

/**
 * Demo limits
 */
export const DEMO_LIMITS = {
  TOTAL_MESSAGES: 10,
  DAILY_MESSAGES: 5,
  MAX_CONVERSATIONS: 3,
} as const;

/**
 * Get user credits information
 */
export async function getUserCredits(userId: string): Promise<UserCredits | null> {
  const supabase = createSupabaseBrowserClient();

  try {
    const { data, error } = await supabase
      .from('user_credits')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      // If user credits don't exist, create default entry
      if (error.code === 'PGRST116') {
        return await initializeUserCredits(userId);
      }
      console.error('Error fetching user credits:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getUserCredits:', error);
    return null;
  }
}

/**
 * Initialize credits for a new user
 */
export async function initializeUserCredits(userId: string): Promise<UserCredits | null> {
  const supabase = createSupabaseBrowserClient();

  try {
    const now = new Date().toISOString();
    const newCredits: Omit<UserCredits, 'created_at' | 'updated_at'> = {
      user_id: userId,
      total_credits: 0,
      used_credits: 0,
      remaining_credits: 0,
      demo_credits: DEMO_LIMITS.TOTAL_MESSAGES,
      demo_used: 0,
      subscription_type: 'demo',
      last_reset_at: now,
    };

    const { data, error } = await supabase
      .from('user_credits')
      .insert({
        ...newCredits,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error) {
      console.error('Error initializing user credits:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in initializeUserCredits:', error);
    return null;
  }
}

/**
 * Check if user has sufficient credits for an operation
 */
export async function checkCreditsAvailable(
  userId: string,
  requiredCredits: number
): Promise<{ available: boolean; credits: UserCredits | null; error?: any }> {
  const credits = await getUserCredits(userId);
  
  if (!credits) {
    return {
      available: false,
      credits: null,
      error: createError(ErrorType.CREDITS, 'CREDITS_004', 'Impossible de vérifier les crédits'),
    };
  }

  // For demo users, check demo credits
  if (credits.subscription_type === 'demo') {
    const demoRemaining = credits.demo_credits - credits.demo_used;
    if (demoRemaining < requiredCredits) {
      return {
        available: false,
        credits,
        error: CreditsErrors.DEMO_LIMIT_REACHED(),
      };
    }
  } else {
    // For paid users, check regular credits
    if (credits.remaining_credits < requiredCredits) {
      return {
        available: false,
        credits,
        error: CreditsErrors.INSUFFICIENT_CREDITS(requiredCredits, credits.remaining_credits),
      };
    }
  }

  return { available: true, credits };
}

/**
 * Consume credits for an operation
 */
export async function consumeCredits(
  userId: string,
  creditsToConsume: number,
  operationType: CreditTransaction['operation_type'],
  metadata?: CreditTransaction['metadata'],
  conversationId?: string,
  messageId?: string
): Promise<{ success: boolean; remainingCredits: number; error?: any }> {
  const supabase = createSupabaseBrowserClient();

  try {
    // Check if credits are available
    const { available, credits, error } = await checkCreditsAvailable(userId, creditsToConsume);
    
    if (!available || !credits) {
      return { success: false, remainingCredits: 0, error };
    }

    // Start a transaction to update credits and record the transaction
    const now = new Date().toISOString();
    
    // Update user credits
    let updateData: Partial<UserCredits>;
    
    if (credits.subscription_type === 'demo') {
      updateData = {
        demo_used: credits.demo_used + creditsToConsume,
        updated_at: now,
      };
    } else {
      updateData = {
        used_credits: credits.used_credits + creditsToConsume,
        remaining_credits: credits.remaining_credits - creditsToConsume,
        updated_at: now,
      };
    }

    const { error: updateError } = await supabase
      .from('user_credits')
      .update(updateData)
      .eq('user_id', userId);

    if (updateError) {
      console.error('Error updating user credits:', updateError);
      return { 
        success: false, 
        remainingCredits: credits.remaining_credits,
        error: createError(ErrorType.DATABASE, 'DB_004', 'Erreur lors de la mise à jour des crédits')
      };
    }

    // Record the credit transaction
    const transaction: Omit<CreditTransaction, 'id' | 'created_at'> = {
      user_id: userId,
      conversation_id: conversationId,
      message_id: messageId,
      credits_used: creditsToConsume,
      operation_type: operationType,
      metadata,
    };

    const { error: transactionError } = await supabase
      .from('credit_transactions')
      .insert({
        ...transaction,
        id: crypto.randomUUID(),
        created_at: now,
      });

    if (transactionError) {
      console.error('Error recording credit transaction:', transactionError);
      // Don't fail the operation if transaction recording fails
    }

    const newRemainingCredits = credits.subscription_type === 'demo' 
      ? credits.demo_credits - (credits.demo_used + creditsToConsume)
      : credits.remaining_credits - creditsToConsume;

    return { 
      success: true, 
      remainingCredits: newRemainingCredits 
    };
  } catch (error) {
    console.error('Error in consumeCredits:', error);
    return { 
      success: false, 
      remainingCredits: 0,
      error: createError(ErrorType.UNKNOWN, 'CREDITS_999', 'Erreur inattendue lors de la consommation des crédits')
    };
  }
}

/**
 * Get credit usage history for a user
 */
export async function getCreditHistory(
  userId: string,
  limit: number = 50
): Promise<CreditTransaction[]> {
  const supabase = createSupabaseBrowserClient();

  try {
    const { data, error } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching credit history:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getCreditHistory:', error);
    return [];
  }
}

/**
 * Calculate credits needed for a chat operation
 */
export function calculateChatCredits(
  messageContent: string,
  hasSQL: boolean = false,
  isStreaming: boolean = false
): number {
  let credits = CREDIT_COSTS.SIMPLE_CHAT;

  // Add extra credits for SQL operations
  if (hasSQL) {
    credits += CREDIT_COSTS.SQL_QUERY;
  }

  // Complex messages (longer than 500 chars) cost more
  if (messageContent.length > 500) {
    credits += CREDIT_COSTS.COMPLEX_ANALYSIS;
  }

  // Streaming doesn't cost extra currently
  if (isStreaming) {
    // credits += 0; // No extra cost for streaming
  }

  return credits;
}

/**
 * Check if user is in demo mode
 */
export async function isUserInDemoMode(userId: string): Promise<boolean> {
  const credits = await getUserCredits(userId);
  return credits?.subscription_type === 'demo' || false;
}

/**
 * Get demo usage statistics
 */
export async function getDemoUsage(userId: string): Promise<{
  totalMessages: number;
  usedMessages: number;
  remainingMessages: number;
  dailyUsed: number;
  dailyRemaining: number;
} | null> {
  const credits = await getUserCredits(userId);
  
  if (!credits || credits.subscription_type !== 'demo') {
    return null;
  }

  // Get today's usage
  const today = new Date().toISOString().split('T')[0];
  const supabase = createSupabaseBrowserClient();
  
  const { data: todayTransactions } = await supabase
    .from('credit_transactions')
    .select('credits_used')
    .eq('user_id', userId)
    .gte('created_at', `${today}T00:00:00.000Z`)
    .lt('created_at', `${today}T23:59:59.999Z`);

  const dailyUsed = todayTransactions?.reduce((sum: number, t: any) => sum + t.credits_used, 0) || 0;

  return {
    totalMessages: credits.demo_credits,
    usedMessages: credits.demo_used,
    remainingMessages: credits.demo_credits - credits.demo_used,
    dailyUsed,
    dailyRemaining: Math.max(0, DEMO_LIMITS.DAILY_MESSAGES - dailyUsed),
  };
}

/**
 * Reset demo credits (for testing purposes)
 */
export async function resetDemoCredits(userId: string): Promise<boolean> {
  const supabase = createSupabaseBrowserClient();

  try {
    const { error } = await supabase
      .from('user_credits')
      .update({
        demo_used: 0,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('subscription_type', 'demo');

    if (error) {
      console.error('Error resetting demo credits:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in resetDemoCredits:', error);
    return false;
  }
}
/*
*
 * Streaming-specific credit management functions
 */

/**
 * Pre-authorize credits for a streaming operation
 * This reserves credits before starting the stream
 */
export async function preAuthorizeStreamingCredits(
  userId: string,
  estimatedCredits: number
): Promise<{ authorized: boolean; authorizationId?: string; error?: any }> {
  const { available, credits, error } = await checkCreditsAvailable(userId, estimatedCredits);
  
  if (!available || !credits) {
    return { authorized: false, error };
  }

  // Create a temporary authorization record
  const authorizationId = `auth_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // For now, we just return the authorization without actually reserving
  // In a production system, you might want to create a temporary hold
  return { 
    authorized: true, 
    authorizationId,
  };
}

/**
 * Consume credits during streaming with authorization
 */
export async function consumeStreamingCredits(
  userId: string,
  creditsToConsume: number,
  authorizationId: string,
  operationType: CreditTransaction['operation_type'],
  metadata?: CreditTransaction['metadata'],
  conversationId?: string,
  messageId?: string
): Promise<{ success: boolean; remainingCredits: number; error?: any }> {
  // For streaming, we use the same consume logic but with additional metadata
  const streamingMetadata = {
    ...metadata,
    streaming: true,
    authorization_id: authorizationId,
    consumed_at: new Date().toISOString(),
  };

  return await consumeCredits(
    userId,
    creditsToConsume,
    operationType,
    streamingMetadata,
    conversationId,
    messageId
  );
}

/**
 * Calculate dynamic credits based on streaming response
 */
export function calculateStreamingCredits(
  messageContent: string,
  responseContent: string,
  hasSQL: boolean = false,
  processingTimeMs: number = 0
): number {
  let credits = CREDIT_COSTS.STREAMING_CHAT;

  // Add credits based on response length
  const responseLength = responseContent.length;
  if (responseLength > 1000) {
    credits += Math.ceil(responseLength / 1000); // 1 credit per 1000 chars
  }

  // Add extra credits for SQL operations
  if (hasSQL) {
    credits += CREDIT_COSTS.SQL_QUERY;
  }

  // Add credits for complex processing (long processing time)
  if (processingTimeMs > 10000) { // More than 10 seconds
    credits += CREDIT_COSTS.COMPLEX_ANALYSIS;
  }

  // Complex input messages cost more
  if (messageContent.length > 500) {
    credits += 1;
  }

  return Math.max(credits, CREDIT_COSTS.STREAMING_CHAT); // Minimum 1 credit
}

/**
 * Monitor credits during streaming
 */
export class StreamingCreditsMonitor {
  private userId: string;
  private authorizationId: string;
  private estimatedCredits: number;
  private consumedCredits: number = 0;
  private maxCredits: number;

  constructor(
    userId: string, 
    authorizationId: string, 
    estimatedCredits: number, 
    maxCredits: number = 20
  ) {
    this.userId = userId;
    this.authorizationId = authorizationId;
    this.estimatedCredits = estimatedCredits;
    this.maxCredits = maxCredits;
  }

  /**
   * Check if we can continue streaming
   */
  async canContinueStreaming(): Promise<boolean> {
    // Check if we've exceeded our estimated credits
    if (this.consumedCredits >= this.maxCredits) {
      return false;
    }

    // Double-check actual user credits
    const { available } = await checkCreditsAvailable(this.userId, 1);
    return available;
  }

  /**
   * Record credits consumed during streaming
   */
  recordCreditsConsumed(credits: number): void {
    this.consumedCredits += credits;
  }

  /**
   * Get remaining credits for this stream
   */
  getRemainingCredits(): number {
    return Math.max(0, this.maxCredits - this.consumedCredits);
  }

  /**
   * Check if approaching credit limit
   */
  isApproachingLimit(threshold: number = 0.8): boolean {
    return this.consumedCredits >= (this.maxCredits * threshold);
  }

  /**
   * Get streaming statistics
   */
  getStats(): {
    estimated: number;
    consumed: number;
    remaining: number;
    utilizationRate: number;
  } {
    return {
      estimated: this.estimatedCredits,
      consumed: this.consumedCredits,
      remaining: this.getRemainingCredits(),
      utilizationRate: this.consumedCredits / this.estimatedCredits,
    };
  }
}

/**
 * Handle credits error during streaming
 */
export function handleStreamingCreditsError(
  error: any,
  userId: string,
  conversationId?: string
): {
  shouldStop: boolean;
  errorMessage: string;
  errorCode: string;
} {
  if (error?.code === 'CREDITS_001') {
    // Demo limit reached
    return {
      shouldStop: true,
      errorMessage: 'Limite de messages demo atteinte. Veuillez passer à un plan payant.',
      errorCode: 'DEMO_LIMIT_REACHED',
    };
  }

  if (error?.code === 'CREDITS_002') {
    // Insufficient credits
    return {
      shouldStop: true,
      errorMessage: 'Crédits insuffisants pour continuer. Veuillez recharger votre compte.',
      errorCode: 'INSUFFICIENT_CREDITS',
    };
  }

  if (error?.code === 'CREDITS_003') {
    // Daily limit reached
    return {
      shouldStop: true,
      errorMessage: 'Limite quotidienne atteinte. Réessayez demain.',
      errorCode: 'DAILY_LIMIT_REACHED',
    };
  }

  // Generic credits error
  return {
    shouldStop: true,
    errorMessage: 'Erreur de crédits. Veuillez réessayer.',
    errorCode: 'CREDITS_ERROR',
  };
}

/**
 * Validate streaming operation permissions
 */
export async function validateStreamingPermissions(
  userId: string,
  messageContent: string
): Promise<{
  allowed: boolean;
  reason?: string;
  suggestedAction?: string;
}> {
  const credits = await getUserCredits(userId);
  
  if (!credits) {
    return {
      allowed: false,
      reason: 'Impossible de vérifier les permissions',
      suggestedAction: 'Veuillez vous reconnecter',
    };
  }

  // Check if user is in demo mode and has reached limits
  if (credits.subscription_type === 'demo') {
    const demoUsage = await getDemoUsage(userId);
    
    if (demoUsage && demoUsage.remainingMessages <= 0) {
      return {
        allowed: false,
        reason: 'Limite de messages demo atteinte',
        suggestedAction: 'Passez à un plan payant pour continuer',
      };
    }

    if (demoUsage && demoUsage.dailyRemaining <= 0) {
      return {
        allowed: false,
        reason: 'Limite quotidienne atteinte',
        suggestedAction: 'Réessayez demain ou passez à un plan payant',
      };
    }
  }

  // Check message length limits for demo users
  if (credits.subscription_type === 'demo' && messageContent.length > 1000) {
    return {
      allowed: false,
      reason: 'Message trop long pour un compte demo',
      suggestedAction: 'Raccourcissez votre message ou passez à un plan payant',
    };
  }

  return { allowed: true };
}

/**
 * Get credits summary for UI display
 */
export async function getCreditsSummary(userId: string): Promise<{
  type: 'demo' | 'paid';
  remaining: number;
  total: number;
  dailyRemaining?: number;
  dailyTotal?: number;
  resetDate?: string;
  upgradeRequired: boolean;
}> {
  const credits = await getUserCredits(userId);
  
  if (!credits) {
    return {
      type: 'demo',
      remaining: 0,
      total: 0,
      upgradeRequired: true,
    };
  }

  if (credits.subscription_type === 'demo') {
    const demoUsage = await getDemoUsage(userId);
    
    return {
      type: 'demo',
      remaining: demoUsage?.remainingMessages || 0,
      total: credits.demo_credits,
      dailyRemaining: demoUsage?.dailyRemaining,
      dailyTotal: DEMO_LIMITS.DAILY_MESSAGES,
      upgradeRequired: (demoUsage?.remainingMessages || 0) <= 2,
    };
  }

  return {
    type: 'paid',
    remaining: credits.remaining_credits,
    total: credits.total_credits,
    resetDate: credits.credits_expire_at,
    upgradeRequired: credits.remaining_credits <= 5,
  };
}