#!/bin/bash

echo "🚀 Build de production pour Chifa.ai Frontend"
echo "=============================================="

# Nettoyage des caches
echo "🧹 Nettoyage des caches..."
rm -rf .next
rm -rf node_modules/.cache
npm cache clean --force

# Installation des dépendances
echo "📦 Installation des dépendances..."
npm install

# Build de production
echo "🔨 Build de production..."
NODE_ENV=production npm run build

# Vérification du build
if [ $? -eq 0 ]; then
    echo "✅ Build réussi !"
    echo "📊 Taille du build:"
    du -sh .next/
else
    echo "❌ Erreur lors du build"
    exit 1
fi

echo "🎉 Build terminé avec succès !" 