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
  const authHeader = request.headers.get('authorization');
  console.log('[verifyAdminUser] Auth header present:', !!authHeader);
  
  if (!authHeader?.startsWith('Bearer ')) {
    console.log('[verifyAdminUser] No authorization header or invalid format. Header:', authHeader?.substring(0, 20) + '...');
    return null;
  }

  const token = authHeader.substring(7);
  console.log('[verifyAdminUser] Token length:', token.length);
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      console.log('[verifyAdminUser] Auth error or no user:', error);
      return null;
    }

    console.log('[verifyAdminUser] User authenticated:', user.id);

    // Vérifier que l'utilisateur est admin
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.is_admin) {
      console.log('[verifyAdminUser] Profile error or not admin:', profileError, profile?.is_admin);
      return null;
    }

    console.log('[verifyAdminUser] Admin user verified:', user.id);
    return user;
  } catch (error) {
    console.error('[verifyAdminUser] Exception:', error);
    return null;
  }
}

// Fonction pour générer une clé virtuelle
function generateVirtualKey(codePs: string): string {
  const timestamp = Math.floor(Date.now() / 1000);
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  return `sk-${codePs}-${timestamp}-${randomSuffix}`;
}

// Helper pour générer un mot de passe temporaire sécurisé conforme aux exigences Supabase
function generateTempPassword(length = 14) {
  // Supabase exige : au moins 6 caractères, avec majuscules, minuscules, chiffres et caractères spéciaux
  // Utilisons des caractères sûrs pour éviter les problèmes de copie/collage
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const symbols = '!@#$%*+=?'; // Caractères sûrs, éviter les ambigus comme 0, O, l, I
  
  // Garantir au moins 2 caractères de chaque type pour plus de sécurité
  let password = '';
  
  // Ajouter 2 caractères de chaque type
  for (let i = 0; i < 2; i++) {
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];
  }
  
  // Compléter avec des caractères aléatoires pour atteindre la longueur souhaitée
  const allChars = lowercase + uppercase + numbers + symbols;
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Mélanger les caractères pour éviter un pattern prévisible
  const shuffled = password.split('').sort(() => Math.random() - 0.5).join('');
  
  console.log('[generateTempPassword] Generated password length:', shuffled.length);
  return shuffled;
}

// GET /api/admin/pharmacies - Lister toutes les pharmacies ou récupérer une pharmacie spécifique
export async function GET(request: NextRequest) {
  const user = await verifyAdminUser(request);
  if (!user) {
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
  console.log('[POST /api/admin/pharmacies] Request received');
  
  const user = await verifyAdminUser(request);
  if (!user) {
    console.error('[POST /api/admin/pharmacies] Unauthorized access attempt');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('[POST /api/admin/pharmacies] Admin user verified:', user.id);

  try {
    const requestBody = await request.json();
    console.log('[POST /api/admin/pharmacies] Received request body:', {
      ...requestBody,
      password: requestBody.password ? `[${requestBody.password.length} chars]` : 'EMPTY'
    });

    const { 
      email, 
      password, 
      full_name, 
      pharmacy_name, 
      pharmacy_address, 
      code_ps, 
      phone_number,
      virtual_key
    } = requestBody;

    if (!email || !full_name || !pharmacy_name || !code_ps) {
      console.error('[POST /api/admin/pharmacies] Missing required fields:', {
        email: !!email,
        full_name: !!full_name,
        pharmacy_name: !!pharmacy_name,
        code_ps: !!code_ps
      });
      return NextResponse.json({ 
        error: 'Missing required fields: email, full_name, pharmacy_name, code_ps' 
      }, { status: 400 });
    }

    // Générer un mot de passe temporaire si non fourni ou vide
    const tempPassword = (password && password.trim()) ? password.trim() : generateTempPassword();
    
    console.log('[POST /api/admin/pharmacies] Creating pharmacy with temp password length:', tempPassword.length);
    console.log('[POST /api/admin/pharmacies] Virtual key provided:', !!virtual_key);
    console.log('[POST /api/admin/pharmacies] Pharmacy address provided:', !!pharmacy_address);

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
    console.log('[POST /api/admin/pharmacies] About to create auth user with email:', email);
    
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        full_name,
      }
    });

    if (authError) {
      console.error('[POST /api/admin/pharmacies] Auth user creation error:', authError);
      
      // Gérer spécifiquement l'erreur d'email déjà utilisé
      if (authError.message?.includes('already registered') || authError.message?.includes('duplicate')) {
        return NextResponse.json({ 
          error: `L'email "${email}" est déjà utilisé par un autre compte.` 
        }, { status: 409 });
      }
      
      return NextResponse.json({ error: authError.message }, { status: 500 });
    }

    console.log('[POST /api/admin/pharmacies] Auth user created successfully:', authData.user.id);

    // Vérifier si un profil avec cet ID existe déjà (orphelin d'une tentative précédente)
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', authData.user.id)
      .single();

    if (existingProfile) {
      console.log('[POST /api/admin/pharmacies] Profile already exists for user ID, cleaning up...');
      // Supprimer l'ancien profil orphelin
      await supabaseAdmin
        .from('profiles')
        .delete()
        .eq('id', authData.user.id);
      console.log('[POST /api/admin/pharmacies] Old profile cleaned up');
    }

    // Créer le profil dans la table profiles
    console.log('[POST /api/admin/pharmacies] About to create profile with data:', {
      id: authData.user.id,
      email,
      full_name,
      pharmacy_name,
      pharmacy_address,
      code_ps,
      phone_number,
    });

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
        pharmacy_status: 'pending_approval',
        current_plan_id: 'free_demo',
        demo_credits_remaining: 10,
        is_admin: false,
      })
      .select()
      .single();

    if (profileError) {
      console.error('[POST /api/admin/pharmacies] Profile creation error:', profileError);
      
      // Si la création du profil échoue, supprimer l'utilisateur auth
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      
      // Gérer spécifiquement les erreurs de clé dupliquée
      if (profileError.message?.includes('duplicate key') || profileError.code === '23505') {
        if (profileError.message?.includes('code_ps')) {
          return NextResponse.json({ 
            error: `Le code PS "${code_ps}" est déjà utilisé par une autre pharmacie.` 
          }, { status: 409 });
        } else if (profileError.message?.includes('email')) {
          return NextResponse.json({ 
            error: `L'email "${email}" est déjà utilisé par un autre profil.` 
          }, { status: 409 });
        } else {
          return NextResponse.json({ 
            error: `Une pharmacie avec ces informations existe déjà. Détails: ${profileError.message}` 
          }, { status: 409 });
        }
      }
      
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    console.log('[POST /api/admin/pharmacies] Profile created successfully:', profileData.id);

    // Créer une clé virtuelle LiteLLM pour la pharmacie
    const litellmApiUrl = process.env.LITELLM_PROXY_URL || 'http://frp.youcef.xyz:4000';
    const litellmMasterKey = process.env.LITELLM_MASTER_KEY || 'a1b2c3d4-e5f6-7890-1234-567890abcdef';
    
    let finalVirtualKey = virtual_key; // Utiliser la clé fournie si disponible
    
    if (!finalVirtualKey) {
      // Seulement essayer de créer une nouvelle clé si aucune n'est fournie
      try {
        const virtualKeyResponse = await fetch(`${litellmApiUrl}/key/generate`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${litellmMasterKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            models: ['deepseek', 'deepseek-chat', 'deepseek/deepseek-chat'],
            aliases: {
              'gpt-4o-mini': 'deepseek-chat'
            },
            max_budget: 100,
            budget_duration: '1mo',
            metadata: {
              pharmacy_code: code_ps,
              pharmacy_name: pharmacy_name,
              pharmacist_name: full_name,
              created_by: 'admin-api'
            }
          })
        });

        if (!virtualKeyResponse.ok) {
          console.error('[POST /api/admin/pharmacies] Error creating LiteLLM virtual key:', await virtualKeyResponse.text());
          throw new Error('Failed to create LiteLLM virtual key');
        }

        const virtualKeyData = await virtualKeyResponse.json();
        finalVirtualKey = virtualKeyData.key;
      } catch (error) {
        console.error('[POST /api/admin/pharmacies] Error with LiteLLM key generation:', error);
        
        // Générer une clé de secours au format local si l'API LiteLLM échoue
        finalVirtualKey = generateVirtualKey(code_ps);
      }
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
      pharmacy: {
        ...profileData,
        virtual_key: finalVirtualKey
      },
      temp_password: tempPassword // Afficher à l'admin
    });
  } catch (error) {
    console.error('[POST /api/admin/pharmacies] Error:', error);
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
      virtual_key 
    } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Missing pharmacy id' }, { status: 400 });
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