# Plan d'Intégration Vercel AI Chatbot - Chifa.ai

## ✅ Tâche 1 Complétée : Préparation et configuration de l'environnement

### Analyse du Template Vercel
- ✅ Template cloné avec succès dans `temp-vercel-template/`
- ✅ Structure analysée : composants clés identifiés
- ✅ Configuration étudiée : dépendances et setup compris

### Composants Clés Identifiés
- **Chat Principal** : `components/chat.tsx` - Composant principal avec streaming
- **Sidebar** : `components/app-sidebar.tsx` - Sidebar avec historique
- **Messages** : `components/messages.tsx` - Affichage des messages
- **Input** : `components/multimodal-input.tsx` - Zone de saisie avancée
- **Historique** : `components/sidebar-history.tsx` - Gestion de l'historique

### Dépendances Critiques à Ajouter
```json
{
  "@ai-sdk/react": "2.0.0-beta.6",
  "@ai-sdk/provider": "2.0.0-beta.1", 
  "ai": "5.0.0-beta.6",
  "@radix-ui/react-dialog": "^1.1.2",
  "@radix-ui/react-dropdown-menu": "^2.1.2",
  "@radix-ui/react-select": "^2.1.2",
  "@radix-ui/react-tooltip": "^1.1.3",
  "framer-motion": "^11.3.19",
  "nanoid": "^5.0.8",
  "next-auth": "5.0.0-beta.25",
  "react-resizable-panels": "^2.1.7",
  "tailwindcss-animate": "^1.0.7"
}
```

### Configuration Environnement
- ✅ Fichier `.env.vercel-integration` créé avec variables adaptées
- ✅ Variables Chifa.ai conservées (Supabase, backend)
- ✅ Variables Vercel ajoutées (AUTH_SECRET, etc.)

### Prochaines Étapes
1. **Tâche 2.1** : Installer les dépendances nécessaires
2. **Tâche 2.2** : Copier et adapter les composants Vercel
3. **Tâche 3.1** : Intégrer l'authentification Supabase

## Architecture d'Intégration

### Stratégie de Remplacement
- **Remplacer** : Interface chat complète (sidebar + chat)
- **Conserver** : Authentification Supabase + backend Chifa.ai
- **Adapter** : Couleurs et branding Chifa.ai
- **Migrer** : Conversations existantes vers nouveau format

### Mapping des Composants
```
Vercel Template          →  Chifa.ai Integration
├── app-sidebar.tsx      →  Remplace Sidebar.tsx actuelle
├── chat.tsx             →  Remplace MessageList + ChatInput
├── messages.tsx         →  Nouveau composant messages
├── multimodal-input.tsx →  Remplace ChatInput.tsx
└── sidebar-history.tsx  →  Intègre conversations Supabase
```

### Points d'Attention
- **Streaming** : Adapter l'API Chifa.ai pour compatibilité Vercel AI SDK
- **Auth** : Intégrer NextAuth avec Supabase existant
- **DB** : Adapter schéma pour compatibilité (ajouter champ `path`)
- **Couleurs** : Appliquer thème vert Chifa.ai sur composants Vercel

## Status
- [x] Tâche 1 : Préparation et configuration ✅
- [ ] Tâche 2 : Configuration initiale du projet
- [ ] Tâche 3 : Migration de l'authentification Supabase
- [ ] ... (voir tasks.md pour la suite)