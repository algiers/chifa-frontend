"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bot, BarChart3, MessageSquare, Shield } from "lucide-react"
import React from "react"

const features = [
  {
    icon: Bot,
    title: "IA Conversationnelle",
    description: "Interrogez votre base de données en langage naturel. Plus besoin de connaître SQL."
  },
  {
    icon: BarChart3,
    title: "Analytics Avancées",
    description: "Visualisez vos données avec des graphiques intelligents et des insights automatiques."
  },
  {
    icon: MessageSquare,
    title: "Chat Intelligent",
    description: "Historique des conversations et suggestions personnalisées pour votre pharmacie."
  },
  {
    icon: Shield,
    title: "Sécurité Totale",
    description: "Vos données restent locales et sécurisées. Chiffrement de bout en bout."
  }
]

export function Features() {
  return (
    <section className="container mx-auto px-4 py-16 lg:py-24">
      <div className="text-center space-y-4 mb-16">
        <h2 className="text-3xl md:text-4xl font-bold">
          Tout ce dont votre pharmacie a besoin
        </h2>
        <p className="max-w-[600px] mx-auto text-xl text-muted-foreground">
          Une solution complète pour moderniser la gestion de votre officine
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((feature, index) => (
          <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                {feature.icon && React.createElement(feature.icon, { className: 'h-6 w-6 text-primary' })}
              </div>
              <CardTitle className="text-xl">{feature.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                {feature.description}
              </CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}