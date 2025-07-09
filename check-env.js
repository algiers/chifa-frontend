// Script pour vérifier les variables d'environnement Supabase
console.log('=== VÉRIFICATION DES VARIABLES D\'ENVIRONNEMENT ===');
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL || 'NON DÉFINIE');
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'DÉFINIE (masquée)' : 'NON DÉFINIE');

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL manquante !');
  process.exit(1);
}

if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY manquante !');
  process.exit(1);
}

console.log('✅ Variables d\'environnement Supabase configurées correctement'); 