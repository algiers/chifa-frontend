'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, signOut, useSession } from 'next-auth/react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/authStore';

export function useAuth() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const { user, setUser, clearAuth } = useAuthStore();
  
  // Sync NextAuth session with Supabase and our auth store
  useEffect(() => {
    const syncAuth = async () => {
      try {
        setIsLoading(true);
        
        // Check Supabase session
        const supabase = createSupabaseBrowserClient();
        const { data: { session: supabaseSession } } = await supabase.auth.getSession();
        
        if (status === 'authenticated' && session?.user) {
          // NextAuth is authenticated, update our store
          if (!user || user.id !== session.user.id) {
            setUser({
              id: session.user.id || '',
              email: session.user.email || '',
              user_metadata: {
                full_name: session.user.name || '',
                avatar_url: session.user.image || '',
              },
            } as any);
          }
        } else if (supabaseSession?.user) {
          // Supabase is authenticated but NextAuth isn't
          // This can happen if the user refreshes the page
          // We'll keep the Supabase session and update our store
          setUser({
            id: supabaseSession.user.id,
            email: supabaseSession.user.email || '',
            user_metadata: {
              full_name: supabaseSession.user.user_metadata?.full_name || supabaseSession.user.email?.split('@')[0] || '',
              avatar_url: supabaseSession.user.user_metadata?.avatar_url || '',
            },
          } as any);
        } else {
          // Neither is authenticated
          clearAuth();
        }
      } catch (error) {
        console.error('Auth sync error:', error);
        clearAuth();
      } finally {
        setIsLoading(false);
      }
    };
    
    syncAuth();
  }, [session, status, user, setUser, clearAuth]);
  
  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      
      // Sign in with NextAuth
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });
      
      if (result?.error) {
        throw new Error(result.error);
      }
      
      // Vérifier si l'authentification a réussi
      const supabase = createSupabaseBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        console.log('Authentification réussie, redirection vers /chat-v2');
        // Forcer une redirection complète pour éviter les problèmes de routage
        window.location.href = '/chat-v2';
      } else {
        console.error('Session non trouvée après connexion');
        throw new Error("Échec de l'authentification");
      }
      
      return true;
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.message || 'Failed to login');
    } finally {
      setIsLoading(false);
    }
  };
  
  const register = async (email: string, password: string, name?: string) => {
    try {
      setIsLoading(true);
      
      // Register with Supabase directly
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name },
        },
      });
      
      if (error) throw new Error(error.message);
      
      // Sign in with NextAuth after registration
      if (data.user) {
        await login(email, password);
      }
      
      return true;
    } catch (error: any) {
      console.error('Registration error:', error);
      throw new Error(error.message || 'Failed to register');
    } finally {
      setIsLoading(false);
    }
  };
  
  const logout = async () => {
    try {
      setIsLoading(true);
      
      // Sign out from Supabase
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
      
      // Sign out from NextAuth
      await signOut({ redirect: false });
      
      // Clear our auth store
      clearAuth();
      
      // Redirect to login
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
  };
}