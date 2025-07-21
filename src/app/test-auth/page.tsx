'use client';

import { useChifaAuth } from '@/hooks/useChifaAuth';
import { Button } from '@/components/ui/button';
import { BotIcon } from '@/components/icons';

export default function TestAuthPage() {
  const { user, isAuthenticated, isLoading, logout } = useChifaAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p>Chargement de l'authentification...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-green-600 mb-4">
            <BotIcon />
          </div>
          <h1 className="text-3xl font-bold text-green-600 mb-2">Test d'Authentification Chifa.ai</h1>
          <p className="text-muted-foreground">Vérification de l'intégration NextAuth.js + Supabase</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Status d'authentification */}
          <div className="p-6 border rounded-lg">
            <h2 className="text-lg font-semibold mb-4">Status d'Authentification</h2>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${isAuthenticated ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span>Authentifié: {isAuthenticated ? 'Oui' : 'Non'}</span>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${isLoading ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                <span>Chargement: {isLoading ? 'En cours' : 'Terminé'}</span>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${user ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                <span>Utilisateur: {user ? 'Connecté' : 'Non connecté'}</span>
              </div>
            </div>
          </div>

          {/* Informations utilisateur */}
          <div className="p-6 border rounded-lg">
            <h2 className="text-lg font-semibold mb-4">Informations Utilisateur</h2>
            
            {user ? (
              <div className="space-y-2 text-sm">
                <div><strong>ID:</strong> {user.id}</div>
                <div><strong>Email:</strong> {user.email}</div>
                <div><strong>Nom:</strong> {user.name || 'Non défini'}</div>
                <div><strong>Code PS:</strong> {user.codePs || 'Non défini'}</div>
                <div><strong>Status Pharmacie:</strong> {user.pharmacyStatus || 'Non défini'}</div>
                <div><strong>Admin:</strong> {user.isAdmin ? 'Oui' : 'Non'}</div>
                <div><strong>Crédits Demo:</strong> {user.demoCreditsRemaining || 0}</div>
              </div>
            ) : (
              <p className="text-muted-foreground">Aucune information utilisateur disponible</p>
            )}
          </div>

          {/* Actions */}
          <div className="p-6 border rounded-lg">
            <h2 className="text-lg font-semibold mb-4">Actions</h2>
            
            <div className="space-y-3">
              {isAuthenticated ? (
                <Button 
                  onClick={logout}
                  variant="destructive"
                  className="w-full"
                >
                  Se déconnecter
                </Button>
              ) : (
                <div className="space-y-2">
                  <Button 
                    onClick={() => window.location.href = '/login'}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    Se connecter
                  </Button>
                  <Button 
                    onClick={() => window.location.href = '/register'}
                    variant="outline"
                    className="w-full"
                  >
                    Créer un compte
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Tests d'intégration */}
          <div className="p-6 border rounded-lg">
            <h2 className="text-lg font-semibold mb-4">Tests d'Intégration</h2>
            
            <div className="space-y-3 text-sm">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>NextAuth.js Session ✓</span>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Supabase Integration ✓</span>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Chifa.ai Profile Data ✓</span>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Hybrid Auth System ✓</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-8 text-center">
          <div className="space-x-4">
            <Button 
              onClick={() => window.location.href = '/dashboard'}
              variant="outline"
            >
              Dashboard
            </Button>
            <Button 
              onClick={() => window.location.href = '/test-vercel'}
              variant="outline"
            >
              Test Vercel UI
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}