'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Database, 
  TrendingUp, 
  Search, 
  FileText, 
  Users, 
  Package,
  AlertTriangle,
  Calendar
} from 'lucide-react';

interface SuggestedPromptsProps {
  onPromptSelect: (prompt: string) => void;
  className?: string;
}

const SUGGESTED_PROMPTS = [
  {
    category: 'Inventaire',
    icon: Package,
    color: 'bg-blue-500',
    prompts: [
      'Quels sont les médicaments en rupture de stock ?',
      'Affiche-moi les produits avec moins de 10 unités en stock',
      'Liste des médicaments qui expirent dans les 30 prochains jours',
      'Quel est le stock total par catégorie de médicaments ?'
    ]
  },
  {
    category: 'Ventes',
    icon: TrendingUp,
    color: 'bg-green-500',
    prompts: [
      'Affiche-moi les ventes du mois dernier',
      'Quels sont les 10 médicaments les plus vendus cette semaine ?',
      'Quel est le chiffre d\'affaires total de cette année ?',
      'Compare les ventes de ce mois avec le mois précédent'
    ]
  },
  {
    category: 'Clients',
    icon: Users,
    color: 'bg-purple-500',
    prompts: [
      'Recherche les clients qui ont acheté de l\'aspirine',
      'Liste des clients les plus fidèles',
      'Combien de nouveaux clients ce mois ?',
      'Affiche les clients avec des ordonnances en attente'
    ]
  },
  {
    category: 'Rapports',
    icon: FileText,
    color: 'bg-orange-500',
    prompts: [
      'Génère un rapport des ventes hebdomadaires',
      'Analyse des tendances de vente par saison',
      'Rapport des médicaments les moins vendus',
      'Statistiques des prescriptions par médecin'
    ]
  },
  {
    category: 'Alertes',
    icon: AlertTriangle,
    color: 'bg-red-500',
    prompts: [
      'Y a-t-il des alertes de sécurité sur les médicaments ?',
      'Vérifie les interactions médicamenteuses dangereuses',
      'Liste des rappels de produits en cours',
      'Médicaments avec des effets secondaires signalés'
    ]
  }
];

export function SuggestedPrompts({ onPromptSelect, className }: SuggestedPromptsProps) {
  return (
    <div className={className}>
      <div className="mb-4">
        <h3 className="text-sm font-medium text-muted-foreground mb-2">
          Suggestions pour commencer
        </h3>
        <p className="text-xs text-muted-foreground">
          Cliquez sur une suggestion ou tapez votre propre question
        </p>
      </div>
      
      <div className="space-y-4">
        {SUGGESTED_PROMPTS.map((category) => {
          const IconComponent = category.icon;
          
          return (
            <Card key={category.category} className="border-muted/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-6 h-6 rounded-full ${category.color} flex items-center justify-center`}>
                    <IconComponent className="w-3 h-3 text-white" />
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {category.category}
                  </Badge>
                </div>
                
                <div className="grid gap-2">
                  {category.prompts.map((prompt, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      className="justify-start h-auto p-2 text-left text-sm hover:bg-muted/50"
                      onClick={() => onPromptSelect(prompt)}
                    >
                      <span className="truncate">{prompt}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      <div className="mt-6 p-4 bg-muted/30 rounded-lg">
        <div className="flex items-start gap-2">
          <Database className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-muted-foreground">
            <p className="font-medium mb-1">💡 Conseil</p>
            <p>
              Vous pouvez poser des questions en langage naturel sur votre base de données pharmacie. 
              Chifa.ai comprend le contexte et génère automatiquement les requêtes SQL appropriées.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}