#!/bin/bash

echo "🔄 Redémarrage complet avec configuration corrigée"
echo "=============================================="

# Arrêter tous les processus Next.js
pkill -f "next" 2>/dev/null || echo "Aucun processus Next.js trouvé"
sleep 2

# Aller au répertoire parent
pushd /opt/Chifa.ai > /dev/null

# Arrêter les sessions screen existantes
screen -S chifa_frontend -X quit 2>/dev/null || echo "Aucune session chifa_frontend"
screen -S langgraph_agent -X quit 2>/dev/null || echo "Aucune session langgraph_agent"
sleep 1

# Redémarrer avec la configuration corrigée
echo "Démarrage du serveur avec configuration corrigée..."
./start_chifa_stack.sh

popd > /dev/null

echo "✅ Redémarrage terminé"
echo "Vérifiez avec: ss -tlnp | grep :3000"