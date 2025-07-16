import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User } from '@supabase/supabase-js';

// Définir les statuts possibles pour la pharmacie et les plans
export type PharmacyStatus =
  | 'not_registered'
  | 'pending_pharmacy_details'
  | 'pending'
  | 'active_demo'
  | 'demo_credits_exhausted'
  | 'pending_payment_approval'
  | 'active'
  | 'suspended'
  | 'rejected';

export type PlanId = 'free_demo' | 'pro_monthly' | string; // Permettre d'autres plans futurs

interface AuthState {
  user: User | null;
  sessionToken: string | null; // Pour stocker le JWT si nécessaire séparément
  isLoading: boolean;
  error: Error | null;
  isAuthReady: boolean;

  // Informations spécifiques Chifa.ai liées au profil utilisateur/pharmacie
  profileId: string | null; // UUID de la table profiles
  fullName: string | null;
  email: string | null;
  phoneNumber: string | null;
  avatarUrl: string | null;

  codePs: string | null;
  pharmacyName: string | null;
  pharmacyAddress: string | null;
  pharmacyStatus: PharmacyStatus;

  currentPlanId: PlanId;
  demoCreditsRemaining: number;
  isAdmin: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setSessionToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: Error | null) => void;

  setProfileDetails: (details: {
    profileId?: string;
    fullName?: string;
    email?: string;
    phoneNumber?: string;
    avatarUrl?: string;
    codePs?: string;
    pharmacyName?: string;
    pharmacyAddress?: string;
    pharmacyStatus?: PharmacyStatus;
    currentPlanId?: PlanId;
    demoCreditsRemaining?: number;
    isAdmin?: boolean;
  } | null) => void; // Allow null

  clearAuth: () => void;
  decrementDemoCredits: () => void;
  setAuthReady: (ready: boolean) => void;
}

const initialState = {
  user: null,
  sessionToken: null,
  isLoading: false,
  error: null,
  profileId: null,
  fullName: null,
  email: null,
  phoneNumber: null,
  avatarUrl: null,
  codePs: null,
  pharmacyName: null,
  pharmacyAddress: null,
  pharmacyStatus: 'not_registered' as PharmacyStatus,
  currentPlanId: 'free_demo' as PlanId,
  demoCreditsRemaining: 3, // Valeur par défaut pour le plan démo
  isAuthReady: false,
  isAdmin: false,
};

type State = Omit<AuthState, 'setUser' | 'setSessionToken' | 'setLoading' | 'setError' | 'setProfileDetails' | 'clearAuth' | 'decrementDemoCredits'>;
type Actions = Pick<AuthState, 'setUser' | 'setSessionToken' | 'setLoading' | 'setError' | 'setProfileDetails' | 'clearAuth' | 'decrementDemoCredits'>;

export const useAuthStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      ...initialState,
      setUser: (user) => set({ user, email: user?.email ?? null }),
      setSessionToken: (token) => set({ sessionToken: token }),
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      setProfileDetails: (details) => {
        if (details === null) {
          set({
            profileId: initialState.profileId,
            fullName: initialState.fullName,
            email: initialState.email,
            phoneNumber: initialState.phoneNumber,
            avatarUrl: initialState.avatarUrl,
            codePs: initialState.codePs,
            pharmacyName: initialState.pharmacyName,
            pharmacyAddress: initialState.pharmacyAddress,
            pharmacyStatus: initialState.pharmacyStatus,
            currentPlanId: initialState.currentPlanId,
            demoCreditsRemaining: initialState.demoCreditsRemaining,
            isAdmin: initialState.isAdmin,
          });
        } else {
          set((state) => ({
            profileId: details.profileId ?? state.profileId,
            fullName: details.fullName ?? state.fullName,
            email: details.email !== undefined ? details.email : state.email,
            phoneNumber: details.phoneNumber ?? state.phoneNumber,
            avatarUrl: details.avatarUrl ?? state.avatarUrl,
            codePs: details.codePs ?? state.codePs,
            pharmacyName: details.pharmacyName ?? state.pharmacyName,
            pharmacyAddress: details.pharmacyAddress ?? state.pharmacyAddress,
            pharmacyStatus: details.pharmacyStatus !== undefined ? details.pharmacyStatus : state.pharmacyStatus,
            currentPlanId: details.currentPlanId ?? state.currentPlanId,
            demoCreditsRemaining:
              details.demoCreditsRemaining !== undefined
                ? details.demoCreditsRemaining
                : state.demoCreditsRemaining,
            isAdmin: details.isAdmin !== undefined ? details.isAdmin : state.isAdmin,
          }));
        }
      },
      decrementDemoCredits: () => {
        if (get().currentPlanId === 'free_demo' && get().demoCreditsRemaining > 0) {
          set((state) => ({ demoCreditsRemaining: state.demoCreditsRemaining - 1 }));
          if (get().demoCreditsRemaining <= 0) {
            set({ pharmacyStatus: 'demo_credits_exhausted' });
          }
        }
      },
      setAuthReady: (ready) => set({ isAuthReady: ready }),
      clearAuth: () => set({ ...initialState, isLoading: false }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      // By default, the whole state is persisted.
      // To persist only specific parts, use `partialize`:
      // partialize: (state) => ({ user: state.user, sessionToken: state.sessionToken }),
    }
  )
);
