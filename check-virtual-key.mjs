import { createClient } from '@supabase/supabase-js';

// Configuration
const SUPABASE_URL = 'https://ddeibfjxpwnisguehnmo.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkZWliZmp4cHduaXNndWVobm1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDQ2MDc0MywiZXhwIjoyMDY2MDM2NzQzfQ.HD29pSZ6XbYr21TX7ybJxDXbh8jXAoen2Zs1DZcmCKY';
// URL centralisée - pour changer l'URL, modifier src/config/litellm.ts
const LITELLM_PROXY_URL = 'http://litellm.frp.youcef.xyz';
const LITELLM_MASTER_KEY = 'a1b2c3d4-e5f6-7890-1234-567890abcdef';

const CODE_PS = '0701041085';

async function checkAndCreateVirtualKey() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  
  try {
    // 1. Vérifier si la clé virtuelle existe
    console.log('🔍 Vérification de la clé virtuelle pour code_ps:', CODE_PS);
    
    const { data: existingSecret, error: checkError } = await supabase
      .from('pharmacy_secrets')
      .select('litellm_virtual_key')
      .eq('code_ps', CODE_PS)
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Erreur lors de la vérification:', checkError);
      return;
    }
    
    if (existingSecret && existingSecret.litellm_virtual_key) {
      console.log('✅ Clé virtuelle trouvée:', existingSecret.litellm_virtual_key.substring(0, 20) + '...');
      return existingSecret.litellm_virtual_key;
    }
    
    console.log('⚠️  Clé virtuelle manquante, création en cours...');
    
    // 2. Créer une clé virtuelle via LiteLLM
    const createKeyResponse = await fetch(`${LITELLM_PROXY_URL}/key/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LITELLM_MASTER_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        models: ['deepseek-chat'],
        aliases: {
          'gpt-4o-mini': 'deepseek-chat'
        },
        max_budget: 100,
        budget_duration: '1mo',
        metadata: {
          pharmacy_code: CODE_PS,
          created_by: 'debug-script'
        }
      })
    });
    
    if (!createKeyResponse.ok) {
      const errorText = await createKeyResponse.text();
      console.error('❌ Erreur lors de la création de la clé virtuelle:', errorText);
      return;
    }
    
    const keyData = await createKeyResponse.json();
    const virtualKey = keyData.key;
    
    console.log('✅ Clé virtuelle créée:', virtualKey.substring(0, 20) + '...');
    
    // 3. Sauvegarder dans Supabase
    const { error: insertError } = await supabase
      .from('pharmacy_secrets')
      .upsert({
        code_ps: CODE_PS,
        litellm_virtual_key: virtualKey,
        updated_at: new Date().toISOString()
      });
    
    if (insertError) {
      console.error('❌ Erreur lors de la sauvegarde:', insertError);
      return;
    }
    
    console.log('✅ Clé virtuelle sauvegardée avec succès !');
    return virtualKey;
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter le script
checkAndCreateVirtualKey().then(() => {
  console.log('🎉 Script terminé');
  process.exit(0);
}).catch(error => {
  console.error('💥 Erreur fatale:', error);
  process.exit(1);
}); 