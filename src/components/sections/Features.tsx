"use client"

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Brain, 
  Database, 
  Shield, 
  Zap, 
  MessageSquare, 
  BarChart3 
} from "lucide-react";

// Helper function pour créer les icônes avec le bon typage
const createIcon = (IconComponent: React.ElementType | undefined, className: string) => {
  if (!IconComponent) return null;
  return <IconComponent className={className} />;
};

const features = [
  {
    title: "Intelligence Artificielle Avancée",
    description: "Notre IA comprend le langage naturel et génère des requêtes SQL précises pour interroger votre base de données pharmacie.",
    icon: Brain,
  },
  {
    title: "Base de Données Sécurisée",
    description: "Accès direct et sécurisé à votre base de données existante sans modification de votre infrastructure actuelle.",
    icon: Database,
  },
  {
    title: "Sécurité Renforcée",
    description: "Chiffrement des données, authentification robuste et conformité RGPD pour protéger vos informations sensibles.",
    icon: Shield,
  },
  {
    title: "Réponses Instantanées",
    description: "Obtenez des réponses en temps réel à vos questions sur les stocks, les ventes, et les analyses de données.",
    icon: Zap,
  },
  {
    title: "Interface Conversationnelle",
    description: "Posez vos questions en français naturel comme si vous parliez à un collègue expert en pharmacie.",
    icon: MessageSquare,
  },
  {
    title: "Analyses Détaillées",
    description: "Visualisez vos données sous forme de graphiques et de tableaux pour une meilleure prise de décision.",
    icon: BarChart3,
  },
];

export function Features() {
  return (
    <section className="py-24 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Fonctionnalités Principales
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Découvrez comment Chifa.ai révolutionne la gestion de votre pharmacie 
            avec une intelligence artificielle spécialement conçue pour votre secteur.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  {createIcon(feature.icon, 'h-6 w-6 text-blue-600')}
                </div>
                <CardTitle className="text-xl font-semibold text-gray-900">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 text-center leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}