"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Star } from "lucide-react"

const testimonials = [
  {
    name: "Dr. Amina Benali",
    role: "Pharmacienne, Alger",
    content: "Chifa.ai a révolutionné ma gestion quotidienne. Je trouve instantanément les informations sur mes stocks et mes ventes.",
    rating: 5,
    initials: "AB"
  },
  {
    name: "Karim Meziani",
    role: "Pharmacien, Oran",
    content: "L'interface en arabe et français est parfaite. Plus besoin de former mon équipe aux logiciels compliqués.",
    rating: 5,
    initials: "KM"
  },
  {
    name: "Fatima Zahra",
    role: "Pharmacienne, Constantine",
    content: "Le système de questions en langage naturel est magique. Mes rapports mensuels se font en quelques minutes.",
    rating: 5,
    initials: "FZ"
  }
]

export function Testimonials() {
  return (
    <section className="container mx-auto px-4 py-16 lg:py-24 bg-muted/50">
      <div className="text-center space-y-4 mb-16">
        <h2 className="text-3xl md:text-4xl font-bold">
          Ils nous font confiance
        </h2>
        <p className="max-w-[600px] mx-auto text-xl text-muted-foreground">
          Plus de 500 pharmacies en Algérie utilisent déjà Chifa.ai
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {testimonials.map((testimonial, index) => (
          <Card key={index} className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center space-x-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              
              <blockquote className="text-lg mb-6">
                "{testimonial.content}"
              </blockquote>
              
              <div className="flex items-center space-x-3">
                <Avatar>
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {testimonial.initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}