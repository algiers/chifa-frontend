import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface RegisterPharmacyBody {
  codePs: string;
  pharmacyName: string;
  address: string;
  pharmacistName: string;
  phoneNumber: string;
  email: string;
  userId: string;
}


// Génération UUID v4 compatible Deno (crypto.getRandomValues)
function uuidv4() {
  // https://stackoverflow.com/a/2117523/508355
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (crypto.getRandomValues(new Uint8Array(1))[0] & 0xf) >> 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const generateVirtualKey = (): string => {
  return `sk-${uuidv4()}`;
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body: RegisterPharmacyBody = await req.json();
    const {
      codePs,
      pharmacyName,
      address,
      pharmacistName,
      phoneNumber,
      email,
      userId,
    } = body;

    if (!codePs || !pharmacyName || !address || !pharmacistName || !phoneNumber || !email || !userId) {
      return new Response(JSON.stringify({ error: 'Missing required pharmacy details.' }), {
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
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabaseAdminClient.auth.getUser(token);

    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: 'Invalid user token.' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const authUser = userData.user;
    if (authUser.id !== userId) {
      return new Response(JSON.stringify({ error: 'User ID mismatch.' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: existingProfile, error: profileCheckError } = await supabaseAdminClient
      .from('profiles')
      .select('code_ps')
      .eq('code_ps', codePs)
      .maybeSingle();

    if (profileCheckError) {
      throw new Error('Database error while checking pharmacy existence.');
    }
    if (existingProfile) {
      return new Response(JSON.stringify({ error: `Le code PS '${codePs}' est déjà utilisé par un autre compte.` }), { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const litellmVirtualKey = generateVirtualKey();

    const { error: secretInsertError } = await supabaseAdminClient
      .from('pharmacy_secrets')
      .upsert({ 
        code_ps: codePs, 
        litellm_virtual_key: litellmVirtualKey
      }, { onConflict: 'code_ps' });

    if (secretInsertError && secretInsertError.code !== '23505') {
      return new Response(JSON.stringify({ error: 'Failed to store pharmacy credentials.' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { error: profileUpdateError } = await supabaseAdminClient
      .from('profiles')
      .update({
        code_ps: codePs,
        pharmacy_name: pharmacyName,
        pharmacy_address: address,
        phone_number: phoneNumber,
        full_name: pharmacistName,
        pharmacy_status: 'pending_approval',
      })
      .eq('id', userId);

    if (profileUpdateError) {
      return new Response(JSON.stringify({ error: `Failed to update user profile after pharmacy registration: ${profileUpdateError.message}` }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Votre pharmacie a été enregistrée avec succès. Elle est maintenant en attente de validation par notre équipe.',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (e) {
    const error = e as Error;
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
