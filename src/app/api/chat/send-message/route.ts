import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

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

interface SendMessageRequest {
  query: string;
  userId: string;
  codePs: string;
  conversationId?: string | null;
}

export async function POST(request: NextRequest) {
  try {
    const { query, userId, codePs, conversationId }: SendMessageRequest = await request.json();
    
    console.log('[API] Send message request:', {
      userId,
      codePs,
      conversationId,
      queryLength: query?.length || 0,
    });

    if (!query || !userId || !codePs) {
      return NextResponse.json(
        { error: 'Missing required fields: query, userId, or codePs' },
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

    if (profile.code_ps !== codePs) {
      console.error('[API] Mismatched codePs:', { profileCodePs: profile.code_ps, requestCodePs: codePs });
      return NextResponse.json(
        { error: 'Mismatched codePs. Access denied.' },
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
    const agentUrl = process.env.CHIFA_LANGGRAPH_AGENT_URL || 'http://localhost:8001/api/v1/agent/invoke';
    
    const agentRequestBody = {
      query: query,
      db_id: profile.code_ps,
      litellm_virtual_key: litellmVirtualKey,
      agent_comm_jwt_secret: process.env.CHIFA_AGENT_COMM_JWT_SECRET || null
    };

    console.log('[API] Sending request to agent:', {
      agentUrl,
      db_id: profile.code_ps,
      conversationId,
    });

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
    let finalConversationId: string | null = null;
    let historySaveError: string | undefined = undefined;

    try {
      let conversation: { id: string; title: string | null; user_id: string; code_ps: string | null } | null = null;

      if (conversationId) {
        const { data: existingConv } = await supabaseAdmin
          .from('chat_conversations')
          .select('id, title, user_id, code_ps')
          .eq('id', conversationId)
          .eq('user_id', userId)
          .single();
        if (existingConv) conversation = existingConv;
      }

      if (!conversation) {
        const conversationTitle = query.substring(0, 70) + (query.length > 70 ? '...' : '');
        const { data: newConvData } = await supabaseAdmin
          .from('chat_conversations')
          .insert({ user_id: userId, code_ps: profile.code_ps, title: conversationTitle })
          .select('id, title, user_id, code_ps')
          .single();
        conversation = newConvData;
      }
      
      if (conversation && conversation.id) {
        finalConversationId = conversation.id;
        const messagesToInsert = [
          {
            conversation_id: finalConversationId,
            user_id: userId,
            role: 'user' as const,
            content: query,
          },
          {
            conversation_id: finalConversationId,
            user_id: userId,
            role: 'assistant' as const,
            content: agentResult.response,
            sql_query: agentResult.sql_query || null,
            sql_results: agentResult.results || agentResult.sqlResults || null,
          }
        ];
        await supabaseAdmin.from('chat_messages').insert(messagesToInsert);
      }
    } catch (historyError) {
      console.error('[API] Error saving conversation to history:', historyError);
      historySaveError = 'Error saving conversation to history.';
    }
    
    const clientResponse = {
      response: agentResult.response,
      sqlQuery: agentResult.sql_query || null,
      sqlResults: agentResult.results || agentResult.sqlResults || null,
      conversationId: finalConversationId,
      ...(historySaveError && { historySaveError }),
    };

    return NextResponse.json(clientResponse);

  } catch (error) {
    console.error('[API] General error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 