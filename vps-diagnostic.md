# 🔍 Commandes de Diagnostic VPS - Ajout de Pharmacie

## 1. Vérification des variables d'environnement

```bash
# Se connecter au VPS et aller dans le répertoire du projet
cd /path/to/chifa-frontend

# Vérifier le fichier .env.local sur le VPS
cat .env.local

# Comparer avec le fichier local (copier-coller le contenu de ton PC)
echo "Contenu attendu du .env.local:"
echo "NEXT_PUBLIC_SUPABASE_URL=https://ddeibfjxpwnisguehnmo.supabase.co"
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
echo "SUPABASE_URL=https://ddeibfjxpwnisguehnmo.supabase.co"
echo "SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
echo "LITELLM_PROXY_URL=http://frp.youcef.xyz:4000"
echo "LITELLM_MASTER_KEY=a1b2c3d4-e5f6-7890-1234-567890abcdef"
```

## 2. Test de connectivité réseau depuis le VPS

```bash
# Test Supabase
curl -v https://ddeibfjxpwnisguehnmo.supabase.co/rest/v1/

# Test LiteLLM
curl -v http://frp.youcef.xyz:4000/health

# Test avec timeout
curl --max-time 10 -v http://frp.youcef.xyz:4000/health
```

## 3. Vérification des logs Next.js sur le VPS

```bash
# Si tu utilises PM2
pm2 logs chifa-frontend

# Si tu utilises systemd
journalctl -u chifa-frontend -f

# Si tu lances manuellement
# Regarder les logs dans le terminal où tu as lancé npm run dev/start
```

## 4. Test de l'API directement sur le VPS

```bash
# Exécuter le script de diagnostic
node debug-pharmacy-creation.js

# Vérifier les permissions des fichiers
ls -la .env.local
ls -la src/app/api/admin/pharmacies/route.ts
```

## 5. Vérification de la configuration Next.js

```bash
# Vérifier la version de Node.js
node --version

# Vérifier les dépendances
npm list @supabase/supabase-js

# Redémarrer le serveur Next.js
pm2 restart chifa-frontend
# ou
npm run build && npm run start
```

## 6. Test manuel de l'API avec curl

```bash
# D'abord, obtenir un token admin (remplace par tes vraies credentials)
curl -X POST https://ddeibfjxpwnisguehnmo.supabase.co/auth/v1/token?grant_type=password \
  -H "apikey: TON_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "ton-email-admin@example.com",
    "password": "ton-mot-de-passe-admin"
  }'

# Puis tester l'API avec le token obtenu
curl -X POST http://localhost:3000/api/admin/pharmacies \
  -H "Authorization: Bearer TON_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!",
    "full_name": "Test User",
    "pharmacy_name": "Test Pharmacy",
    "pharmacy_address": "123 Test St",
    "code_ps": "TEST123",
    "phone_number": "123456789",
    "virtual_key": "sk-test-123"
  }'
```

## 7. Vérification des différences de configuration

```bash
# Comparer les fichiers de config
diff .env.local .env 2>/dev/null || echo "Pas de .env trouvé"

# Vérifier les variables d'environnement du processus
ps aux | grep next
# Puis avec le PID trouvé:
cat /proc/PID/environ | tr '\0' '\n' | grep -E "(SUPABASE|LITELLM)"
```

## 8. Actions correctives probables

### Si les variables d'environnement manquent:
```bash
# Copier le bon .env.local
cat > .env.local << 'EOF'
NEXT_PUBLIC_SUPABASE_URL=https://ddeibfjxpwnisguehnmo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkZWliZmp4cHduaXNndWVobm1vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0NjA3NDMsImV4cCI6MjA2NjAzNjc0M30.vBcAD7QfhNBXXU8QDn5XNdnW88Ol1fHASxbmlAbyVA4

SUPABASE_URL="https://ddeibfjxpwnisguehnmo.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkZWliZmp4cHduaXNndWVobm1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDQ2MDc0MywiZXhwIjoyMDY2MDM2NzQzfQ.HD29pSZ6XbYr21TX7ybJxDXbh8jXAoen2Zs1DZcmCKY"

CHIFA_LANGGRAPH_AGENT_URL="http://frp.youcef.xyz:8001/api/v1/agent/invoke"
CHIFA_AGENT_COMM_JWT_SECRET="mysecretapikey"

API_KEY="mysecretapikey"

# Configuration MODELS
NEXT_PUBLIC_DEFAULT_MODEL=deepseek-chat
NEXT_PUBLIC_FALLBACK_MODEL=gpt-3.5-turbo

# Configuration SQL Debug (pour les admins)
NEXT_PUBLIC_SHOW_SQL_DEBUG=false

# Configuration LiteLLM pour l'API admin
LITELLM_PROXY_URL=http://frp.youcef.xyz:4000
LITELLM_MASTER_KEY=a1b2c3d4-e5f6-7890-1234-567890abcdef
EOF

# Redémarrer le serveur
pm2 restart chifa-frontend
```

### Si problème de connectivité réseau:
```bash
# Vérifier les règles firewall
sudo ufw status
sudo iptables -L

# Tester depuis le VPS
telnet frp.youcef.xyz 4000
```

### Si problème de permissions:
```bash
# Vérifier les permissions
chmod 600 .env.local
chown $(whoami):$(whoami) .env.local
```

## 9. Commandes de monitoring en temps réel

```bash
# Surveiller les logs pendant un test
tail -f /var/log/nginx/access.log &
pm2 logs chifa-frontend &

# Dans un autre terminal, tester l'ajout de pharmacie via l'interface web
```

## 🎯 Ordre d'exécution recommandé:

1. **Vérifier .env.local** sur le VPS
2. **Tester la connectivité** réseau
3. **Exécuter le script de diagnostic**
4. **Vérifier les logs** Next.js
5. **Corriger les variables manquantes**
6. **Redémarrer le serveur**
7. **Tester à nouveau**
