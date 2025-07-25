'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore'; // Import UI store
// import { useSupabase } from '@/contexts/SupabaseContext'; // Bypassing context for this specific test
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { createBrowserClient } from '@supabase/ssr'; // Import for isolated client
import { Menu } from 'lucide-react'; // Import Menu icon
import PharmacyConnectionStatus from '@/components/PharmacyConnectionStatus';

export default function Navbar() {
  const { user, clearAuth, isAdmin } = useAuthStore();
  const { toggleMobileSidebar } = useUIStore();
  const router = useRouter();
  // const supabase = useSupabase(); // Bypassing context for this test
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) {
      console.log('[Navbar] Logout already in progress.');
      return;
    }
    setIsLoggingOut(true);
    console.log('[Navbar] Logout process started. isLoggingOut set to true.');

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      console.log('[Navbar] NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl);
      console.log('[Navbar] NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey);

      if (!supabaseUrl || !supabaseAnonKey) {
        console.error('[Navbar] Supabase URL or Anon Key is missing. Cannot proceed with signOut.');
        alert('Erreur de configuration: URL ou clé Supabase manquante.');
        setIsLoggingOut(false);
        return;
      }

      console.log('[Navbar] Creating a new, isolated Supabase client for signOut...');
      const isolatedSupabaseClient = createBrowserClient(
        supabaseUrl,
        supabaseAnonKey
      );
      console.log('[Navbar] Isolated Supabase client created:', isolatedSupabaseClient);
      console.log('[Navbar] About to call signOut() on isolated client with async/await...');

      const { error } = await isolatedSupabaseClient.auth.signOut();

      console.log('[Navbar] isolatedSupabaseClient.auth.signOut() call finished.');

      if (error) {
        console.error('[Navbar] Error during isolated signOut:', error);
        alert(`Erreur lors de la déconnexion (isolated client): ${error.message} (Code: ${error.status || 'N/A'})`);
      } else {
        console.log('[Navbar] Isolated signOut successful. Clearing auth store...');
        clearAuth();
        console.log('[Navbar] Auth store cleared. Redirecting to /login...');
        router.push('/login');
        console.log('[Navbar] Redirect to /login initiated.');
      }
    } catch (e: any) {
      console.error('[Navbar] Unexpected error in handleLogout (isolated client) catch block:', e);
      alert(`Une erreur inattendue est survenue (isolated client): ${e.message || 'Erreur inconnue'}`);
    } finally {
      console.log('[Navbar] Entering finally block (isolated client). Setting isLoggingOut to false.');
      setIsLoggingOut(false);
    }
  };

  return (
    <nav className="bg-chatgpt-darker border-b border-gray-700 p-4">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center">
          {/* Bouton toggle mobile sidebar */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden mr-2 text-chatgpt-secondary hover:text-chatgpt-primary hover:bg-gray-700" // Visible on mobile, hidden on md and up
            onClick={toggleMobileSidebar}
            aria-label="Ouvrir le menu"
          >
            <Menu className="h-6 w-6" />
          </Button>
          

        </div>
        <div>
          {user ? (
            <div className="flex items-center space-x-2">
              {!isAdmin && <PharmacyConnectionStatus />}
              {isAdmin && (
                <Button asChild variant="outline" size="sm">
                  <Link href="/admin/dashboard">Admin</Link>
                </Button>
              )}
              {/* Bouton temporaire pour tester ChatUIv2 */}
              <Button asChild variant="outline" size="sm" className="border-green-600 text-green-600 hover:bg-green-50">
                <Link href="/chat-v2">Test V2</Link>
              </Button>
              {/* Bouton de déconnexion déplacé dans le Sidebar */}
            </div>
          ) : (
            <div className="space-x-2">
              <Button asChild variant="ghost">
                <Link href="/login">Se Connecter</Link>
              </Button>
              <Button asChild>
                <Link href="/register">S'inscrire</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
