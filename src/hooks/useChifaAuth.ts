'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { useCallback, useEffect } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import type { User } from '@supabase/supabase-js';

/**
 * Hybrid authentication hook that combines Supabase and NextAuth.js
 * - Uses Supabase for actual authentication (login/logout)
 * - Uses NextAuth.js for session management (required by Vercel template)
 * - Maintains compatibility with existing Chifa.ai user profiles
 */
export function useChifaAuth() {
  const { data: session, status } = useSession();
  const supabase = createSupabaseBrowserClient();
  const { setUser, setProfileDetails, clearAuth, setAuthReady } = useAuthStore();

  // Sync NextAuth session with Zustand store
  useEffect(() => {
    if (status === 'loading') return;

    if (session?.user) {
      // Convert NextAuth user to Supabase User format for compatibility
      const supabaseUser: User = {
        id: session.user.id,
        email: session.user.email,
        user_metadata: {
          full_name: session.user.name,
        },
        app_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
        role: 'authenticated',
      } as User;

      setUser(supabaseUser);
      
      // Set profile details from NextAuth session
      setProfileDetails({
        profileId: session.user.id,
        email: session.user.email || undefined,
        fullName: session.user.name || undefined,
        codePs: session.user.codePs || undefined,
        pharmacyStatus: (session.user.pharmacyStatus as any) || 'not_registered',
        isAdmin: session.user.isAdmin || false,
        demoCreditsRemaining: session.user.demoCreditsRemaining || 0,
      });
    } else {
      clearAuth();
    }

    setAuthReady(true);
  }, [session, status, setUser, setProfileDetails, clearAuth, setAuthReady]);

  // Login function using NextAuth
  const login = useCallback(async (email: string, password: string) => {
    try {
      const result = await signIn('supabase', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        throw new Error(result.error);
      }

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Login failed' 
      };
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    try {
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      // Sign out from NextAuth
      await signOut({ redirect: false });
      
      // Clear local state
      clearAuth();
      
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Logout failed' 
      };
    }
  }, [supabase, clearAuth]);

  // Register function using Supabase
  const register = useCallback(async (email: string, password: string, fullName?: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        throw error;
      }

      return { success: true, data };
    } catch (error) {
      console.error('Registration error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Registration failed' 
      };
    }
  }, [supabase]);

  // Reload profile function
  const reloadProfile = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, code_ps, pharmacy_name, pharmacy_status, is_admin, demo_credits_remaining')
        .eq('id', session.user.id)
        .single();

      if (error) {
        console.error('Profile reload error:', error);
        return;
      }

      if (profileData) {
        setProfileDetails({
          profileId: profileData.id,
          fullName: profileData.full_name,
          email: profileData.email,
          codePs: profileData.code_ps,
          pharmacyName: profileData.pharmacy_name,
          pharmacyStatus: profileData.pharmacy_status || 'not_registered',
          isAdmin: profileData.is_admin || false,
          demoCreditsRemaining: profileData.demo_credits_remaining || 0,
        });
      }
    } catch (error) {
      console.error('Profile reload error:', error);
    }
  }, [session?.user?.id, supabase, setProfileDetails]);

  return {
    // Session data
    user: session?.user || null,
    isAuthenticated: !!session?.user,
    isLoading: status === 'loading',
    
    // Auth functions
    login,
    logout,
    register,
    reloadProfile,
    
    // Supabase client for direct access if needed
    supabase,
  };
}