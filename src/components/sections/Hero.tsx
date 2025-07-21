"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowRight, Sparkles } from "lucide-react"
import Link from "next/link"

export function Hero() {
  return (
    <section className="container mx-auto px-4 py-16 lg:py-24">
      <div className="flex flex-col items-center text-center space-y-8">
        {/* Badge */}
        <div className="flex items-center space-x-2 rounded-full border px-3 py-1 text-sm bg-green-50 border-green-200 text-green-700">
          <Sparkles className="h-4 w-4" />
          <span>Nouveau: Analytics CHIFA disponible</span>
        </div>

        {/* Main Title */}
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
          Interrogez votre pharmacie
          <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {" "}en langage naturel
          </span>
        </h1>

        {/* Subtitle */}
        <p className="max-w-[600px] text-xl text-muted-foreground">
          Solution IA tout-en-un qui transforme votre gestion de pharmacie.
          Obtenez des réponses instantanées et des insights précieux à partir de vos données.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button asChild size="lg" className="text-lg px-8 bg-green-600 hover:bg-green-700">
            <Link href="/register">
              Démarrer Analytics
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="text-lg px-8 border-green-600 text-green-600 hover:bg-green-50">
            <Link href="/pricing">
              Tester Démo
            </Link>
          </Button>
        </div>

        {/* Email Form */}
        <div className="w-full max-w-md space-y-2">
          <div className="flex space-x-2">
            <Input
              type="email"
              placeholder="pharmacie@exemple.dz"
              className="flex-1"
            />
            <Button type="submit" className="bg-green-600 hover:bg-green-700">
              Analyser
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Démarrage gratuit. Aucune carte de crédit requise.
          </p>
        </div>
      </div>
    </section>
  )
}