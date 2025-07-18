'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useUIStore } from '@/stores/uiStore';
import { useAuthStore } from '@/stores/authStore';
import {
  LayoutDashboard,
  Building2,
  Users,
  Settings,
  BarChart3,
  X,
  ShieldCheck,
  LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createBrowserClient } from '@supabase/ssr';

interface NavItem {
  href: string;
  label: string;
  icon?: React.ElementType;
}

// Helper function pour créer les icônes avec le bon typage
const createIcon = (IconComponent: React.ElementType | undefined, className: string) => {
  if (!IconComponent) return null;
  const Component = IconComponent as React.ComponentType<{ className?: string }>;
  return <Component className={className} />;
};

const adminNavItems: NavItem[] = [
  { href: '/admin/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/admin/pharmacies', label: 'Pharmacies', icon: Building2 },
  { href: '/admin/users', label: 'Utilisateurs', icon: Users },
  { href: '/admin/analytics', label: 'Analyses', icon: BarChart3 },
  { href: '/admin/settings', label: 'Paramètres', icon: Settings },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isMobileSidebarOpen, setMobileSidebarOpen, toggleMobileSidebar } = useUIStore();
  const { user, clearAuth } = useAuthStore();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Fermer le sidebar mobile lors d'un changement de route
  useEffect(() => {
    if (isMobileSidebarOpen) {
      setMobileSidebarOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, setMobileSidebarOpen]);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);

    try {
      console.log('[AdminSidebar] Starting logout process...');
      
      // Méthode 1: Essayer la déconnexion Supabase normale
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (supabaseUrl && supabaseAnonKey) {
        try {
          const isolatedSupabaseClient = createBrowserClient(supabaseUrl, supabaseAnonKey);
          const { error } = await isolatedSupabaseClient.auth.signOut();
          
          if (error) {
            console.warn('[AdminSidebar] Supabase signOut error (continuing anyway):', error);
          } else {
            console.log('[AdminSidebar] Supabase signOut successful');
          }
        } catch (supabaseError) {
          console.warn('[AdminSidebar] Supabase signOut failed (continuing anyway):', supabaseError);
        }
      }

      // Méthode 2: Forcer la déconnexion côté client (toujours exécutée)
      console.log('[AdminSidebar] Clearing local auth state...');
      clearAuth();
      
      // Méthode 3: Nettoyer le localStorage
      try {
        localStorage.removeItem('auth-storage');
        localStorage.removeItem('sb-ddeibfjxpwnisguehnmo-auth-token');
        console.log('[AdminSidebar] Local storage cleared');
      } catch (storageError) {
        console.warn('[AdminSidebar] Could not clear localStorage:', storageError);
      }

      // Méthode 4: Redirection forcée
      console.log('[AdminSidebar] Redirecting to login...');
      window.location.href = '/login'; // Utiliser window.location pour forcer la redirection
      
    } catch (e: any) {
      console.error('[AdminSidebar] Unexpected error during logout:', e);
      
      // En cas d'erreur, forcer quand même la déconnexion
      clearAuth();
      localStorage.removeItem('auth-storage');
      window.location.href = '/login';
    } finally {
      setIsLoggingOut(false);
    }
  };

  const sidebarContent = (
    <>
      <div className="flex justify-between items-center md:block">
        <div className="flex items-center space-x-2 mb-6 px-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Admin Panel</h2>
            <p className="text-xs text-gray-400">Chifa.ai</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden text-gray-300 hover:text-white"
          onClick={toggleMobileSidebar}
          aria-label="Fermer le menu"
        >
          <X className="h-6 w-6" />
        </Button>
      </div>

      {/* Navigation principale */}
      <nav className="flex-1">
        <ul>
          {adminNavItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg hover:bg-gray-700 transition-colors duration-200
                  ${pathname === item.href ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-300 hover:text-white hover:bg-gray-700'}`}
                onClick={() => isMobileSidebarOpen && setMobileSidebarOpen(false)}
              >
                {createIcon(item.icon, 'w-5 h-5')}
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Bouton de déconnexion en bas */}
      {user && (
        <div className="mt-auto pt-4 border-t border-gray-700">
          <Button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg bg-transparent text-gray-300 hover:text-white hover:bg-gray-700 transition-colors duration-200 disabled:opacity-50"
            variant="ghost"
          >
            <LogOut className="w-5 h-5" />
            <span>{isLoggingOut ? 'Déconnexion...' : 'Déconnexion'}</span>
          </Button>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Sidebar pour écrans larges */}
      <aside className="w-64 bg-gray-800 text-white p-4 space-y-2 hidden md:flex md:flex-col min-h-screen sticky top-0">
        {sidebarContent}
      </aside>

      {/* Sidebar pour mobile (overlay) */}
      {isMobileSidebarOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setMobileSidebarOpen(false)}
            aria-hidden="true"
          />
          {/* Contenu du Sidebar Mobile */}
          <aside className="fixed top-0 left-0 w-64 h-full bg-gray-800 text-white p-4 space-y-2 z-50 transform transition-transform ease-in-out duration-300 md:hidden flex flex-col">
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  );
} 