'use client';

import React from 'react';
import { Settings, Shield, Database, Mail, Globe } from 'lucide-react';

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Paramètres Admin</h1>
        <div className="text-sm text-gray-500">
          Fonctionnalité en développement
        </div>
      </div>

      {/* Placeholder content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <div className="p-3 rounded-full bg-blue-100">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Sécurité</h3>
              <p className="text-sm text-gray-600">Paramètres de sécurité de la plateforme</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Authentification 2FA</span>
              <span className="text-sm text-gray-400">Configuré</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Timeout sessions</span>
              <span className="text-sm text-gray-400">24h</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <div className="p-3 rounded-full bg-green-100">
              <Database className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Base de données</h3>
              <p className="text-sm text-gray-600">Configuration de la base de données</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Backup automatique</span>
              <span className="text-sm text-gray-400">Quotidien</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Connexions actives</span>
              <span className="text-sm text-gray-400">-</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <div className="p-3 rounded-full bg-purple-100">
              <Mail className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Notifications</h3>
              <p className="text-sm text-gray-600">Configuration des emails et notifications</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Emails système</span>
              <span className="text-sm text-gray-400">Activé</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Notifications push</span>
              <span className="text-sm text-gray-400">Activé</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <div className="p-3 rounded-full bg-orange-100">
              <Globe className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Général</h3>
              <p className="text-sm text-gray-600">Paramètres généraux de la plateforme</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Mode maintenance</span>
              <span className="text-sm text-gray-400">Inactif</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Version</span>
              <span className="text-sm text-gray-400">1.0.0</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-12">
          <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Paramètres Avancés</h3>
          <p className="text-gray-600">
            Cette section permettra de configurer tous les paramètres avancés de la plateforme.
          </p>
        </div>
      </div>
    </div>
  );
} 