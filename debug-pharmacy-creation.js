const { createClient } = require('@supabase/supabase-js');

// Configuration
const SUPABASE_URL = 'https://ddeibfjxpwnisguehnmo.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkZWliZmp4cHduaXNndWVobm1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDQ2MDc0MywiZXhwIjoyMDY2MDM2NzQzfQ.HD29pSZ6XbYr21TX7ybJxDXbh8jXAoen2Zs1DZcmCKY';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkForDuplicates() {
    const testCodePS = '456789009';
    const testEmail = 'samia@test.com'; // Remplacez par l'email que vous essayez d'utiliser
    
    console.log('🔍 Vérification des doublons...');
    
    // Vérifier si le code PS existe déjà
    const { data: existingPharmacyByCode, error: codeError } = await supabase
        .from('profiles')
        .select('id, code_ps, email, pharmacy_name')
        .eq('code_ps', testCodePS);
    
    if (codeError) {
        console.error('❌ Erreur lors de la vérification du code PS:', codeError);
    } else if (existingPharmacyByCode && existingPharmacyByCode.length > 0) {
        console.log('⚠️  Code PS déjà utilisé:', existingPharmacyByCode);
    } else {
        console.log('✅ Code PS disponible');
    }
    
    // Vérifier si l'email existe déjà
    const { data: existingPharmacyByEmail, error: emailError } = await supabase
        .from('profiles')
        .select('id, code_ps, email, pharmacy_name')
        .eq('email', testEmail);
    
    if (emailError) {
        console.error('❌ Erreur lors de la vérification de l\'email:', emailError);
    } else if (existingPharmacyByEmail && existingPharmacyByEmail.length > 0) {
        console.log('⚠️  Email déjà utilisé:', existingPharmacyByEmail);
    } else {
        console.log('✅ Email disponible');
    }
    
    // Vérifier dans auth.users aussi
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
        console.error('❌ Erreur lors de la vérification des utilisateurs auth:', authError);
    } else {
        const userWithEmail = authUsers.users.find(u => u.email === testEmail);
        if (userWithEmail) {
            console.log('⚠️  Utilisateur auth trouvé avec cet email:', userWithEmail.id, userWithEmail.email);
        } else {
            console.log('✅ Email disponible dans auth.users');
        }
    }
}

async function cleanupDuplicates() {
    const testCodePS = '456789009';
    const testEmail = 'samia@test.com'; // Remplacez par l'email que vous essayez d'utiliser
    
    console.log('🧹 Nettoyage des doublons...');
    
    // Supprimer de profiles
    const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .or(`code_ps.eq.${testCodePS},email.eq.${testEmail}`);
    
    if (profileError) {
        console.error('❌ Erreur lors de la suppression du profil:', profileError);
    } else {
        console.log('✅ Profils supprimés');
    }
    
    // Supprimer de pharmacy_secrets
    const { error: secretError } = await supabase
        .from('pharmacy_secrets')
        .delete()
        .eq('code_ps', testCodePS);
    
    if (secretError) {
        console.error('❌ Erreur lors de la suppression des secrets:', secretError);
    } else {
        console.log('✅ Secrets supprimés');
    }
    
    // Supprimer de auth.users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    if (!authError && authUsers) {
        const userWithEmail = authUsers.users.find(u => u.email === testEmail);
        if (userWithEmail) {
            const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(userWithEmail.id);
            if (deleteAuthError) {
                console.error('❌ Erreur lors de la suppression de l\'utilisateur auth:', deleteAuthError);
            } else {
                console.log('✅ Utilisateur auth supprimé');
            }
        }
    }
}

async function main() {
    console.log('🚀 Script de debug pour la création de pharmacie\n');
    
    // D'abord vérifier les doublons
    await checkForDuplicates();
    
    console.log('\n' + '='.repeat(50));
    console.log('Voulez-vous nettoyer les doublons ? (dé-commentez la ligne ci-dessous)');
    console.log('='.repeat(50));
    
    // Dé-commentez la ligne suivante pour nettoyer les doublons
    // await cleanupDuplicates();
}

if (require.main === module) {
    main().catch(console.error);
}
