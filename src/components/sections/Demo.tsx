"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { MessageSquare, BarChart3, Database } from "lucide-react"

export function Demo() {
  return (
    <section className="container mx-auto px-4 py-16 lg:py-24">
      <div className="text-center space-y-4 mb-16">
        <h2 className="text-3xl md:text-4xl font-bold">
          Découvrez Chifa.ai en action
        </h2>
        <p className="max-w-[600px] mx-auto text-xl text-muted-foreground">
          Explorez les différentes fonctionnalités qui révolutionneront votre pharmacie
        </p>
      </div>

      <Tabs defaultValue="chat" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Chat IA
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="database" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Données
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat">
          <Card className="border-0 shadow-xl">
            <CardContent className="p-8">
              <div className="aspect-video bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="h-16 w-16 mx-auto mb-4 text-blue-600" />
                  <h3 className="text-2xl font-bold mb-2">Interface Chat IA</h3>
                  <p className="text-muted-foreground max-w-md">
                    Posez vos questions en français : "Quel est mon stock de Paracétamol ?" 
                    et obtenez des réponses instantanées.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card className="border-0 shadow-xl">
            <CardContent className="p-8">
              <div className="aspect-video bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="h-16 w-16 mx-auto mb-4 text-green-600" />
                  <h3 className="text-2xl font-bold mb-2">Tableaux de Bord</h3>
                  <p className="text-muted-foreground max-w-md">
                    Visualisez vos ventes, stocks et tendances avec des graphiques 
                    automatiquement générés.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="database">
          <Card className="border-0 shadow-xl">
            <CardContent className="p-8">
              <div className="aspect-video bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Database className="h-16 w-16 mx-auto mb-4 text-purple-600" />
                  <h3 className="text-2xl font-bold mb-2">Données Sécurisées</h3>
                  <p className="text-muted-foreground max-w-md">
                    Vos données restent dans votre pharmacie. Connexion sécurisée 
                    à votre système existant.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </section>
  )
}