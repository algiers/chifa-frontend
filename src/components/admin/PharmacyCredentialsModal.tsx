'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import TestLoginButton from '@/components/admin/TestLoginButton';

interface PharmacyCredentialsModalProps {
  isOpen: boolean;
  onClose: () => void;
  pharmacyData: {
    pharmacy_name: string;
    email: string;
    temp_password: string;
    code_ps: string;
  };
}

export default function PharmacyCredentialsModal({ 
  isOpen, 
  onClose, 
  pharmacyData 
}: PharmacyCredentialsModalProps) {
  const [copied, setCopied] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const copyAllCredentials = async () => {
    const credentials = `
Informations de connexion - ${pharmacyData.pharmacy_name}
=================================================

🏥 Nom de la pharmacie: ${pharmacyData.pharmacy_name}
📧 Email de connexion: ${pharmacyData.email}
🔑 Mot de passe temporaire: ${pharmacyData.temp_password}
🏷️ Code PS: ${pharmacyData.code_ps}

🌐 URL de connexion: ${window.location.origin}/login

Instructions:
1. Utilisez l'email et le mot de passe ci-dessus pour vous connecter
2. Changez le mot de passe après votre première connexion
3. Contactez l'administrateur en cas de problème

Généré le: ${new Date().toLocaleString('fr-FR')}
    `.trim();

    await copyToClipboard(credentials, 'all');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-green-700">
            ✅ Pharmacie créée avec succès !
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Important :</strong> Transmettez ces informations au pharmacien. 
                Le mot de passe peut être changé après la première connexion.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {/* Nom de la pharmacie */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              🏥 Nom de la pharmacie
            </label>
            <div className="flex items-center gap-2">
              <span className="flex-1 font-semibold text-lg">
                {pharmacyData.pharmacy_name}
              </span>
            </div>
          </div>

          {/* Email */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📧 Email de connexion
            </label>
            <div className="flex items-center gap-2">
              <span className="flex-1 font-mono bg-white px-3 py-2 rounded border text-lg">
                {pharmacyData.email}
              </span>
              <Button
                onClick={() => copyToClipboard(pharmacyData.email, 'email')}
                variant="outline"
                size="sm"
              >
                {copied === 'email' ? '✅ Copié' : '📋 Copier'}
              </Button>
            </div>
          </div>

          {/* Mot de passe */}
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <label className="block text-sm font-medium text-orange-700 mb-2">
              🔑 Mot de passe temporaire
            </label>
            <div className="flex items-center gap-2">
              <span className="flex-1 font-mono bg-yellow-100 px-3 py-2 rounded border border-yellow-300 text-lg font-bold select-all">
                {pharmacyData.temp_password}
              </span>
              <Button
                onClick={() => copyToClipboard(pharmacyData.temp_password, 'password')}
                variant="outline"
                size="sm"
                className="bg-orange-100 hover:bg-orange-200"
              >
                {copied === 'password' ? '✅ Copié' : '📋 Copier'}
              </Button>
            </div>
          </div>

          {/* Code PS */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              🏷️ Code PS
            </label>
            <div className="flex items-center gap-2">
              <span className="flex-1 font-mono bg-white px-3 py-2 rounded border text-lg">
                {pharmacyData.code_ps}
              </span>
              <Button
                onClick={() => copyToClipboard(pharmacyData.code_ps, 'code_ps')}
                variant="outline"
                size="sm"
              >
                {copied === 'code_ps' ? '✅ Copié' : '📋 Copier'}
              </Button>
            </div>
          </div>

          {/* URL de connexion */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <label className="block text-sm font-medium text-blue-700 mb-2">
              🌐 URL de connexion
            </label>
            <div className="flex items-center gap-2">
              <span className="flex-1 font-mono bg-white px-3 py-2 rounded border text-sm">
                {window.location.origin}/login
              </span>
              <Button
                onClick={() => copyToClipboard(`${window.location.origin}/login`, 'url')}
                variant="outline"
                size="sm"
              >
                {copied === 'url' ? '✅ Copié' : '📋 Copier'}
              </Button>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button
            onClick={copyAllCredentials}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            {copied === 'all' ? '✅ Toutes les infos copiées' : '📋 Copier toutes les informations'}
          </Button>
          <TestLoginButton 
            email={pharmacyData.email} 
            password={pharmacyData.temp_password} 
          />
          <Button
            onClick={onClose}
            variant="outline"
            className="px-6"
          >
            Fermer
          </Button>
        </div>

        <div className="mt-4 text-xs text-gray-500 bg-gray-50 p-3 rounded">
          <strong>Instructions pour le pharmacien :</strong><br/>
          1. Rendez-vous sur {window.location.origin}/login<br/>
          2. Connectez-vous avec l'email et le mot de passe ci-dessus<br/>
          3. Changez le mot de passe après votre première connexion<br/>
          4. Contactez l'administrateur en cas de problème
        </div>
      </div>
    </div>
  );
}