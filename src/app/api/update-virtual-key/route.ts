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

export async function POST(request: NextRequest) {
  try {
    const { newVirtualKey, codePs } = await request.json();
    
    if (!newVirtualKey || !codePs) {
      return NextResponse.json(
        { error: 'Missing newVirtualKey or codePs' },
        { status: 400 }
      );
    }

    console.log(`[API] Updating virtual key for ${codePs}...`);

    // Vérifier si l'entrée existe déjà
    const { data: existing } = await supabaseAdmin
      .from('pharmacy_secrets')
      .select('*')
      .eq('code_ps', codePs)
      .single();

    let result;
    if (existing) {
      console.log('[API] Existing entry found, updating...');
      // Mettre à jour
      result = await supabaseAdmin
        .from('pharmacy_secrets')
        .update({ litellm_virtual_key: newVirtualKey })
        .eq('code_ps', codePs)
        .select();
    } else {
      console.log('[API] Creating new entry...');
      // Créer
      result = await supabaseAdmin
        .from('pharmacy_secrets')
        .insert({ code_ps: codePs, litellm_virtual_key: newVirtualKey })
        .select();
    }

    if (result.error) {
      console.error('[API] Database error:', result.error);
      return NextResponse.json(
        { error: 'Database error: ' + result.error.message },
        { status: 500 }
      );
    }

    console.log('[API] Virtual key updated successfully:', result.data);

    // Vérifier la mise à jour
    const { data: verification } = await supabaseAdmin
      .from('pharmacy_secrets')
      .select('*')
      .eq('code_ps', codePs)
      .single();

    return NextResponse.json({
      success: true,
      message: 'Virtual key updated successfully',
      data: result.data,
      verification: verification
    });

  } catch (error) {
    console.error('[API] Error updating virtual key:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 