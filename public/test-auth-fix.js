/**
 * Script de diagnostic pour l'authentification Supabase
 * Ce script vérifie l'état de l'authentification et aide à résoudre les problèmes
 */

// Fonction pour vérifier les tokens dans le localStorage
function checkLocalStorage() {
  console.log('🔍 Vérification du localStorage...');
  
  // Liste des clés possibles pour les tokens Supabase
  const possibleKeys = [
    'sb-ddeibfjxpwnisguehnmo-auth-token',
    'supabase.auth.token',
    'auth-storage',
    'sb-access-token',
    'sb-refresh-token'
  ];
  
  let foundTokens = false;
  
  possibleKeys.forEach(key => {
    const value = localStorage.getItem(key);
    if (value) {
      console.log(`✅ Trouvé: ${key}`);
      try {
        const parsed = JSON.parse(value);
        console.log(`📋 Type: ${typeof parsed}`);
        console.log(`🔑 Contient access_token: ${!!parsed.access_token}`);
        console.log(`🔄 Contient refresh_token: ${!!parsed.refresh_token}`);
        console.log(`⏰ Expire à: ${parsed.expires_at ? new Date(parsed.expires_at * 1000).toLocaleString() : 'Non spécifié'}`);
        
        // Vérifier si le token est expiré
        if (parsed.expires_at) {
          const now = Math.floor(Date.now() / 1000);
          const expiresAt = parsed.expires_at;
          const timeLeft = expiresAt - now;
          
          if (timeLeft <= 0) {
            console.log(`⚠️ Token EXPIRÉ depuis ${Math.abs(timeLeft)} secondes`);
          } else {
            console.log(`✅ Token valide pour encore ${timeLeft} secondes (${Math.floor(timeLeft / 60)} minutes)`);
          }
        }
        
        foundTokens = true;
      } catch (e) {
        console.log(`❌ Impossible de parser la valeur: ${e.message}`);
      }
      console.log('');
    }
  });
  
  if (!foundTokens) {
    console.log('❌ Aucun token trouvé dans le localStorage');
  }
  
  // Vérifier le store Zustand
  const authStore = localStorage.getItem('auth-storage');
  if (authStore) {
    try {
      const parsed = JSON.parse(authStore);
      console.log('📊 État du store d\'authentification:');
      console.log(`👤 User: ${!!parsed.state.user}`);
      console.log(`🔑 Session Token: ${!!parsed.state.sessionToken}`);
      console.log(`🏥 Code PS: ${parsed.state.codePs}`);
      console.log(`📋 Pharmacy Status: ${parsed.state.pharmacyStatus}`);
    } catch (e) {
      console.log(`❌ Impossible de parser le store d'authentification: ${e.message}`);
    }
  } else {
    console.log('❌ Store d\'authentification non trouvé');
  }
}

// Fonction pour vérifier les cookies
function checkCookies() {
  console.log('\n🍪 Vérification des cookies...');
  
  const cookies = document.cookie.split(';').map(cookie => cookie.trim());
  const supabaseCookies = cookies.filter(cookie => 
    cookie.startsWith('sb-') || 
    cookie.startsWith('supabase.') ||
    cookie.includes('auth')
  );
  
  if (supabaseCookies.length > 0) {
    console.log('✅ Cookies Supabase trouvés:');
    supabaseCookies.forEach(cookie => {
      const [name, value] = cookie.split('=');
      console.log(`📋 ${name}: ${value.substring(0, 20)}...`);
    });
  } else {
    console.log('❌ Aucun cookie Supabase trouvé');
  }
}

// Fonction pour tester la récupération du token comme dans ChatInput.tsx
function testTokenRetrieval() {
  console.log('\n🧪 Test de récupération du token comme dans ChatInput.tsx...');
  
  const accessToken = localStorage.getItem('sb-ddeibfjxpwnisguehnmo-auth-token') ||
    sessionStorage.getItem('sb-ddeibfjxpwnisguehnmo-auth-token');
  
  if (accessToken) {
    try {
      const tokenData = JSON.parse(accessToken);
      const authToken = tokenData.access_token;
      
      if (authToken) {
        console.log(`✅ Token récupéré avec succès: ${authToken.substring(0, 20)}...`);
      } else {
        console.log('❌ access_token non trouvé dans les données du token');
      }
    } catch (e) {
      console.log(`❌ Erreur lors du parsing du token: ${e.message}`);
    }
  } else {
    console.log('❌ Token non trouvé dans localStorage ou sessionStorage');
  }
}

// Fonction pour suggérer des corrections
function suggestFixes() {
  console.log('\n🔧 Suggestions de corrections:');
  console.log('1. Vérifiez que le nom de la clé dans localStorage est correct');
  console.log('   - La clé actuelle est "sb-ddeibfjxpwnisguehnmo-auth-token"');
  console.log('   - Vérifiez dans la console du navigateur si cette clé existe');
  console.log('2. Assurez-vous que persistSession est activé dans la configuration Supabase');
  console.log('3. Vérifiez que les cookies sont correctement configurés');
  console.log('4. Essayez de vous déconnecter et de vous reconnecter');
  console.log('5. Vérifiez que le domaine des cookies correspond à votre environnement');
}

// Exécuter les fonctions de diagnostic
console.log('🔍 DIAGNOSTIC D\'AUTHENTIFICATION SUPABASE');
console.log('=======================================');
checkLocalStorage();
checkCookies();
testTokenRetrieval();
suggestFixes();