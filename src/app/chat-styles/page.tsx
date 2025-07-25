"use client"

import Link from "next/link"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"

export default function ChatStylesPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Styles de Chat Chifa.ai</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Original Chat */}
          <Card>
            <CardHeader>
              <CardTitle>Chat Original</CardTitle>
              <CardDescription>
                Interface de chat classique avec bulles de messages
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-muted p-3 rounded-lg text-sm">
                  Interface traditionnelle avec sidebar et bulles de messages
                </div>
                <Link href="/chat-v2">
                  <Button className="w-full">Voir le Chat Original</Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Flat Style */}
          <Card>
            <CardHeader>
              <CardTitle>Style Plat</CardTitle>
              <CardDescription>
                Design moderne sans bulles, style minimaliste
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-l-4 border-blue-500 pl-3 text-sm">
                  Messages sans bulles, design épuré et moderne
                </div>
                <Link href="/chat-showcase">
                  <Button className="w-full" variant="outline">Voir le Style Plat</Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Gemini Style */}
          <Card>
            <CardHeader>
              <CardTitle>Style Gemini</CardTitle>
              <CardDescription>
                Interface inspirée de Google Gemini, moderne et élégante
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-blue-600 text-white p-3 rounded-2xl text-sm">
                  Design inspiré de Gemini avec animations fluides
                </div>
                <Link href="/chat-gemini">
                  <Button className="w-full" variant="default">Voir le Style Gemini</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-12">
          <h2 className="text-2xl font-semibold mb-6">Fonctionnalités</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Fonctionnalités Communes</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>✅ Streaming en temps réel</li>
                  <li>✅ Gestion des conversations</li>
                  <li>✅ Sélection de modèles</li>
                  <li>✅ Mode sombre/clair</li>
                  <li>✅ Historique des messages</li>
                  <li>✅ Responsive design</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Spécificités Gemini</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>🎨 Animations fluides</li>
                  <li>🎯 Interface épurée</li>
                  <li>📱 Design mobile-first</li>
                  <li>⚡ Performance optimisée</li>
                  <li>🎪 Indicateur de frappe animé</li>
                  <li>🔄 Transitions thème</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-muted-foreground">
            Choisissez le style qui correspond le mieux à vos préférences d'interface utilisateur.
          </p>
        </div>
      </div>
    </div>
  )
}