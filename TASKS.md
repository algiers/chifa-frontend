# ✅ TODO List - Développement Frontend Chifa.ai

Ce fichier suit l'avancement des tâches définies dans `DEVELOPMENT_PLAN.md`.

## Phase 0 : Pages Publiques & Structure de Base (Jour 0.5)
- [x] Création page d'accueil (`app/(public)/page.tsx`).
- [x] Création page de pricing (`app/(public)/pricing/page.tsx`).
- [x] Layout distinct pour pages publiques (`app/(public)/layout.tsx`).

## Phase 1 : Setup & Auth (Jour 1-3)
- [x] Setup Next.js 14 (App Router), TypeScript (strict), Tailwind CSS.
- [x] Installation et configuration de shadcn/ui.
- [x] Configuration projet Supabase (Auth + DB) - *Côté client Next.js et variables d'env placeholders.*
- [ ] **Utilisateur :** Création effective des tables Supabase (`profiles`, `pharmacy_secrets`, `chat_conversations`, `chat_messages`) et trigger `handle_new_user` dans Supabase Studio.
- [x] `authStore` (Zustand) créé.
- [x] Pages auth (`/login`, `/register`, `/forgot-password`) utilisant `AuthForm.tsx` créées.
- [x] Middleware Next.js pour protection des routes créé.
- [x] `RootLayout.tsx` avec listener `onAuthStateChange` pour synchro session/profil.
- [x] Page `/complete-pharmacy-profile` pour saisie infos pharmacie.
- [x] Code logique pour Edge Function `register-pharmacy` créé (à déployer par l'utilisateur).
- [ ] **Utilisateur :** Déployer l'Edge Function `register-pharmacy` sur Supabase.
- [ ] **Utilisateur :** Configurer les variables d'environnement pour les Edge Functions dans Supabase.
- [x] Finaliser le processus d'enregistrement de pharmacie (appel à l'Edge Function depuis `/complete-pharmacy-profile`, gestion de la réponse, mise à jour du store et de la DB `profiles` et `pharmacy_secrets` via l'Edge Function).
- [x] Résoudre le problème de déconnexion.
- [x] Résoudre les erreurs TypeScript persistantes dans l'IDE de l'utilisateur (Deno, server.ts, Sidebar import).

## Phase 2 : Interface Chat Core (Jour 4-6)
- [x] `chatStore` (Zustand) créé.
- [x] Composants `ChatInput.tsx`, `MessageList.tsx`, `MessageItem.tsx` créés.
- [x] Page `/dashboard` intégrant les composants de chat créée.
- [x_] Code logique pour Edge Function `chifa-agent-proxy` créé (sans renvoi SQL au client) - *Déploiement et configuration variables d'env par l'utilisateur.*
- [ ] **Utilisateur :** Déployer l'Edge Function `chifa-agent-proxy` sur Supabase.
- [x] Intégration effective de l'appel à l'Edge Function `chifa-agent-proxy` depuis `ChatInput.tsx` et gestion des réponses.
- [ ] Créer le composant `SQLExecutionDisplay.tsx` (pour afficher `sqlResults` uniquement).
- [ ] Finaliser les composants `Navbar.tsx` et `Sidebar.tsx`.
- [x] `AppLayout.tsx` intégrant Navbar et Sidebar (imports en place).

## Phase 3 : Historique & Persistance (Jour 7-8)
- [x] Composant `HistorySidebar.tsx` (récupération et affichage de base, suppression).
- [ ] Logique de sauvegarde complète des conversations (messages, SQL généré pour audit, résultats) dans Supabase via Edge Function `chifa-agent-proxy` ou une fonction dédiée.
- [ ] Logique pour charger une conversation sélectionnée depuis l'historique dans l'interface de chat (via `conversation_id` dans l'URL).
- [ ] (Optionnel) Recherche et pagination de l'historique.

## Phase 4 : Fonctionnalités Avancées & Polish (Jour 9-11)
- [ ] Amélioration `DataTable.tsx` pour `sqlResults` (tri, filtrage).
- [ ] Créer le composant `ChartRenderer.tsx` pour visualisations de données.
- [ ] Intégrer `ChartRenderer` dans `SQLExecutionDisplay.tsx`.
- [ ] Système de partage de requêtes/conversations.
- [ ] Amélioration de l'interface responsive pour mobile et tablette.
- [ ] Ajout de feedback utilisateur (toasts/notifications avec shadcn/ui Sonner).
- [ ] (Optionnel) Export des résultats SQL (CSV, JSON).
- [ ] (Optionnel) Page `/settings` pour gestion du profil, plan, etc.
- [ ] (Optionnel) Page `/history` dédiée si non intégrée au dashboard.

## Phase 5 : Tests, Optimisation & Déploiement VPS (Jour 12-14)
- [ ] Tests manuels complets des fonctionnalités.
- [ ] Optimisation des performances (requêtes DB, rendu React).
- [ ] Revue de sécurité (RLS Supabase, validation des entrées, etc.).
- [ ] Documentation pour le déploiement sur un VPS Contabo.
- [ ] Déploiement initial sur le VPS.
- [ ] Tests d'intégration post-déploiement.

---
**Légende:**
- `[x]` : Tâche considérée comme largement complétée ou structure de base en place.
- `[ ]` : Tâche à faire.
- `[x_]` : Tâche partiellement complétée ou dont une partie dépend de l'utilisateur.
- **Utilisateur :** Indique une action que l'utilisateur doit effectuer (configuration, déploiement).
