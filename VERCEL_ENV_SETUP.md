# Configuration des Variables d'Environnement - Intégration Vercel + Chifa.ai

Ce guide explique comment configurer les variables d'environnement pour l'intégration du template Vercel AI Chatbot avec Chifa.ai.

## 🚀 Configuration Rapide

### 1. Copier le fichier de configuration

```bash
cp .env.chifa-vercel .env.local
```

### 2. Adapter les variables dans `.env.local`

Ouvrez le fichier `.env.local` et adaptez les valeurs suivantes :

#### Variables Supabase (Déjà configurées)
```env
NEXT_PUBLIC_SUPABASE_URL=https://ddeibfjxpwnisguehnmo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Variables Backend Chifa.ai (Déjà configurées)
```env
CHIFA_LANGGRAPH_AGENT_URL=http://frp.youcef.xyz:8001/api/v1/agent/invoke
CHIFA_AGENT_COMM_JWT_SECRET=mysecretapikey
API_KEY=mysecretapikey
```

#### Variables à configurer

**AUTH_SECRET (OBLIGATOIRE)**
```bash
# Générer un secret sécurisé
openssl rand -base64 32
```
Copiez le résultat dans votre `.env.local` :
```env
AUTH_SECRET=votre_secret_genere_ici
```

**POSTGRES_URL (Optionnel)**
Pour les fonctionnalités avancées de Vercel, configurez l'URL PostgreSQL de Supabase :
```env
POSTGRES_URL=postgresql://postgres.ddeibfjxpwnisguehnmo:[VOTRE_MOT_DE_PASSE]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
```

### 3. Valider la configuration

```bash
node scripts/validate-env.js
```

## 📋 Variables d'Environnement Détaillées

### Variables Obligatoires

| Variable | Description | Exemple |
|----------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL publique Supabase | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé anonyme Supabase | `eyJhbGciOiJIUzI1NiI...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé de service Supabase | `eyJhbGciOiJIUzI1NiI...` |
| `AUTH_SECRET` | Secret NextAuth.js (32+ chars) | `your-32-char-secret` |
| `CHIFA_LANGGRAPH_AGENT_URL` | URL agent Chifa.ai | `http://backend:8001/api/v1/agent/invoke` |
| `CHIFA_AGENT_COMM_JWT_SECRET` | Secret JWT Chifa.ai | `mysecretapikey` |
| `NODE_ENV` | Environnement | `development` ou `production` |
| `NEXT_PUBLIC_APP_URL` | URL de l'application | `http://localhost:3000` |

### Variables Optionnelles

| Variable | Description | Valeur par défaut |
|----------|-------------|-------------------|
| `POSTGRES_URL` | URL PostgreSQL pour Vercel | Non définie |
| `API_KEY` | Clé API générale | `mysecretapikey` |
| `CHIFA_STREAMING_ENABLED` | Activer le streaming | `true` |
| `DEBUG_VERCEL_INTEGRATION` | Mode debug | `false` |
| `NEXT_PUBLIC_DEBUG_MODE` | Debug côté client | `false` |

### Variables Non Utilisées

Ces variables du template Vercel ne sont **pas nécessaires** car nous utilisons notre propre backend :

- `XAI_API_KEY` - Nous utilisons le backend Chifa.ai
- `BLOB_READ_WRITE_TOKEN` - Nous utilisons Supabase Storage
- `REDIS_URL` - Nous utilisons Supabase pour le cache

## 🔧 Configuration par Environnement

### Développement Local

```env
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
DEBUG_VERCEL_INTEGRATION=true
```

### Production

```env
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://votre-domaine.com
AUTH_SECRET=votre_secret_production_securise
DEBUG_VERCEL_INTEGRATION=false
```

## 🛠️ Dépannage

### Erreur : "AUTH_SECRET is required"

```bash
# Générer un nouveau secret
openssl rand -base64 32

# Ou utiliser un générateur en ligne
# https://generate-secret.vercel.app/32
```

### Erreur : "POSTGRES_URL connection failed"

1. Vérifiez vos identifiants Supabase
2. Assurez-vous que l'IP est autorisée
3. Testez la connexion :

```bash
# Test de connexion PostgreSQL
psql "postgresql://postgres.xxx:[password]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres"
```

### Erreur : "Supabase connection failed"

1. Vérifiez les URLs et clés dans le dashboard Supabase
2. Assurez-vous que les politiques RLS sont configurées
3. Testez avec curl :

```bash
curl -H "apikey: YOUR_ANON_KEY" https://xxx.supabase.co/rest/v1/
```

## 📚 Ressources

- [Documentation Supabase](https://supabase.com/docs)
- [Documentation NextAuth.js](https://next-auth.js.org/)
- [Documentation Vercel AI SDK](https://sdk.vercel.ai/)
- [Guide Chifa.ai Backend](../CHIFA_AI_TODO.md)

## ✅ Checklist de Configuration

- [ ] Fichier `.env.local` créé et configuré
- [ ] `AUTH_SECRET` généré (32+ caractères)
- [ ] Variables Supabase vérifiées
- [ ] Variables Backend Chifa.ai configurées
- [ ] Script de validation exécuté avec succès
- [ ] Application démarrée sans erreurs

```bash
# Commandes de vérification finale
node scripts/validate-env.js
npm run dev
```

Si toutes les étapes sont validées, votre intégration Vercel + Chifa.ai est prête ! 🎉