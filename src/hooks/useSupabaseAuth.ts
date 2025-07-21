'use client';

import { useCallback, useEffect, useRef } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js';

export function useSupabaseAuth() {
  const supabase = createSupabaseBrowserClient();
  const { setUser, setProfileDetails, clearAuth, setAuthReady, setError } = useAuthStore();
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializedRef = useRef(false);

  // Log d'initialisation une seule fois
  if (!isInitializedRef.current) {
    console.log('[useSupabaseAuth] Hook initialized');
    isInitializedRef.current = true;
  }

  // Fonction pour programmer le refresh automatique du token
  const scheduleTokenRefresh = useCallback((expiresAt: number) => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }
    
    // Programmer le refresh 5 minutes avant l'expiration
    const timeUntilRefresh = (expiresAt * 1000) - Date.now() - (5 * 60 * 1000);
    
    if (timeUntilRefresh > 0) {
      console.log('[useSupabaseAuth] Scheduling token refresh in', Math.round(timeUntilRefresh / 1000), 'seconds');
      refreshTimeoutRef.current = setTimeout(async () => {
        console.log('[useSupabaseAuth] Auto-refreshing token...');
        await refreshSession();
      }, timeUntilRefresh);
    }
  }, []);

  // Fonction pour refresh la session
  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      console.log('[useSupabaseAuth] Refreshing session...');
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('[useSupabaseAuth] Session refresh failed:', error);
        return false;
      }
      
      if (data.session) {
        console.log('[useSupabaseAuth] Session refreshed successfully');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('[useSupabaseAuth] Session refresh error:', error);
      return false;
    }
  }, [supabase]);

  // Fonction améliorée pour charger le profil utilisateur
  const loadUserProfile = useCallback(async (user: User) => {
    console.log('[useSupabaseAuth] Loading profile for user:', user.id);
    
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, email, phone_number, avatar_url, code_ps, pharmacy_name, pharmacy_address, pharmacy_status, current_plan_id, demo_credits_remaining, is_admin, created_at, updated_at')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('[useSupabaseAuth] Profile fetch error:', profileError);
        if (profileError.code === 'PGRST116') {
          // Profil non trouvé, créer un profil par défaut
          console.log('[useSupabaseAuth] Profile not found, creating default profile entry');
          setProfileDetails({
            profileId: user.id,
            email: user.email || '',
            fullName: user.user_metadata?.full_name || '',
            pharmacyStatus: 'not_registered',
            codePs: undefined,
            currentPlanId: 'free_demo',
            demoCreditsRemaining: 10,
            isAdmin: false
          });
        } else {
          setError(new Error(`Erreur lors de la récupération du profil: ${profileError.message}`));
        }
        return;
      }
      
      if (!profileData) {
        setError(new Error('Profil utilisateur/pharmacie introuvable dans la base.'));
        setProfileDetails(null);
        return;
      }

      console.log('[useSupabaseAuth] Profile loaded successfully:', profileData);
      console.log('[useSupabaseAuth] Profile code_ps value:', profileData.code_ps);
      console.log('[useSupabaseAuth] Profile pharmacy_status value:', profileData.pharmacy_status);
      console.log('[useSupabaseAuth] Profile is_admin value:', profileData.is_admin);

      // Mapper les champs snake_case > camelCase pour le store
      const mappedDetails = {
        profileId: profileData.id,
        fullName: profileData.full_name ?? null,
        email: profileData.email ?? null,
        phoneNumber: profileData.phone_number ?? null,
        avatarUrl: profileData.avatar_url ?? null,
        codePs: profileData.code_ps ?? null,
        pharmacyName: profileData.pharmacy_name ?? null,
        pharmacyAddress: profileData.pharmacy_address ?? null,
        pharmacyStatus: profileData.pharmacy_status ?? 'not_registered',
        currentPlanId: profileData.current_plan_id ?? 'free_demo',
        demoCreditsRemaining: profileData.demo_credits_remaining ?? 0,
        isAdmin: profileData.is_admin ?? false,
      } as const;

      setProfileDetails(mappedDetails);
      setError(null);
    } catch (error) {
      console.error('[useSupabaseAuth] Error in profile fetch/set:', error);
      setProfileDetails(null);
      setError(error instanceof Error ? error : new Error(String(error)));
    }
  }, [supabase, setProfileDetails, setError]);

  // Gestionnaire principal des changements d'état d'authentification
  const handleAuthStateChange = useCallback(async (event: AuthChangeEvent, session: Session | null) => {
    console.log('[useSupabaseAuth] Auth state change:', event, 'Session exists:', !!session);
    
    if (event === 'SIGNED_OUT') {
      clearAuth();
      setAuthReady(true);
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
      return;
    }

    const currentUser = session?.user ?? null;
    setUser(currentUser);

    if (currentUser && session) {
      // Programmer le refresh automatique du token
      if (session.expires_at) {
        scheduleTokenRefresh(session.expires_at);
      }

      // Charger le profil utilisateur
      await loadUserProfile(currentUser);
    } else {
      setProfileDetails(null);
      setError(null);
    }

    if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
      setAuthReady(true);
    }
  }, [setUser, setProfileDetails, clearAuth, setAuthReady, setError, scheduleTokenRefresh, loadUserProfile]);

  // Fonction pour obtenir un token valide (avec refresh automatique si nécessaire)
  const getValidSession = useCallback(async () => {
    try {
      console.log('[useSupabaseAuth] Getting session from Supabase...');
      
      // Contournement : utiliser getUser() au lieu de getSession() car getSession() se bloque
      const userPromise = supabase.auth.getUser();
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('User fetch timeout')), 5000); // 5 secondes
      });
      
      const { data: { user }, error } = await Promise.race([userPromise, timeoutPromise]) as any;
      
      if (error) {
        console.error('[useSupabaseAuth] Error getting user:', error);
        return null;
      }

      if (!user) {
        console.log('[useSupabaseAuth] No active user');
        return null;
      }

      console.log('[useSupabaseAuth] User retrieved, creating session object...');

      // Créer un objet session-like avec les informations utilisateur
      // Récupérer le token depuis localStorage/sessionStorage
      const accessToken = localStorage.getItem('sb-ddeibfjxpwnisguehnmo-auth-token') || 
                         sessionStorage.getItem('sb-ddeibfjxpwnisguehnmo-auth-token');
      
      if (!accessToken) {
        console.log('[useSupabaseAuth] No access token found in storage');
        return null;
      }

      // Parser le token pour extraire les informations
      let tokenData;
      try {
        tokenData = JSON.parse(accessToken);
      } catch {
        console.log('[useSupabaseAuth] Invalid token format in storage');
        return null;
      }

      const session = {
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: tokenData.expires_at,
        user: user
      };

      console.log('[useSupabaseAuth] Session created, expires at:', new Date(session.expires_at * 1000));

      // Vérifier si le token expire bientôt (dans les 2 prochaines minutes)
      const expiresAt = session.expires_at || 0;
      const timeUntilExpiry = (expiresAt * 1000) - Date.now();
      
      if (timeUntilExpiry < 2 * 60 * 1000) { // 2 minutes
        console.log('[useSupabaseAuth] Token expires soon, refreshing...');
        const refreshed = await refreshSession();
        
        if (refreshed) {
          // Après refresh, récupérer le nouveau token
          const newAccessToken = localStorage.getItem('sb-ddeibfjxpwnisguehnmo-auth-token') || 
                                sessionStorage.getItem('sb-ddeibfjxpwnisguehnmo-auth-token');
          if (newAccessToken) {
            const newTokenData = JSON.parse(newAccessToken);
            return {
              access_token: newTokenData.access_token,
              refresh_token: newTokenData.refresh_token,
              expires_at: newTokenData.expires_at,
              user: user
            };
          }
        }
      }

      return session;
    } catch (error) {
      console.error('[useSupabaseAuth] Error in getValidSession:', error);
      return null;
    }
  }, [supabase, refreshSession]);

  // Fonction pour faire un appel API avec retry automatique
  const callWithAuth = useCallback(async <T>(
    apiCall: (session: any) => Promise<T>,
    maxRetries: number = 1
  ): Promise<T> => {
    let lastError: any = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[useSupabaseAuth] Attempt ${attempt + 1}/${maxRetries + 1} - Getting valid session...`);
        const session = await getValidSession();
        
        if (!session) {
          throw new Error('No valid session available');
        }

        console.log(`[useSupabaseAuth] Session obtained, calling API...`);
        const result = await apiCall(session);
        console.log(`[useSupabaseAuth] API call successful on attempt ${attempt + 1}`);
        return result;
      } catch (error: any) {
        console.log(`[useSupabaseAuth] Attempt ${attempt + 1} failed:`, error?.message || error);
        lastError = error;
        
        // Si c'est une erreur 401 et qu'on peut encore réessayer
        if (error?.status === 401 && attempt < maxRetries) {
          console.log(`[useSupabaseAuth] 401 error, attempting refresh and retry (${attempt + 1}/${maxRetries})`);
          
          const refreshed = await refreshSession();
          if (!refreshed) {
            console.error(`[useSupabaseAuth] Failed to refresh session`);
            throw new Error('Failed to refresh session after 401 error');
          }
          
          console.log(`[useSupabaseAuth] Session refreshed successfully, retrying...`);
          continue;
        }
        
        // Sinon, propager l'erreur
        console.log(`[useSupabaseAuth] No more retries, throwing error:`, error);
        throw error;
      }
    }

    console.log(`[useSupabaseAuth] All attempts exhausted, throwing last error:`, lastError);
    throw lastError;
  }, [getValidSession, refreshSession]);

  // Fonction pour recharger le profil manuellement
  const reloadProfile = useCallback(async () => {
    console.log('[useSupabaseAuth] Reloading profile...');
    const session = await getValidSession();
    if (session?.user) {
      await loadUserProfile(session.user);
    }
  }, [getValidSession, loadUserProfile]);

  // Fonction pour faire un appel API avec authentification (alias pour compatibilité)
  const makeAuthenticatedRequest = useCallback(async (requestFn: (session: any) => Promise<any>) => {
    return callWithAuth(requestFn);
  }, [callWithAuth]);

  // Nettoyage des timers lors du démontage
  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  return {
    supabase,
    handleAuthStateChange,
    getValidSession,
    makeAuthenticatedRequest,
    reloadProfile,
    callWithAuth,
    refreshSession
  };
} 