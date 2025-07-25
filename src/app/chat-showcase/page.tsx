'use client';

import React, { useState } from 'react';
import { 
  Sparkles, 
  MessageSquare, 
  Palette, 
  Keyboard, 
  Zap, 
  Copy,
  Eye,
  Code,
  ExternalLink
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import ChatUIv2 from '../../components/chat/ChatUIv2';
import ChatDemo from '../../components/chat/ChatDemo';

export default function ChatShowcasePage() {
  const [activeDemo, setActiveDemo] = useState<'empty' | 'with-messages'>('empty');

  const features = [
    {
      icon: <Sparkles className="h-5 w-5 text-blue-500" />,
      title: "Interface ChatGPT-like",
      description: "Design moderne fidèle à ChatGPT 2024 avec bulles alignées et animations fluides"
    },
    {
      icon: <Zap className="h-5 w-5 text-yellow-500" />,
      title: "Streaming en temps réel",
      description: "Affichage progressif des réponses avec animation de typing authentique"
    },
    {
      icon: <Palette className="h-5 w-5 text-purple-500" />,
      title: "Thème clair/sombre",
      description: "Basculement dynamique avec sauvegarde automatique des préférences"
    },
    {
      icon: <Keyboard className="h-5 w-5 text-green-500" />,
      title: "Raccourcis clavier",
      description: "Navigation rapide avec Enter, Shift+Enter, Ctrl+K et plus"
    },
    {
      icon: <Copy className="h-5 w-5 text-orange-500" />,
      title: "Copie de messages",
      description: "Bouton de copie au hover sur les réponses de l'IA"
    },
    {
      icon: <MessageSquare className="h-5 w-5 text-indigo-500" />,
      title: "Suggestions intelligentes",
      description: "Questions pré-définies pour démarrer les conversations"
    }
  ];

  const technicalSpecs = [
    {
      category: "Format des Messages",
      items: [
        "Compatible OpenAI API standard",
        "Support des rôles étendus (user, assistant, system, function, tool)",
        "Contenu riche avec métadonnées"
      ]
    },
    {
      category: "Performance",
      items: [
        "Streaming SSE < 200ms latency",
        "Animations 60fps fluides",
        "Auto-scroll intelligent"
      ]
    },
    {
      category: "Accessibilité",
      items: [
        "Raccourcis clavier complets",
        "Support lecteurs d'écran",
        "Contraste optimisé"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-blue-500 rounded-xl">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Interface de Chat Modernisée
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Découvrez la nouvelle interface de chat de Chifa.ai, inspirée de ChatGPT avec des fonctionnalités avancées 
            pour une expérience utilisateur exceptionnelle.
          </p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              <Zap className="h-3 w-3 mr-1" />
              Streaming temps réel
            </Badge>
            <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
              <Palette className="h-3 w-3 mr-1" />
              Thème adaptatif
            </Badge>
            <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              <Keyboard className="h-3 w-3 mr-1" />
              Raccourcis clavier
            </Badge>
          </div>
        </div>

        <Tabs defaultValue="demo" className="space-y-8">
          <TabsList className="grid w-full grid-cols-4 max-w-2xl mx-auto">
            <TabsTrigger value="demo" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Démo Live
            </TabsTrigger>
            <TabsTrigger value="features" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Fonctionnalités
            </TabsTrigger>
            <TabsTrigger value="technical" className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              Technique
            </TabsTrigger>
            <TabsTrigger value="links" className="flex items-center gap-2">
              <ExternalLink className="h-4 w-4" />
              Liens
            </TabsTrigger>
          </TabsList>

          {/* Démo Live */}
          <TabsContent value="demo" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Démonstration Interactive
                </CardTitle>
                <CardDescription>
                  Testez l'interface de chat modernisée en temps réel
                </CardDescription>
                <div className="flex gap-2">
                  <Button
                    variant={activeDemo === 'empty' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveDemo('empty')}
                  >
                    Interface vide
                  </Button>
                  <Button
                    variant={activeDemo === 'with-messages' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveDemo('with-messages')}
                  >
                    Avec messages de démo
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-[600px] border rounded-lg overflow-hidden">
                  {activeDemo === 'empty' ? (
                    <ChatUIv2 />
                  ) : (
                    <ChatDemo />
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Fonctionnalités */}
          <TabsContent value="features" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-lg">
                      {feature.icon}
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Raccourcis Clavier</CardTitle>
                <CardDescription>
                  Naviguez rapidement avec ces raccourcis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span>Envoyer le message</span>
                    <kbd className="px-2 py-1 text-xs font-semibold bg-background border rounded">Enter</kbd>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span>Nouvelle ligne</span>
                    <div className="flex gap-1">
                      <kbd className="px-2 py-1 text-xs font-semibold bg-background border rounded">Shift</kbd>
                      <span className="text-xs">+</span>
                      <kbd className="px-2 py-1 text-xs font-semibold bg-background border rounded">Enter</kbd>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span>Effacer la conversation</span>
                    <div className="flex gap-1">
                      <kbd className="px-2 py-1 text-xs font-semibold bg-background border rounded">Ctrl</kbd>
                      <span className="text-xs">+</span>
                      <kbd className="px-2 py-1 text-xs font-semibold bg-background border rounded">K</kbd>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span>Basculer le thème</span>
                    <span className="text-xs text-muted-foreground">Bouton en haut à droite</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Spécifications Techniques */}
          <TabsContent value="technical" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {technicalSpecs.map((spec, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="text-lg">{spec.category}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {spec.items.map((item, itemIndex) => (
                        <li key={itemIndex} className="flex items-start gap-2 text-sm">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Architecture des Messages</CardTitle>
                <CardDescription>
                  Format standard compatible avec les APIs modernes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
{`interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'function' | 'tool' | 'error';
  content: string;
  name?: string;
  function_call?: any;
  tool_calls?: any[];
  sqlQuery?: string | null;
  sqlResults?: any[] | null;
  timestamp: Date;
}`}
                </pre>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Liens */}
          <TabsContent value="links" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ExternalLink className="h-5 w-5" />
                    Pages de Démonstration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button asChild variant="outline" className="w-full justify-start">
                    <a href="/chat-demo" target="_blank">
                      <Eye className="h-4 w-4 mr-2" />
                      Interface vide
                    </a>
                  </Button>
                  <Button asChild variant="outline" className="w-full justify-start">
                    <a href="/chat-demo-with-messages" target="_blank">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Avec messages de démo
                    </a>
                  </Button>
                  <Button asChild variant="outline" className="w-full justify-start">
                    <a href="/chat-v2" target="_blank">
                      <Sparkles className="h-4 w-4 mr-2" />
                      Interface complète
                    </a>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="h-5 w-5" />
                    Documentation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-1">Composants principaux</p>
                    <p className="text-xs text-muted-foreground">
                      ChatUIv2, MessageBubble, ChatInputV2, ThemeToggle
                    </p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-1">Styles personnalisés</p>
                    <p className="text-xs text-muted-foreground">
                      /src/styles/chat.css - Animations et transitions
                    </p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-1">Documentation complète</p>
                    <p className="text-xs text-muted-foreground">
                      /src/components/chat/README.md
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}