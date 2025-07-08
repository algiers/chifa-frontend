# 🏗️ Plan de Développement Détaillé Frontend Chifa.ai (Next.js 14)

## 1. 🏗️ ARCHITECTURE FRONTEND PROPOSÉE

```mermaid
graph TD
    subgraph Navigateur Client
        A[Next.js App: /login, /register] -- Credentials --> B(Supabase Auth Client);
        B -- JWT Session --> A;
        A -- Redirection si succès --> C[Next.js App: /dashboard];
        C -- Requête utilisateur (texte) --> D{Supabase Edge Function: /api/chifa-agent-proxy};
    end

    subgraph Supabase Cloud
        B -- Valide Auth --> SB_Auth[Supabase Auth Service];
        D -- User JWT --> SB_Auth;
        D -- Récupère code_ps, litellm_virtual_key --> SB_DB_Secrets[Supabase DB: pharmacy_secrets];
        D -- Vérifie profil (statut, crédits) --> SB_DB_Profiles[Supabase DB: profiles];
        D -- Construit requête avec virtual_key --> E[API LangGraph: /api/v1/agent/invoke];
        F[Supabase DB: chat_history] <--> D; // Ou via client après réponse
    end

    subgraph Backend Chifa.ai (Cloud)
        E -- Traitement Text-to-SQL --> G[Agent LangGraph];
        G -- Requête SQL via SISH --> H[Service API Local Pharmacie];
    end

    subgraph Infrastructure Pharmacie (Local)
        H -- Exécute SQL --> I[DB PostgreSQL Locale];
        I -- Résultats SQL --> H;
        H -- Résultats SQL --> G;
    end

    G -- Réponse formatée --> E;
    E -- Réponse formatée (sans SQL généré pour client) --> D;
    D -- Réponse à afficher --> C;
    C -- Affiche réponse, sauvegarde historique (via Edge Function ou client) --> F;

    subgraph Gestion Etat (Client - Zustand)
        Z_Auth[AuthStore: user, session, profileDetails] <--> A;
        Z_Auth <--> C;
        Z_Chat[ChatStore: messages, isLoading, error, sqlResults] <--> C;
        Z_Chat <--> D;
    end
```

**Description du diagramme et flux :**
1.  **Pages Publiques :** L'utilisateur arrive sur la page d'accueil (`/`) ou de pricing (`/pricing`).
2.  **Authentification/Inscription :** L'utilisateur s'inscrit (`/register`) ou se connecte (`/login`) via Supabase Auth. Un plan "Free/Démo" est attribué par défaut.
3.  **Complétion Profil Pharmacie :** L'utilisateur est guidé pour fournir les détails de sa pharmacie (`code_ps`, nom, adresse, etc.) via `/complete-pharmacy-profile`. Ces informations sont envoyées à une Edge Function (`register-pharmacy`) qui appelle l'API Chifa.ai (`/api/v1/pharmacy/register`) pour enregistrer la pharmacie et obtenir une `litellm_virtual_key`. Cette clé est stockée de manière sécurisée dans la table `pharmacy_secrets` de Supabase. Le profil utilisateur est mis à jour avec un statut (ex: `pending_payment_approval` ou `active_demo`).
4.  **Interface de Chat :** Une fois le profil pharmacie configuré et le compte activé (ou en mode démo avec crédits), l'utilisateur accède au `/dashboard`.
5.  **Appel API Sécurisé :** La requête de chat est envoyée à une Supabase Edge Function (`chifa-agent-proxy`).
    *   L'Edge Function valide le JWT, récupère `code_ps` du profil et `litellm_virtual_key` de `pharmacy_secrets`.
    *   Elle vérifie le statut du compte et les crédits démo.
    *   Elle appelle l'API LangGraph Chifa.ai (`/api/v1/agent/invoke`) avec la clé virtuelle.
6.  **Traitement Backend Chifa.ai & Réponse :** L'agent LangGraph génère et exécute la requête SQL via le service local de la pharmacie (SISH). La réponse (résultats SQL, mais pas la requête SQL elle-même) est retournée à l'Edge Function, puis au client.
7.  **Gestion d'État (Zustand) :** `authStore` gère la session et les détails du profil. `chatStore` gère les messages et l'état du chat.
8.  **Historique :** Les conversations sont sauvegardées dans Supabase DB.

## 2. 📁 STRUCTURE DES DOSSIERS (chifa-frontend/)

```
├── app/                    # Next.js 14 App Router
│   ├── (public)/           # Routes publiques
│   │   ├── layout.tsx
│   │   ├── page.tsx        # Accueil
│   │   └── pricing/page.tsx
│   ├── (auth)/             # Routes pour l'authentification
│   │   ├── layout.tsx
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── forgot-password/page.tsx
│   ├── (app)/              # Routes protégées après authentification
│   │   ├── layout.tsx      # Layout principal avec Navbar & Sidebar
│   │   ├── dashboard/page.tsx
│   │   ├── history/page.tsx  (Ou intégré au dashboard)
│   │   ├── settings/page.tsx
│   │   └── complete-pharmacy-profile/page.tsx
│   ├── api/                # Route handlers Next.js (si besoin, ex: webhooks)
│   └── layout.tsx          # Layout racine (avec listener onAuthStateChange)
│   └── globals.css
├── components/
│   ├── auth/AuthForm.tsx
│   ├── chat/ChatInput.tsx, MessageList.tsx, MessageItem.tsx, SQLExecutionDisplay.tsx (sans SQL pour user)
│   ├── history/HistorySidebar.tsx
│   ├── layout/Navbar.tsx, Sidebar.tsx
│   └── ui/                 # Composants shadcn/ui (button.tsx, input.tsx, etc.)
├── lib/
│   ├── supabase/client.ts, server.ts
│   └── utils.ts
├── stores/
│   ├── authStore.ts
│   └── chatStore.ts
├── types/
│   ├── index.ts, supabase.ts, chifa.ts
├── supabase/               # Code pour Supabase (hors client Next.js)
│   ├── functions/
│   │   ├── chifa-agent-proxy/index.ts
│   │   ├── register-pharmacy/index.ts
│   │   └── _shared/cors.ts
│   └── migrations/         # (Optionnel) Migrations SQL Supabase
├── public/
├── .env.local
├── middleware.ts
├── next.config.mjs
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

## 3. 🔧 COMPOSANTS DÉTAILLÉS
*(Voir conversation pour détails sur `AuthForm`, `ChatInput`, `MessageList`, `MessageItem`, `SQLExecutionDisplay` (modifié pour ne pas afficher SQL), `HistorySidebar`, `Navbar`, `Sidebar`)*

## 4. 🌐 MAPPING API COMPLET
*(Voir conversation pour mapping `AuthForm` -> Supabase Auth; `ChatInput` -> Edge Function `chifa-agent-proxy` -> API Chifa `/api/v1/agent/invoke`; `CompletePharmacyProfilePage` -> Edge Function `register-pharmacy` -> API Chifa `/api/v1/pharmacy/register`)*

## 5. 📋 PLAN DE DÉVELOPPEMENT SÉQUENTIEL

#### Phase 0 : Pages Publiques & Structure de Base (Jour 0.5)
*   [X] Création page d'accueil (`app/(public)/page.tsx`).
*   [X] Création page de pricing (`app/(public)/pricing/page.tsx`).
*   [X] Layout distinct pour pages publiques.

#### Phase 1 : Setup & Auth (Jour 1-3)
*   [X] Setup Next.js 14, TypeScript, Tailwind, shadcn/ui.
*   [X] Configuration projet Supabase (Auth + DB).
*   [X] Création tables Supabase (`profiles`, `pharmacy_secrets`, `chat_conversations`, `chat_messages`) et trigger `handle_new_user`.
*   [X] `authStore` (Zustand).
*   [X] Pages auth (`/login`, `/register`, `/forgot-password`) utilisant `AuthForm.tsx`.
*   [X] Middleware Next.js pour protection des routes.
*   [X] `RootLayout.tsx` avec listener `onAuthStateChange` pour synchro session/profil.
*   [X] Page `/complete-pharmacy-profile` pour saisie infos pharmacie.
*   [X] Code logique pour Edge Function `register-pharmacy`.

#### Phase 2 : Interface Chat Core (Jour 4-6)
*   [X] `chatStore` (Zustand).
*   [X] Composants `ChatInput.tsx`, `MessageList.tsx`, `MessageItem.tsx`.
*   [X] Page `/dashboard` intégrant les composants de chat.
*   [X] Code logique pour Edge Function `chifa-agent-proxy` (sans renvoi SQL au client).
*   [ ] Intégration effective de l'appel à l'Edge Function depuis `ChatInput.tsx` et gestion des réponses.
*   [ ] Composant `SQLExecutionDisplay.tsx` (pour afficher `sqlResults` uniquement).
*   [ ] Composants `Navbar.tsx` et `Sidebar.tsx` (placeholders créés, à finaliser).
*   [X] `AppLayout.tsx` intégrant Navbar et Sidebar.

#### Phase 3 : Historique & Persistance (Jour 7-8)
*   [X] Composant `HistorySidebar.tsx` (récupération et affichage de base).
*   [ ] Logique de sauvegarde complète des conversations (messages, SQL, résultats) dans Supabase via Edge Function `chifa-agent-proxy` ou dédiée.
*   [ ] Logique pour charger une conversation sélectionnée depuis l'historique dans l'interface de chat.
*   [ ] (Optionnel) Recherche et pagination de l'historique.

#### Phase 4 : Fonctionnalités Avancées & Polish (Jour 9-11)
*   [ ] Amélioration `DataTable.tsx` pour `sqlResults`.
*   [ ] Composant `ChartRenderer.tsx` pour visualisations.
*   [ ] Système de partage de requêtes.
*   [ ] Interface responsive mobile.
*   [ ] Feedback utilisateur (toasts).
*   [ ] (Optionnel) Export des résultats.

#### Phase 5 : Tests, Optimisation & Déploiement VPS (Jour 12-14)
*   [ ] Tests manuels et automatisés (si possible).
*   [ ] Optimisation performances.
*   [ ] Revue sécurité.
*   [ ] Documentation déploiement VPS Contabo.
*   [ ] Déploiement.

## 6. 🔐 GESTION SPÉCIFIQUE AUTHENTIFICATION CHIFA
*   **Inscription Initiale :** Email/password + Nom complet via Supabase Auth. Trigger crée profil de base (`current_plan_id='free_demo'`, `pharmacy_status='pending_pharmacy_details'`, `demo_credits_remaining=3`).
*   **Enregistrement Pharmacie :** L'utilisateur (sur `/complete-pharmacy-profile`) fournit `code_ps`, nom pharmacie, adresse, téléphone.
*   **Appel API Chifa :** L'Edge Function `register-pharmacy` appelle `POST /api/v1/pharmacy/register` de `langgraph_agent.py`.
*   **Stockage Clé :** `litellm_virtual_key` retournée est stockée dans `pharmacy_secrets` (liée à `code_ps`), inaccessible au client.
*   **Mise à Jour Profil :** `profiles` est mis à jour avec les infos pharmacie et `pharmacy_status` (ex: `pending_payment_approval` ou `active_demo` si le plan démo nécessite un enregistrement de `code_ps`).
*   **Accès au Chat :** Conditionné par `pharmacy_status` ('active' ou 'active_demo' avec crédits) et `code_ps` existant. L'Edge Function `chifa-agent-proxy` valide cela et utilise la `litellm_virtual_key` stockée.

## 7. 📊 SCHÉMA BASE DE DONNÉES SUPABASE
*(SQL fourni précédemment, incluant `profiles`, `pharmacy_secrets`, `chat_conversations`, `chat_messages`, trigger `handle_new_user`, et politiques RLS de base).*

## 8. 🎨 DESIGN SYSTEM & UX
*   **Palette :** Primaire bleu médical/techno, secondaires gris, accents vert/rouge.
*   **Composants shadcn/ui :** Button, Input, Label, Card, Dialog, Sheet, Table, etc.
*   **Layouts responsives.**
*   **Animations/transitions subtiles.**

## 9. 🚀 ORDRE DE GÉNÉRATION DES FICHIERS
*(Globalement suivi jusqu'à présent)*
1.  Setup, Configs (`.env.local`, `tsconfig.json`, `next.config.mjs`).
2.  Types (`types/`).
3.  Stores Zustand (`stores/`).
4.  Layouts (`app/layout.tsx`, `app/(public)/layout.tsx`, etc.).
5.  Pages publiques et d'authentification.
6.  Composants UI de base (shadcn).
7.  Composants spécifiques (Auth, Chat, Layout).
8.  Middleware.
9.  Logique Edge Functions.
10. Intégrations API client vers Edge Functions.
11. Styles et polish.

## 10. 📝 CHECKLIST DE VALIDATION (Exemples)
*   **Phase 1 (Auth):** Inscription, confirmation email, login, logout, protection des routes, création profil DB fonctionnent.
*   **Phase 2 (Chat Core):** Envoi de message, réception de réponse (simulée ou réelle via Edge Function), affichage correct, gestion états chargement/erreur.
*   **Phase 3 (Historique):** Sauvegarde et chargement de l'historique des conversations.

## 💡 POINTS D'ATTENTION SPÉCIFIQUES
*   **Sécurité `litellm_virtual_key`:** Gérée via Edge Functions, jamais exposée au client.
*   **Performances:** Surveiller les appels DB, optimiser les requêtes Supabase.
*   **Gestion Erreurs:** UX claire pour erreurs API, réseau, timeouts, crédits épuisés.
*   **Mobile:** Design responsive.
*   **Déconnexion:** Problème actuel à résoudre en priorité.
*   **Erreur 406 (Not Acceptable):** À investiguer si elle persiste après correction des problèmes de données (profil manquant).
