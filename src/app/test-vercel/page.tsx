'use client';

import { ChifaSidebar } from '@/components/chifa-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';

export default function TestVercelPage() {
  // Mock user for testing
  const mockUser = {
    id: 'test-user',
    name: 'Test User',
    email: 'test@chifa.ai',
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <ChifaSidebar user={mockUser as any} />
      <SidebarInset>
        <div className="flex flex-col h-screen">
          <div className="border-b p-4">
            <h1 className="text-2xl font-bold text-green-600">Test Vercel Integration</h1>
            <p className="text-muted-foreground">Testing the Vercel sidebar integration with Chifa.ai</p>
          </div>
          
          <div className="flex-1 p-6 space-y-6">
            <div className="max-w-2xl">
              <h2 className="text-lg font-semibold mb-4">Integration Status</h2>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span>Vercel UI Sidebar Component ✓</span>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span>Chifa.ai Branding & Colors ✓</span>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span>Responsive Design ✓</span>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span>Supabase Integration (En cours)</span>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span>Chat Components (À venir)</span>
                </div>
              </div>
            </div>
            
            <div className="max-w-2xl">
              <h2 className="text-lg font-semibold mb-4">Fonctionnalités Testées</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2">Sidebar Navigation</h3>
                  <p className="text-sm text-muted-foreground">
                    La sidebar Vercel s'affiche correctement avec le branding Chifa.ai
                  </p>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2">Responsive Design</h3>
                  <p className="text-sm text-muted-foreground">
                    La sidebar se transforme en overlay mobile automatiquement
                  </p>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2">Thème Chifa.ai</h3>
                  <p className="text-sm text-muted-foreground">
                    Les couleurs vertes et le logo Chifa.ai sont appliqués
                  </p>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2">Composants UI</h3>
                  <p className="text-sm text-muted-foreground">
                    Tous les composants Radix UI sont fonctionnels
                  </p>
                </div>
              </div>
            </div>
            
            <div className="max-w-2xl">
              <h2 className="text-lg font-semibold mb-4">Actions de Test</h2>
              
              <div className="flex flex-wrap gap-3">
                <Button variant="default">
                  Bouton Principal
                </Button>
                
                <Button variant="secondary">
                  Bouton Secondaire
                </Button>
                
                <Button variant="outline">
                  Bouton Outline
                </Button>
                
                <Button variant="ghost">
                  Bouton Ghost
                </Button>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}