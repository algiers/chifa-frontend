'use client';

import React, { useEffect } from 'react';
import { useChatStore } from '../../stores/chatStore';
import ChatUIv2 from './ChatUIv2';

// Messages de démonstration
const demoMessages = [
  {
    role: 'user' as const,
    content: 'Bonjour, pouvez-vous me dire quel est le stock actuel de Paracétamol 1000mg ?'
  },
  {
    role: 'assistant' as const,
    content: 'Bonjour ! Je vais vérifier le stock de Paracétamol 1000mg pour vous.\n\nD\'après les données de votre pharmacie, voici les informations sur le Paracétamol 1000mg :\n\n• **Stock actuel** : 245 boîtes\n• **Seuil d\'alerte** : 50 boîtes\n• **Dernière livraison** : 15 novembre 2024\n• **Prochaine commande suggérée** : Dans 3 semaines\n\nVotre stock est actuellement suffisant. Souhaitez-vous que je vérifie d\'autres médicaments ?',
    sqlResults: [
      { medicament: 'Paracétamol 1000mg', stock: 245, seuil_alerte: 50, derniere_livraison: '2024-11-15' }
    ]
  },
  {
    role: 'user' as const,
    content: 'Parfait ! Pouvez-vous aussi me montrer les médicaments en rupture de stock ?'
  },
  {
    role: 'assistant' as const,
    content: 'Voici la liste des médicaments actuellement en rupture de stock dans votre pharmacie :\n\n🔴 **Médicaments en rupture** :\n• Amoxicilline 500mg - Stock : 0 boîtes\n• Doliprane 500mg sirop - Stock : 0 flacons\n• Ventoline 100µg - Stock : 0 inhalateurs\n\n⚠️ **Médicaments en alerte** (stock faible) :\n• Ibuprofène 400mg - Stock : 8 boîtes (seuil : 20)\n• Oméprazole 20mg - Stock : 12 boîtes (seuil : 25)\n\nJe recommande de passer commande rapidement pour les médicaments en rupture. Voulez-vous que je génère un bon de commande ?'
  }
];

export default function ChatDemo() {
  const { setMessages, clearChat } = useChatStore();

  useEffect(() => {
    // Charger les messages de démonstration au montage du composant
    const messagesWithIds = demoMessages.map((msg, index) => ({
      ...msg,
      id: `demo-${index}`,
      timestamp: new Date(Date.now() - (demoMessages.length - index) * 60000) // Messages espacés de 1 minute
    }));
    
    setMessages(messagesWithIds);

    // Nettoyer au démontage
    return () => {
      clearChat();
    };
  }, [setMessages, clearChat]);

  return <ChatUIv2 />;
}