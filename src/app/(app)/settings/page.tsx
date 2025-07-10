'use client';

import React from 'react';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function SettingsPage() {
  const { 
    user, 
    fullName, 
    email, 
    phoneNumber, 
    pharmacyName, 
    pharmacyAddress, 
    codePs, 
    pharmacyStatus, 
    currentPlanId, 
    demoCreditsRemaining 
  } = useAuthStore();

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Paramètres</h1>
      
      <div className="space-y-8">
        {/* Informations utilisateur */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Informations Utilisateur</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fullName">Nom Complet</Label>
              <Input id="fullName" value={fullName || ''} disabled />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={email || ''} disabled />
            </div>
            <div>
              <Label htmlFor="phoneNumber">Téléphone</Label>
              <Input id="phoneNumber" value={phoneNumber || ''} disabled />
            </div>
          </div>
        </div>

        {/* Informations pharmacie */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Informations Pharmacie</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="codePs">Code PS</Label>
              <Input id="codePs" value={codePs || ''} disabled />
            </div>
            <div>
              <Label htmlFor="pharmacyName">Nom de la Pharmacie</Label>
              <Input id="pharmacyName" value={pharmacyName || ''} disabled />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="pharmacyAddress">Adresse</Label>
              <Input id="pharmacyAddress" value={pharmacyAddress || ''} disabled />
            </div>
          </div>
        </div>

        {/* Informations compte */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Informations Compte</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="pharmacyStatus">Statut Pharmacie</Label>
              <Input 
                id="pharmacyStatus" 
                value={pharmacyStatus || ''} 
                disabled 
                className={
                  pharmacyStatus === 'active' ? 'text-green-600' :
                  pharmacyStatus === 'active_demo' ? 'text-blue-600' :
                  pharmacyStatus === 'pending_payment_approval' ? 'text-orange-600' :
                  'text-gray-600'
                }
              />
            </div>
            <div>
              <Label htmlFor="currentPlan">Plan Actuel</Label>
              <Input id="currentPlan" value={currentPlanId || ''} disabled />
            </div>
            {pharmacyStatus === 'active_demo' && (
              <div>
                <Label htmlFor="demoCredits">Crédits Démo Restants</Label>
                <Input id="demoCredits" value={demoCreditsRemaining?.toString() || '0'} disabled />
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Actions</h2>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Pour modifier vos informations, veuillez contacter le support.
            </p>
            <div className="flex space-x-4">
              <Button variant="outline" disabled>
                Modifier le Profil
              </Button>
              <Button variant="outline" disabled>
                Changer de Plan
              </Button>
              <Button variant="outline" disabled>
                Contacter le Support
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 