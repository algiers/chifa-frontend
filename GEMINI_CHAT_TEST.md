# Test de l'Interface Gemini Chat

## Instructions de Test

### 1. Démarrage
```bash
cd chifa-frontend
npm run dev
```

### 2. Pages à Tester

#### Page de Comparaison des Styles
- URL: `http://localhost:3000/chat-styles`
- Vérifier l'affichage des 3 cartes de styles
- Tester les liens vers chaque interface

#### Interface Gemini
- URL: `http://localhost:3000/chat-gemini`
- Vérifier le thème sombre par défaut
- Tester le basculement de thème (bouton soleil/lune)

### 3. Tests Fonctionnels

#### Interface Utilisateur
- [ ] Header avec titre "Chifa.ai" et badge "Pro"
- [ ] Bouton menu (mobile) fonctionne
- [ ] Sidebar s'ouvre/ferme correctement
- [ ] Indicateur de modèle affiché
- [ ] Avatar utilisateur présent

#### Zone de Chat
- [ ] Message de bienvenue affiché au démarrage
- [ ] 4 cartes de suggestions pharmaceutiques
- [ ] Effet hover sur les cartes
- [ ] Scroll fluide dans la zone de chat

#### Zone de Saisie
- [ ] Textarea redimensionnable automatiquement
- [ ] Boutons d'action (fichier, image, recherche)
- [ ] Bouton microphone
- [ ] Bouton d'envoi apparaît quand il y a du texte
- [ ] Envoi avec Entrée (sans Shift)
- [ ] Indicateur de modèle en bas

#### Sidebar
- [ ] Bouton "Nouvelle conversation"
- [ ] Liste des conversations (vide au début)
- [ ] Bouton "Effacer la conversation"
- [ ] Bouton "Paramètres"
- [ ] Fermeture avec overlay (mobile)

### 4. Tests d'Interaction

#### Envoi de Message
1. Taper un message dans la zone de saisie
2. Appuyer sur Entrée ou cliquer sur le bouton d'envoi
3. Vérifier :
   - [ ] Message utilisateur affiché à droite
   - [ ] Indicateur de frappe animé
   - [ ] Réponse de l'assistant streamée
   - [ ] Boutons d'action sur la réponse (copier, like, etc.)

#### Gestion des Conversations
1. Envoyer plusieurs messages
2. Cliquer sur "Nouvelle conversation"
3. Vérifier :
   - [ ] Nouvelle conversation créée
   - [ ] Ancienne conversation dans la sidebar
   - [ ] Basculement entre conversations

#### Thèmes
1. Cliquer sur le bouton thème dans le header
2. Vérifier :
   - [ ] Transition fluide entre thèmes
   - [ ] Tous les éléments changent de couleur
   - [ ] Icône du bouton change (soleil/lune)

### 5. Tests Responsive

#### Mobile (< 768px)
- [ ] Sidebar en overlay
- [ ] Bouton menu visible
- [ ] Zone de saisie adaptée
- [ ] Messages lisibles

#### Tablet (768px - 1024px)
- [ ] Layout adapté
- [ ] Sidebar responsive
- [ ] Boutons de taille appropriée

#### Desktop (> 1024px)
- [ ] Sidebar fixe
- [ ] Layout optimal
- [ ] Toutes les fonctionnalités accessibles

### 6. Tests de Performance

#### Streaming
- [ ] Réponses affichées en temps réel
- [ ] Pas de lag visible
- [ ] Scroll automatique vers le bas

#### Animations
- [ ] Indicateur de frappe fluide
- [ ] Transitions de thème sans saccades
- [ ] Hover effects réactifs

### 7. Tests d'Erreur

#### Erreurs API
1. Couper la connexion réseau
2. Envoyer un message
3. Vérifier :
   - [ ] Message d'erreur affiché
   - [ ] Interface reste utilisable
   - [ ] Possibilité de réessayer

#### Erreurs de Validation
1. Envoyer un message vide
2. Vérifier :
   - [ ] Message non envoyé
   - [ ] Pas d'erreur console

### 8. Checklist Final

#### Fonctionnalités Core
- [ ] Envoi/réception de messages
- [ ] Streaming en temps réel
- [ ] Gestion des conversations
- [ ] Changement de thème
- [ ] Interface responsive

#### Intégration API
- [ ] Connexion à l'API Chifa.ai
- [ ] Sélection de modèles
- [ ] Gestion des erreurs
- [ ] Format de messages compatible

#### UX/UI
- [ ] Design cohérent avec Gemini
- [ ] Animations fluides
- [ ] Feedback utilisateur approprié
- [ ] Accessibilité de base

## Problèmes Connus

### À Résoudre
- [ ] Vérifier la compatibilité avec l'API existante
- [ ] Tester avec différents modèles
- [ ] Optimiser les performances sur mobile
- [ ] Ajouter la gestion des erreurs réseau

### Améliorations Futures
- [ ] Upload de fichiers
- [ ] Recherche dans les conversations
- [ ] Raccourcis clavier
- [ ] Mode vocal

## Rapport de Test

### Date: ___________
### Testeur: ___________

#### Résultats
- [ ] Tous les tests passent
- [ ] Tests partiellement réussis
- [ ] Échecs majeurs détectés

#### Notes:
_Espace pour les commentaires et observations_

#### Bugs Trouvés:
1. ___________
2. ___________
3. ___________

#### Recommandations:
1. ___________
2. ___________
3. ___________