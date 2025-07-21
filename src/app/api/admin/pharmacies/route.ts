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

// Client Supabase normal pour vérifier l'auth
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function verifyAdminUser(request: NextRequest) {
  console.log('[verifyAdminUser] Starting verification...');
  const authHeader = request.headers.get('authorization');
  console.log('[verifyAdminUser] Auth header present:', !!authHeader);
  
  if (!authHeader?.startsWith('Bearer ')) {
    console.log('[verifyAdminUser] No valid Bearer token found');
    return null;
  }

  const token = authHeader.substring(7);
  console.log('[verifyAdminUser] Token extracted, length:', token.length);
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    console.log('[verifyAdminUser] getUser result - user:', !!user, 'error:', !!error);
    
    if (error || !user) {
      console.log('[verifyAdminUser] Auth error or no user:', error?.message);
      return null;
    }

    console.log('[verifyAdminUser] User authenticated, checking admin status for user:', user.id);
    
    // Vérifier que l'utilisateur est admin
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    console.log('[verifyAdminUser] Profile query result - profile:', !!profile, 'error:', !!profileError);
    console.log('[verifyAdminUser] Is admin:', profile?.is_admin);

    if (profileError || !profile?.is_admin) {
      console.log('[verifyAdminUser] Not admin or profile error:', profileError?.message);
      return null;
    }

    console.log('[verifyAdminUser] Admin verification successful');
    return user;
  } catch (error) {
    console.error('[verifyAdminUser] Unexpected error:', error);
    return null;
  }
}

// Fonction pour générer une clé virtuelle
function generateVirtualKey(codePs: string): string {
  const timestamp = Math.floor(Date.now() / 1000);
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  return `sk-${codePs}-${timestamp}-${randomSuffix}`;
}

// Helper pour générer un mot de passe temporaire sécurisé
function generateTempPassword(length = 12) {
  // Supabase exige au moins 6 caractères avec au moins une lettre majuscule, une minuscule et un chiffre
  const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lowercase = 'abcdefghijkmnopqrstuvwxyz';
  const numbers = '23456789';
  const symbols = '!@#$%&*';
  
  // S'assurer qu'on a au moins un de chaque type requis
  let pwd = '';
  pwd += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
  pwd += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
  pwd += numbers.charAt(Math.floor(Math.random() * numbers.length));
  pwd += symbols.charAt(Math.floor(Math.random() * symbols.length));
  
  // Remplir le reste avec tous les caractères
  const allChars = uppercase + lowercase + numbers + symbols;
  for (let i = pwd.length; i < length; i++) {
    pwd += allChars.charAt(Math.floor(Math.random() * allChars.length));
  }
  
  // Mélanger le mot de passe pour éviter un pattern prévisible
  return pwd.split('').sort(() => Math.random() - 0.5).join('');
}

// GET /api/admin/pharmacies - Lister toutes les pharmacies ou récupérer une pharmacie spécifique
export async function GET(request: NextRequest) {
  console.log('[API Admin Pharmacies] GET request received');
  const user = await verifyAdminUser(request);
  console.log('[API Admin Pharmacies] User verification result:', !!user);
  if (!user) {
    console.log('[API Admin Pharmacies] Unauthorized - no admin user');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const pharmacyId = searchParams.get('id');
    const includeVirtualKey = searchParams.get('include_virtual_key') === 'true';

    if (pharmacyId) {
      // Récupérer une pharmacie spécifique avec sa clé virtuelle
      const { data: pharmacy, error } = await supabaseAdmin
        .from('profiles')
        .select('id, pharmacy_name, code_ps, email, pharmacy_status, created_at, is_admin, full_name, phone_number, pharmacy_address')
        .eq('id', pharmacyId)
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      let virtualKey = null;
      if (pharmacy.code_ps) {
        const { data: secretData } = await supabaseAdmin
          .from('pharmacy_secrets')
          .select('litellm_virtual_key')
          .eq('code_ps', pharmacy.code_ps)
          .single();
        
        virtualKey = secretData?.litellm_virtual_key || null;
      }

      return NextResponse.json({
        ...pharmacy,
        virtual_key: virtualKey
      });
    } else {
      // Lister toutes les pharmacies
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('id, pharmacy_name, code_ps, email, pharmacy_status, created_at, is_admin, full_name, phone_number, pharmacy_address')
        .order('created_at', { ascending: false });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Si demandé, inclure les clés virtuelles
      if (includeVirtualKey) {
        const pharmaciesWithKeys = await Promise.all(
          data.map(async (pharmacy) => {
            if (pharmacy.code_ps) {
              const { data: secretData } = await supabaseAdmin
                .from('pharmacy_secrets')
                .select('litellm_virtual_key')
                .eq('code_ps', pharmacy.code_ps)
                .single();
              
              return {
                ...pharmacy,
                virtual_key: secretData?.litellm_virtual_key || null
              };
            }
            return { ...pharmacy, virtual_key: null };
          })
        );
        return NextResponse.json(pharmaciesWithKeys);
      }

      return NextResponse.json(data);
    }
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/pharmacies - Créer une nouvelle pharmacie
export async function POST(request: NextRequest) {
  const user = await verifyAdminUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { 
      email, 
      password, 
      full_name, 
      pharmacy_name, 
      pharmacy_address, 
      code_ps, 
      phone_number,
      virtual_key
    } = await request.json();

    if (!email || !full_name || !pharmacy_name || !code_ps) {
      return NextResponse.json({ 
        error: 'Missing required fields: email, full_name, pharmacy_name, code_ps' 
      }, { status: 400 });
    }

    // Générer un mot de passe temporaire si non fourni
    const tempPassword = password || generateTempPassword();

    // Vérifier que le code PS n'existe pas déjà
    const { data: existingPharmacy } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('code_ps', code_ps)
      .single();

    if (existingPharmacy) {
      return NextResponse.json({ 
        error: `Le code PS "${code_ps}" est déjà utilisé` 
      }, { status: 409 });
    }

    // Créer l'utilisateur dans auth.users
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        full_name,
      }
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 500 });
    }

    // Utiliser la clé virtuelle fournie ou en générer une nouvelle
    const finalVirtualKey = virtual_key || generateVirtualKey(code_ps);

    // Créer le profil dans la table profiles
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: authData.user.id,
        email,
        full_name,
        pharmacy_name,
        pharmacy_address,
        code_ps,
        phone_number,
        pharmacy_status: 'pending',
        current_plan_id: 'free_demo',
        demo_credits_remaining: 10,
        is_admin: false,
      })
      .select()
      .single();

    if (profileError) {
      // Si la création du profil échoue, supprimer l'utilisateur auth
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    // Stocker la clé virtuelle dans pharmacy_secrets
    await supabaseAdmin
      .from('pharmacy_secrets')
      .upsert({ 
        code_ps, 
        litellm_virtual_key: finalVirtualKey 
      }, { onConflict: 'code_ps' });

    return NextResponse.json({
      message: 'Pharmacie créée avec succès',
      pharmacy: profileData,
      virtual_key: finalVirtualKey,
      temp_password: tempPassword // Afficher à l'admin
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/admin/pharmacies - Mettre à jour le statut d'une pharmacie
export async function PUT(request: NextRequest) {
  const user = await verifyAdminUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id, pharmacy_status } = await request.json();

    if (!id || !pharmacy_status) {
      return NextResponse.json({ error: 'Missing id or pharmacy_status' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({ pharmacy_status })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/admin/pharmacies - Mettre à jour les informations d'une pharmacie
export async function PATCH(request: NextRequest) {
  const user = await verifyAdminUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { 
      id, 
      full_name, 
      pharmacy_name, 
      pharmacy_address, 
      code_ps, 
      phone_number, 
      email,
      virtual_key,
      password // <-- Ajout pour la réinitialisation
    } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Missing pharmacy id' }, { status: 400 });
    }

    // Si un mot de passe est fourni, réinitialiser le mot de passe Supabase
    if (password) {
      let newPassword = password;
      if (password === true) {
        newPassword = generateTempPassword();
      }
      
      console.log(`[ADMIN API] Attempting to reset password for user ID: ${id}`);
      console.log(`[ADMIN API] Generated password length: ${newPassword.length}`);
      
      const { data: updateData, error: pwError } = await supabaseAdmin.auth.admin.updateUserById(id, { 
        password: newPassword,
        email_confirm: true // S'assurer que l'email reste confirmé
      });
      
      if (pwError) {
        console.error(`[ADMIN API] Password reset error for user ${id}:`, pwError);
        return NextResponse.json({ 
          error: 'Erreur lors de la réinitialisation du mot de passe: ' + pwError.message,
          details: pwError
        }, { status: 500 });
      }
      
      console.log(`[ADMIN API] Password reset successful for user ${id}`);
      return NextResponse.json({ 
        message: 'Mot de passe réinitialisé avec succès', 
        temp_password: newPassword,
        user_updated: !!updateData
      });
    }

    // Construire l'objet de mise à jour
    const updateData: any = {};
    if (full_name !== undefined) updateData.full_name = full_name;
    if (pharmacy_name !== undefined) updateData.pharmacy_name = pharmacy_name;
    if (pharmacy_address !== undefined) updateData.pharmacy_address = pharmacy_address;
    if (code_ps !== undefined) updateData.code_ps = code_ps;
    if (phone_number !== undefined) updateData.phone_number = phone_number;
    if (email !== undefined) updateData.email = email;

    // Mettre à jour le profil
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('profiles')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    // Mettre à jour la clé virtuelle si fournie
    if (virtual_key !== undefined && profileData.code_ps) {
      await supabaseAdmin
        .from('pharmacy_secrets')
        .upsert({ 
          code_ps: profileData.code_ps, 
          litellm_virtual_key: virtual_key 
        }, { onConflict: 'code_ps' });
    }

    // Récupérer la clé virtuelle actuelle
    const { data: secretData } = await supabaseAdmin
      .from('pharmacy_secrets')
      .select('litellm_virtual_key')
      .eq('code_ps', profileData.code_ps)
      .single();

    return NextResponse.json({
      message: 'Pharmacie mise à jour avec succès',
      pharmacy: profileData,
      virtual_key: secretData?.litellm_virtual_key
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 