# Configuration des Modèles IA - Chifa Assistant

## Vue d'ensemble

Ce document décrit le système de configuration flexible des modèles IA dans l'application Chifa Assistant. Cette solution élimine le hardcoding des modèles et permet une gestion centralisée et configurable.

## 🎯 Problème Résolu

**Avant :** Les modèles étaient hardcodés dans le code (`gpt-3.5-turbo`), rendant difficile le changement de modèle sans modification du code.

**Après :** Configuration centralisée et flexible via variables d'environnement et fichiers de configuration.

## 📁 Structure des Fichiers

```
src/
├── config/
│   └── models.ts                    # Configuration centralisée des modèles
├── hooks/
│   └── useModelConfig.ts           # Hooks React pour la configuration
├── components/chat/
│   ├── ModelIndicator.tsx          # Affichage du modèle actuel
│   ├── ModelSelector.tsx           # Sélecteur de modèles
│   └── ModelSettings.tsx           # Paramètres avancés
└── .env.example                    # Variables d'environnement
```

## ⚙️ Configuration

### Variables d'Environnement

Créez un fichier `.env.local` avec les variables suivantes :

```bash
# Modèle par défaut
NEXT_PUBLIC_DEFAULT_MODEL=deepseek-chat

# Modèle de fallback en cas d'erreur
NEXT_PUBLIC_FALLBACK_MODEL=gpt-3.5-turbo

# Configuration par environnement
NEXT_PUBLIC_DEV_MODEL=deepseek-chat
NEXT_PUBLIC_STAGING_MODEL=deepseek-chat
NEXT_PUBLIC_PROD_MODEL=deepseek-chat
```

### Modèles Supportés

| Modèle | Provider | Streaming | Functions | Vision |
|--------|----------|-----------|-----------|--------|
| `deepseek-chat` | DeepSeek | ✅ | ✅ | ❌ |
| `gpt-3.5-turbo` | OpenAI | ✅ | ✅ | ❌ |
| `gpt-4` | OpenAI | ✅ | ✅ | ❌ |
| `gpt-4-vision-preview` | OpenAI | ✅ | ✅ | ✅ |

## 🔧 Utilisation

### Dans les Composants React

```typescript
import { useModelParams } from '@/hooks/useModelConfig';

function MyComponent() {
  const { 
    model, 
    temperature, 
    maxTokens, 
    supportsStreaming,
    displayName 
  } = useModelParams();

  return (
    <div>
      <p>Modèle actuel : {displayName}</p>
      <p>Streaming : {supportsStreaming ? 'Oui' : 'Non'}</p>
    </div>
  );
}
```

### Dans les API Routes

```typescript
import { getCurrentModel, getModelConfig } from '@/config/models';

export async function POST(request: Request) {
  const model = getCurrentModel();
  const config = getModelConfig(model);
  
  const requestBody = {
    model: model,
    temperature: config?.defaultTemperature ?? 0.7,
    max_tokens: config?.defaultMaxTokens ?? 2000,
    // ...
  };
}
```

### Configuration Personnalisée

```typescript
import { useModelConfig } from '@/hooks/useModelConfig';

function AdminPanel() {
  const { availableModels, isValidModel } = useModelConfig();
  
  const handleModelChange = (modelName: string) => {
    if (isValidModel(modelName)) {
      // Changer le modèle
    }
  };
}
```

## 🎨 Composants UI

### ModelIndicator

Affiche le modèle actuel avec ses caractéristiques :

```typescript
import ModelIndicator from '@/components/chat/ModelIndicator';

<ModelIndicator showDetails />
```

### ModelSelector

Permet de sélectionner un modèle parmi ceux disponibles :

```typescript
import ModelSelector from '@/components/chat/ModelSelector';

<ModelSelector 
  onModelChange={(model) => console.log(model)}
  selectedModel="deepseek-chat"
/>
```

### ModelSettings

Interface pour ajuster les paramètres du modèle :

```typescript
import ModelSettings from '@/components/chat/ModelSettings';

<ModelSettings 
  onSettingsChange={(settings) => console.log(settings)}
/>
```

## 🔍 Validation et Logging

Le système inclut une validation automatique au démarrage :

```
✅ Model configuration validated successfully
📋 Current model: deepseek-chat
🔄 Fallback model: gpt-3.5-turbo
```

En cas d'erreur :

```
❌ Model configuration validation failed:
  - Default model 'invalid-model' is not configured
⚠️  Model configuration warnings:
  - Model 'old-model' for environment 'production' is not configured
```

## 🚀 Avantages

### ✅ Flexibilité
- Changement de modèle sans redéploiement
- Configuration par environnement
- Support de nouveaux modèles facilité

### ✅ Maintenabilité
- Configuration centralisée
- Validation automatique
- Logging détaillé

### ✅ Robustesse
- Modèle de fallback automatique
- Validation des configurations
- Gestion d'erreurs gracieuse

### ✅ Expérience Développeur
- Hooks React intuitifs
- Types TypeScript complets
- Documentation intégrée

## 🔄 Migration

### Étapes de Migration

1. **Ajouter les variables d'environnement**
   ```bash
   NEXT_PUBLIC_DEFAULT_MODEL=deepseek-chat
   ```

2. **Remplacer le code hardcodé**
   ```typescript
   // Avant
   model: 'gpt-3.5-turbo'
   
   // Après
   import { getCurrentModel } from '@/config/models';
   model: getCurrentModel()
   ```

3. **Utiliser les hooks dans les composants**
   ```typescript
   // Avant
   const model = 'gpt-3.5-turbo';
   
   // Après
   const { model } = useModelParams();
   ```

## 📊 Monitoring

### Métriques Recommandées

- **Utilisation par modèle** : Tracking des modèles utilisés
- **Erreurs de configuration** : Alertes sur les configurations invalides
- **Performance par modèle** : Temps de réponse selon le modèle
- **Coûts par modèle** : Suivi des coûts d'utilisation

### Logs Importants

```typescript
// Configuration au démarrage
console.log('✅ Model configuration validated successfully');

// Changement de modèle
console.log(`🔄 Model changed from ${oldModel} to ${newModel}`);

// Utilisation du fallback
console.warn(`⚠️  Using fallback model ${fallbackModel} due to error`);
```

## 🔮 Évolutions Futures

### Fonctionnalités Prévues

1. **Interface d'administration** pour la gestion des modèles
2. **A/B testing** entre différents modèles
3. **Auto-scaling** selon la charge
4. **Métriques en temps réel** d'utilisation
5. **Configuration dynamique** sans redémarrage

### Nouveaux Modèles

Pour ajouter un nouveau modèle :

```typescript
// Dans src/config/models.ts
'nouveau-modele': {
  name: 'nouveau-modele',
  displayName: 'Nouveau Modèle',
  provider: 'nouveau-provider',
  defaultTemperature: 0.7,
  defaultMaxTokens: 2000,
  supportedFeatures: {
    streaming: true,
    functionCalling: false,
    vision: false,
  },
}
```

## 🎯 Conclusion

Cette solution de configuration des modèles transforme une architecture rigide en un système flexible et maintenable. Elle permet :

- **Déploiements sans interruption** lors du changement de modèle
- **Optimisation des coûts** par environnement
- **Expérience développeur améliorée** avec des outils intuitifs
- **Robustesse** avec validation et fallbacks automatiques

Le système est conçu pour évoluer avec les besoins futurs tout en maintenant la simplicité d'utilisation actuelle.