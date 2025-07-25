import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { getAgentInvokeUrl } from '../../../../config/services';
import { getCurrentModel, getModelConfig, getFallbackModel, isValidModel } from '../../../../config/models';

// Client Supabase avec service_role (bypass RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Nouveau type pour la requête au format standard
interface ChatRequest {
  messages: {
    role: 'user' | 'assistant' | 'system' | 'function' | 'tool';
    content: string;
    name?: string;
    function_call?: any;
    tool_calls?: any[];
  }[];
  conversation_id?: string | null;
  user_id: string;
  pharmacy_id: string;
  stream?: boolean;
  model?: string;
  temperature?: number;
  max_tokens?: number;
}

// Pour la compatibilité avec l'ancien format
interface LegacyRequest {
  query: string;
  userId: string;
  codePs: string;
  conversationId?: string | null;
}

async function validateAuthToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.error('[API] Missing authorization header');
    return { error: 'Missing or invalid authorization header', status: 401 };
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  console.log('[API] Validating token (first 50 chars):', token.substring(0, 50) + '...');
  
  try {
    // Create a temporary client with the user's token to validate it
    const supabaseWithToken = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      }
    );
    
    // Try to get the user with their token
    const { data: { user }, error } = await supabaseWithToken.auth.getUser();
    
    if (error || !user) {
      console.error('[API] Token validation failed:', error?.message || 'No user found');
      return { error: 'Invalid or expired token', status: 401 };
    }
    
    console.log('[API] Token validation successful for user:', user.id);
    return { user, error: null };
  } catch (error) {
    console.error('[API] Token validation error:', error);
    return { error: 'Token validation failed', status: 401 };
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('[API] Received chat message request');
    
    // Validate authentication token first
    const authResult = await validateAuthToken(request);
    if (authResult.error) {
      console.error('[API] Authentication failed:', authResult.error);
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const authenticatedUser = authResult.user!;
    
    // Extraire les données de la requête et détecter le format
    const requestData = await request.json();
    
    // Déterminer si c'est le nouveau format ou l'ancien
    const isNewFormat = Array.isArray(requestData.messages);
    
    // Variables pour stocker les données normalisées
    let userId: string;
    let pharmacyId: string;
    let conversationId: string | null | undefined;
    let query: string;
    let messages: ChatRequest['messages'];
    let stream: boolean = false;
    
    // Configuration dynamique du modèle
    const defaultModel = getCurrentModel();
    const defaultModelConfig = getModelConfig(defaultModel);
    
    let model: string = defaultModel;
    let temperature: number = defaultModelConfig?.defaultTemperature ?? 0.7;
    let max_tokens: number = defaultModelConfig?.defaultMaxTokens ?? 2000;
    
    // Normaliser les données selon le format
    if (isNewFormat) {
      // Nouveau format
      const chatRequest = requestData as ChatRequest;
      messages = chatRequest.messages;
      userId = chatRequest.user_id;
      pharmacyId = chatRequest.pharmacy_id;
      conversationId = chatRequest.conversation_id;
      stream = chatRequest.stream || false;
      // Valider et utiliser le modèle demandé ou le modèle par défaut
      const requestedModel = chatRequest.model || defaultModel;
      model = isValidModel(requestedModel) ? requestedModel : defaultModel;
      
      // Si le modèle demandé n'est pas valide, logger un warning
      if (chatRequest.model && !isValidModel(chatRequest.model)) {
        console.warn(`⚠️  Invalid model requested: ${chatRequest.model}, using default: ${defaultModel}`);
      }
      temperature = chatRequest.temperature || 0.7;
      max_tokens = chatRequest.max_tokens || 2000;
      
      // Extraire le dernier message utilisateur
      const userMessage = messages.filter(m => m.role === 'user').pop();
      if (!userMessage) {
        return NextResponse.json(
          { error: 'No user message found in the request' },
          { status: 400 }
        );
      }
      query = userMessage.content;
    } else {
      // Ancien format
      const legacyRequest = requestData as LegacyRequest;
      userId = legacyRequest.userId;
      pharmacyId = legacyRequest.codePs;
      conversationId = legacyRequest.conversationId;
      query = legacyRequest.query;
      
      // Convertir en nouveau format
      messages = [{ role: 'user', content: query }];
    }
    
    console.log('[API] Request validated for user:', authenticatedUser.id);
    
    // Vérifier que l'utilisateur authentifié correspond à l'utilisateur demandé
    if (authenticatedUser.id !== userId) {
      console.error('[API] User ID mismatch:', { authenticatedUserId: authenticatedUser.id, requestedUserId: userId });
      return NextResponse.json(
        { error: 'User ID mismatch. Access denied.' },
        { status: 403 }
      );
    }
    
    console.log('[API] Send message request:', {
      userId,
      pharmacyId,
      conversationId,
      queryLength: query?.length || 0,
      messageCount: messages.length,
      stream,
    });

    if (!query || !userId || !pharmacyId) {
      return NextResponse.json(
        { error: 'Missing required fields: query, user_id, or pharmacy_id' },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur existe et récupérer son profil
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, code_ps, pharmacy_status, current_plan_id, demo_credits_remaining')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      console.error('[API] Profile fetch error:', profileError);
      return NextResponse.json(
        { error: 'User profile not found or not configured.' },
        { status: 403 }
      );
    }

    if (profile.code_ps !== pharmacyId) {
      console.error('[API] Mismatched pharmacy_id:', { profileCodePs: profile.code_ps, requestPharmacyId: pharmacyId });
      return NextResponse.json(
        { error: 'Mismatched pharmacy_id. Access denied.' },
        { status: 403 }
      );
    }

    // Vérifier les permissions
    let canProceed = false;
    if (profile.pharmacy_status === 'active') {
      canProceed = true;
    } else if (profile.pharmacy_status === 'active_demo' && profile.demo_credits_remaining > 0) {
      canProceed = true;
    }

    if (!canProceed) {
      let errorMessage = 'Access denied. Pharmacy not active or demo credits exhausted.';
      if (profile.pharmacy_status === 'pending_payment_approval') {
        errorMessage = 'Pharmacy registration is pending payment approval.';
      } else if (profile.pharmacy_status === 'demo_credits_exhausted') {
        errorMessage = 'Demo credits exhausted. Please upgrade your plan.';
      }
      console.error('[API] Access denied:', errorMessage);
      return NextResponse.json(
        { error: errorMessage, pharmacyStatus: profile.pharmacy_status },
        { status: 403 }
      );
    }

    // Récupérer la clé virtuelle LiteLLM
    const { data: secret, error: secretError } = await supabaseAdmin
      .from('pharmacy_secrets')
      .select('litellm_virtual_key')
      .eq('code_ps', profile.code_ps)
      .single();

    if (secretError || !secret || !secret.litellm_virtual_key) {
      console.error('[API] Secret fetch error:', secretError);
      return NextResponse.json(
        { error: 'LiteLLM virtual key not found for this pharmacy.' },
        { status: 403 }
      );
    }

    const litellmVirtualKey = secret.litellm_virtual_key;

    // Appeler l'agent LangGraph (URL centralisée)
    const agentUrl = process.env.CHIFA_LANGGRAPH_AGENT_URL || getAgentInvokeUrl();
    
    console.log('[API] Agent URL resolved to:', agentUrl);
    
    // Nouveau format pour la requête à l'agent
    const agentRequestBody = {
      messages: messages,
      db_id: profile.code_ps,
      litellm_virtual_key: litellmVirtualKey,
      agent_comm_jwt_secret: process.env.CHIFA_AGENT_COMM_JWT_SECRET || null,
      model: model,
      temperature: temperature,
      max_tokens: max_tokens,
      stream: stream
    };

    // Pour la compatibilité avec l'ancien agent, ajouter aussi le champ query
    if (!isNewFormat) {
      (agentRequestBody as any).query = query;
    }

    console.log('[API] Sending request to agent:', {
      agentUrl,
      db_id: profile.code_ps,
      conversationId,
      stream,
    });

    // Si streaming est activé
    if (stream) {
      const encoder = new TextEncoder();
      const customReadable = new ReadableStream({
        async start(controller) {
          try {
            const agentResponse = await fetch(agentUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(agentRequestBody),
            });
            
            if (!agentResponse.ok) {
              const errorData = await agentResponse.json();
              const errorText = JSON.stringify(errorData);
              controller.enqueue(encoder.encode(`data: ${errorText}\n\n`));
              controller.close();
              return;
            }
            
            const reader = agentResponse.body?.getReader();
            if (!reader) {
              controller.error(new Error('Agent response body is null'));
              return;
            }
            
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              controller.enqueue(value);
            }
            
            controller.close();
          } catch (error) {
            console.error('[API] Streaming error:', error);
            controller.error(error);
          }
        }
      });
      
      // Sauvegarder la conversation et les messages après le streaming
      try {
        await saveConversation(userId, profile.code_ps, query, conversationId, model);
      } catch (error) {
        console.error('[API] Error saving conversation during streaming:', error);
      }
      
      // Mettre à jour les crédits demo si nécessaire
      if (profile.pharmacy_status === 'active_demo') {
        const newCredits = profile.demo_credits_remaining - 1;
        const newStatus = newCredits <= 0 ? 'demo_credits_exhausted' : 'active_demo';
        const { error: updateError } = await supabaseAdmin
          .from('profiles')
          .update({ demo_credits_remaining: newCredits, pharmacy_status: newStatus })
          .eq('id', userId);
        if (updateError) {
          console.error('[API] Failed to update demo credits:', updateError);
        }
      }
      
      return new Response(customReadable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    } else {
      // Traitement standard pour les appels non-streaming
      const agentResponse = await fetch(agentUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(agentRequestBody),
      });

      const agentResult = await agentResponse.json();

      if (!agentResponse.ok) {
        console.error('[API] Agent error:', agentResult.error || agentResult.detail || 'Unknown agent error');
        return NextResponse.json(
          { error: agentResult.error || agentResult.detail || 'Failed to get response from Chifa Agent' },
          { status: agentResponse.status }
        );
      }

      console.log('[API] Agent response received:', {
        status: agentResponse.status,
        conversationId,
        responseSnippet: agentResult.response ? agentResult.response.substring(0, 100) : null,
      });

      // Mettre à jour les crédits demo si nécessaire
      if (profile.pharmacy_status === 'active_demo') {
        const newCredits = profile.demo_credits_remaining - 1;
        const newStatus = newCredits <= 0 ? 'demo_credits_exhausted' : 'active_demo';
        const { error: updateError } = await supabaseAdmin
          .from('profiles')
          .update({ demo_credits_remaining: newCredits, pharmacy_status: newStatus })
          .eq('id', userId);
        if (updateError) {
          console.error('[API] Failed to update demo credits:', updateError);
        }
      }

      // Sauvegarder la conversation
      const finalConversationId = await saveConversation(
        userId, 
        profile.code_ps, 
        query, 
        conversationId, 
        model,
        agentResult.response,
        agentResult.sql_query,
        agentResult.results || agentResult.sqlResults
      );
      
      const clientResponse = {
        response: agentResult.response,
        sqlQuery: agentResult.sql_query || null,
        sqlResults: agentResult.results || agentResult.sqlResults || null,
        conversationId: finalConversationId,
      };

      return NextResponse.json(clientResponse);
    }

  } catch (error) {
    console.error('[API] General error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// Fonction helper pour sauvegarder la conversation et les messages
async function saveConversation(
  userId: string, 
  codePs: string, 
  query: string, 
  conversationId: string | null | undefined,
  model: string,
  response?: string,
  sqlQuery?: string | null,
  sqlResults?: any | null
): Promise<string | null> {
  try {
    let conversation: { id: string; title: string | null; user_id: string; pharmacy_id: string | null } | null = null;

    // Vérifier si la conversation existe déjà
    if (conversationId) {
      const { data: existingConv } = await supabaseAdmin
        .from('conversations')
        .select('id, title, user_id, pharmacy_id')
        .eq('id', conversationId)
        .eq('user_id', userId)
        .single();
      if (existingConv) conversation = existingConv;
    }

    // Créer une nouvelle conversation si nécessaire
    if (!conversation) {
      const conversationTitle = query.substring(0, 70) + (query.length > 70 ? '...' : '');
      const { data: newConvData } = await supabaseAdmin
        .from('conversations')
        .insert({ 
          user_id: userId, 
          pharmacy_id: codePs, 
          title: conversationTitle,
          model: model,
          status: 'active'
        })
        .select('id, title, user_id, pharmacy_id')
        .single();
      conversation = newConvData;
    }
    
    if (conversation && conversation.id) {
      // Ajouter le message utilisateur
      await supabaseAdmin.from('messages').insert({
        conversation_id: conversation.id,
        role: 'user',
        content: JSON.stringify({ text: query }),
        content_text: query
      });
      
      // Ajouter la réponse de l'assistant si disponible
      if (response) {
        const assistantMessageData = {
          conversation_id: conversation.id,
          role: 'assistant',
          content: JSON.stringify({ 
            text: response,
            sql_query: sqlQuery || null,
            sql_results: sqlResults || null
          }),
          content_text: response,
          processing_time_ms: null, // À remplir si disponible
          tokens_used: null, // À remplir si disponible
          cost_cents: null // À remplir si disponible
        };
        
        await supabaseAdmin.from('messages').insert(assistantMessageData);
      }
      
      // Mettre à jour la date de dernière activité de la conversation
      await supabaseAdmin
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversation.id);
      
      return conversation.id;
    }
    
    return null;
  } catch (error) {
    console.error('[API] Error saving conversation:', error);
    return null;
  }
}