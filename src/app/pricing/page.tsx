"use client";

import { Header } from "../../components/sections/Header"
import { Footer } from "../../components/sections/Footer"
import { Pricing } from "../../components/sections/Pricing"
import { Badge } from "../../components/ui/badge"
import { Button } from "../../components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function PricingPage() {
  return (
    <div className="min-h-screen">
      <Header />
      
      <main>
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-16 lg:py-24">
          <div className="text-center space-y-8">
            <div className="flex items-center justify-center space-x-2">
              <Badge variant="outline" className="text-sm border-green-600 text-green-600">
                Tarification transparente
              </Badge>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              Des plans adaptés à 
              <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                {" "}chaque pharmacie
              </span>
            </h1>
            
            <p className="max-w-[600px] mx-auto text-xl text-muted-foreground">
              Commencez gratuitement et évoluez selon vos besoins. 
              Aucune carte de crédit requise pour l'essai gratuit.
            </p>

            <Button variant="outline" asChild className="border-green-600 text-green-600 hover:bg-green-50">
              <Link href="/" className="inline-flex items-center">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour à l'accueil
              </Link>
            </Button>
          </div>
        </section>

        {/* Pricing Section */}
        <Pricing />

        {/* FAQ Section */}
        <section className="container mx-auto px-4 py-16 lg:py-24 bg-muted/50">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">
              Questions fréquentes
            </h2>
            <p className="max-w-[600px] mx-auto text-xl text-muted-foreground">
              Tout ce que vous devez savoir sur Chifa.ai
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-8">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Comment fonctionne l'essai gratuit ?</h3>
              <p className="text-muted-foreground">
                L'essai gratuit vous donne accès à 3 requêtes IA pour tester notre solution. 
                Aucune carte de crédit n'est requise et vous pouvez passer à un plan payant à tout moment.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Mes données sont-elles sécurisées ?</h3>
              <p className="text-muted-foreground">
                Absolument. Vos données restent dans votre pharmacie et ne transitent jamais par nos serveurs. 
                Nous utilisons un chiffrement de bout en bout pour toutes les communications.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Puis-je changer de plan à tout moment ?</h3>
              <p className="text-muted-foreground">
                Oui, vous pouvez passer à un plan supérieur ou inférieur à tout moment. 
                Les changements prennent effet immédiatement.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Quel support est inclus ?</h3>
              <p className="text-muted-foreground">
                Tous les plans incluent un support par email. Le plan Pro inclut un support prioritaire, 
                et le plan Entreprise inclut un support dédié avec SLA.
              </p>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  )
}
