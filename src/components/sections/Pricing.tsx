"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Check } from "lucide-react"
import Link from "next/link"

const plans = [
  {
    name: "Démo Gratuite",
    price: "0",
    currency: "DA",
    description: "Parfait pour découvrir Chifa.ai",
    features: [
      "3 requêtes IA par mois",
      "Accès à votre base de données",
      "Support communautaire",
      "Interface multilingue"
    ],
    cta: "Commencer gratuitement",
    href: "/register?plan=free_demo"
  },
  {
    name: "Pro Pharmacie",
    price: "4,900",
    currency: "DA",
    period: "/mois",
    description: "Pour les pharmacies qui veulent optimiser leur gestion",
    features: [
      "Requêtes IA illimitées",
      "Historique des conversations",
      "Visualisation avancée des données",
      "Support prioritaire par email",
      "Intégration API",
      "Rapports automatiques"
    ],
    cta: "Choisir Pro",
    href: "/register?plan=pro_monthly",
    popular: true
  },
  {
    name: "Entreprise",
    price: "Sur Devis",
    description: "Solution personnalisée pour les grandes structures",
    features: [
      "Toutes les fonctionnalités Pro",
      "Support dédié et SLA",
      "Personnalisations avancées",
      "Formation et onboarding",
      "Intégration sur mesure",
      "Consultant dédié"
    ],
    cta: "Nous contacter",
    href: "/contact"
  }
]

export function Pricing() {
  return (
    <section className="container mx-auto px-4 py-16 lg:py-24">
      <div className="text-center space-y-4 mb-16">
        <h2 className="text-3xl md:text-4xl font-bold">
          Des plans adaptés à chaque pharmacie
        </h2>
        <p className="max-w-[600px] mx-auto text-xl text-muted-foreground">
          Commencez gratuitement ou choisissez un plan pour débloquer tout le potentiel de Chifa.ai
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {plans.map((plan, index) => (
          <Card key={index} className={`relative ${plan.popular ? 'border-green-600 shadow-lg scale-105 bg-green-50/50' : 'border-border'}`}>
            {plan.popular && (
              <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-green-600 text-white">
                Populaire
              </Badge>
            )}
            
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-2xl">{plan.name}</CardTitle>
              <div className="flex items-baseline justify-center space-x-1">
                <span className="text-4xl font-bold">{plan.price}</span>
                {plan.currency && <span className="text-muted-foreground">{plan.currency}</span>}
                {plan.period && <span className="text-muted-foreground">{plan.period}</span>}
              </div>
              <CardDescription className="text-base">{plan.description}</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {plan.features.map((feature, featureIndex) => (
                <div key={featureIndex} className="flex items-center space-x-3">
                  <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </CardContent>

            <CardFooter>
              <Button 
                asChild 
                className={`w-full ${plan.popular ? 'bg-green-600 hover:bg-green-700 text-white' : 'border-green-600 text-green-600 hover:bg-green-50'}`}
                variant={plan.popular ? 'default' : 'outline'}
              >
                <Link href={plan.href}>
                  {plan.cta}
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="text-center mt-12">
        <p className="text-muted-foreground">
          Toutes les formules incluent un essai gratuit de 7 jours • Aucun engagement
        </p>
      </div>
    </section>
  )
}