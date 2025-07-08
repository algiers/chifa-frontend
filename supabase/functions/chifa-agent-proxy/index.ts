import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

interface ChifaAgentRequestBody {
  query: string;
  db_id: string; // codePs
  conversationId?: string | null;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { query, db_id: requestCodePs, conversationId: requestConversationId }: ChifaAgentRequestBody = await req.json();
    console.log('[Chifa-Agent-Proxy] Incoming request:', {
      method: req.method,
      userAgent: req.headers.get('user-agent'),
      db_id: requestCodePs,
      conversationId: requestConversationId,
      timestamp: new Date().toISOString(),
    });

    if (!query || !requestCodePs) {
      console.error('[Chifa-Agent-Proxy] Missing query or db_id (codePs)');
      return new Response(JSON.stringify({ error: 'Missing query or db_id (codePs)' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const supabaseAdminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('[Chifa-Agent-Proxy] Missing Authorization header');
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdminClient.auth.getUser(token);

    if (userError || !user) {
      console.error('[Chifa-Agent-Proxy] Auth error:', userError);
      return new Response(JSON.stringify({ error: 'Invalid or expired token' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: profile, error: profileError } = await supabaseAdminClient
      .from('profiles')
      .select('code_ps, pharmacy_status, current_plan_id, demo_credits_remaining')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('[Chifa-Agent-Proxy] Profile fetch error:', profileError);
      return new Response(JSON.stringify({ error: 'User profile not found or not configured.' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (profile.code_ps !== requestCodePs) {
      console.error('[Chifa-Agent-Proxy] Mismatched codePs. Access denied.', { profileCodePs: profile.code_ps, requestCodePs });
      return new Response(JSON.stringify({ error: 'Mismatched codePs. Access denied.' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    let canProceed = false;
    if (profile.pharmacy_status === 'active') {
      canProceed = true;
    } else if (profile.pharmacy_status === 'active_demo' && profile.demo_credits_remaining > 0) {
      canProceed = true;
    }

    if (!canProceed) {
      let errorMessage = 'Access denied. Pharmacy not active or demo credits exhausted.';
      if (profile.pharmacy_status === 'pending_payment_approval') errorMessage = 'Pharmacy registration is pending payment approval.';
      else if (profile.pharmacy_status === 'demo_credits_exhausted') errorMessage = 'Demo credits exhausted. Please upgrade your plan.';
      console.error('[Chifa-Agent-Proxy] Access denied:', errorMessage);
      return new Response(JSON.stringify({ error: errorMessage, pharmacyStatus: profile.pharmacy_status }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: secret, error: secretError } = await supabaseAdminClient
      .from('pharmacy_secrets')
      .select('litellm_virtual_key')
      .eq('code_ps', profile.code_ps)
      .single();

    if (secretError || !secret || !secret.litellm_virtual_key) {
      console.error('[Chifa-Agent-Proxy] Secret fetch error:', secretError);
      return new Response(JSON.stringify({ error: 'LiteLLM virtual key not found for this pharmacy.' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const litellmVirtualKey = secret.litellm_virtual_key;

    const agentUrl = Deno.env.get('CHIFA_LANGGRAPH_AGENT_URL');
    if (!agentUrl) {
      console.error('CHIFA_LANGGRAPH_AGENT_URL environment variable is not set.');
      return new Response(JSON.stringify({ error: 'Agent service URL not configured.' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const agentRequestBody = {
      query: query,
      db_id: profile.code_ps,
      litellm_virtual_key: litellmVirtualKey,
      agent_comm_jwt_secret: Deno.env.get('CHIFA_AGENT_COMM_JWT_SECRET') || null
    };
    console.log('[Chifa-Agent-Proxy] Sending request to agent:', {
      agentUrl,
      db_id: profile.code_ps,
      conversationId: requestConversationId,
      timestamp: new Date().toISOString(),
    });
    const agentResponse = await fetch(agentUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(agentRequestBody),
    });
    const agentResult = await agentResponse.json();
    if (!agentResponse.ok) {
      console.error('[Chifa-Agent-Proxy] Agent error:', agentResult.error || agentResult.detail || 'Unknown agent error');
      return new Response(JSON.stringify({ error: agentResult.error || agentResult.detail || 'Failed to get response from Chifa Agent' }), { status: agentResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    console.log('[Chifa-Agent-Proxy] Agent response received:', {
      status: agentResponse.status,
      conversationId: requestConversationId,
      responseSnippet: agentResult.response ? agentResult.response.substring(0, 100) : null,
      timestamp: new Date().toISOString(),
    });

    if (profile.pharmacy_status === 'active_demo') {
      const newCredits = profile.demo_credits_remaining - 1;
      const newStatus = newCredits <= 0 ? 'demo_credits_exhausted' : 'active_demo';
      const { error: updateError } = await supabaseAdminClient
        .from('profiles')
        .update({ demo_credits_remaining: newCredits, pharmacy_status: newStatus })
        .eq('id', user.id);
      if (updateError) {
        console.error('Failed to update demo credits:', updateError);
      }
    }

    let finalConversationId: string | null = null;
    let historySaveError: string | undefined = undefined;

    try {
      let conversation: { id: string; title: string | null; user_id: string; code_ps: string | null } | null = null;

      if (requestConversationId) {
        const { data: existingConv } = await supabaseAdminClient
          .from('chat_conversations')
          .select('id, title, user_id, code_ps')
          .eq('id', requestConversationId)
          .eq('user_id', user.id)
          .single();
        if (existingConv) conversation = existingConv;
      }

      if (!conversation) {
        const conversationTitle = query.substring(0, 70) + (query.length > 70 ? '...' : '');
        const { data: newConvData } = await supabaseAdminClient
          .from('chat_conversations')
          .insert({ user_id: user.id, code_ps: profile.code_ps, title: conversationTitle })
          .select('id, title, user_id, code_ps')
          .single();
        conversation = newConvData;
      }
      
      if (conversation && conversation.id) {
        finalConversationId = conversation.id;
        const messagesToInsert = [
          {
            conversation_id: finalConversationId,
            user_id: user.id,
            role: 'user' as const,
            content: query,
          },
          {
            conversation_id: finalConversationId,
            user_id: user.id,
            role: 'assistant' as const,
            content: agentResult.response,
            sql_query: agentResult.sql_query || null,
            sql_results: agentResult.results || agentResult.sqlResults || null,
          }
        ];
        await supabaseAdminClient.from('chat_messages').insert(messagesToInsert);
      }
    } catch (historyError) {
      console.error('[Chifa-Agent-Proxy] Error saving conversation to history:', historyError);
      historySaveError = 'Error saving conversation to history.';
    }
    
    const clientResponse = {
      response: agentResult.response,
      sqlQuery: agentResult.sql_query || null,
      sqlResults: agentResult.results || agentResult.sqlResults || null,
      conversationId: finalConversationId,
      ...(historySaveError && { historySaveError }),
    };

    return new Response(JSON.stringify(clientResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (e) {
    const error = e as Error;
    console.error('[Chifa-Agent-Proxy] General error in Function:', error);
    return new Response(JSON.stringify({ error: error.message || 'An unexpected error occurred' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
