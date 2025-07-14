"use client"

import React from "react";
import Link from "next/link";
import { Github, Twitter, Linkedin, Mail } from "lucide-react";

// Helper function pour créer les icônes avec le bon typage
const createIcon = (IconComponent: React.ElementType | undefined, className: string) => {
  if (!IconComponent) return null;
  return <IconComponent className={className} />;
};

const socialLinks = [
  { href: "https://github.com", icon: Github, label: "GitHub" },
  { href: "https://twitter.com", icon: Twitter, label: "Twitter" },
  { href: "https://linkedin.com", icon: Linkedin, label: "LinkedIn" },
  { href: "mailto:contact@chifa.ai", icon: Mail, label: "Email" },
];

const footerLinks = [
  {
    title: "Produit",
    links: [
      { href: "/features", label: "Fonctionnalités" },
      { href: "/pricing", label: "Tarifs" },
      { href: "/demo", label: "Démo" },
    ],
  },
  {
    title: "Support",
    links: [
      { href: "/docs", label: "Documentation" },
      { href: "/contact", label: "Contact" },
      { href: "/help", label: "Aide" },
    ],
  },
  {
    title: "Entreprise",
    links: [
      { href: "/about", label: "À propos" },
      { href: "/blog", label: "Blog" },
      { href: "/careers", label: "Carrières" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo et description */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">C</span>
              </div>
              <span className="text-xl font-bold">Chifa.ai</span>
            </div>
            <p className="text-gray-400 mb-6 max-w-md">
              L'intelligence artificielle qui révolutionne la gestion de votre pharmacie. 
              Interrogez votre base de données en langage naturel.
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-gray-400 hover:text-white transition-colors"
                  aria-label={link.label}
                >
                  {createIcon(link.icon, 'h-5 w-5')}
                </Link>
              ))}
            </div>
          </div>

          {/* Liens de navigation */}
          {footerLinks.map((section) => (
            <div key={section.title}>
              <h3 className="font-semibold mb-4">{section.title}</h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Séparateur */}
        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2024 Chifa.ai. Tous droits réservés.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link href="/privacy" className="text-gray-400 hover:text-white text-sm">
                Confidentialité
              </Link>
              <Link href="/terms" className="text-gray-400 hover:text-white text-sm">
                Conditions d'utilisation
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}