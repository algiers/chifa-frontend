import NextAuth, { type DefaultSession } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { authConfig } from './auth.config';
import type { DefaultJWT } from 'next-auth/jwt';

// Extend NextAuth types for Chifa.ai
declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id?: string;
      email?: string | null;
      name?: string | null;
      // Chifa.ai specific fields
      codePs?: string;
      pharmacyStatus?: string;
      isAdmin?: boolean;
      demoCreditsRemaining?: number;
    } & DefaultSession['user'];
  }

  interface User {
    id?: string;
    email?: string | null;
    name?: string | null;
    // Chifa.ai specific fields
    codePs?: string;
    pharmacyStatus?: string;
    isAdmin?: boolean;
    demoCreditsRemaining?: number;
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id?: string;
    email?: string | null;
    name?: string | null;
    // Chifa.ai specific fields
    codePs?: string;
    pharmacyStatus?: string;
    isAdmin?: boolean;
    demoCreditsRemaining?: number;
  }
}

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: 'supabase',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Use Supabase for authentication
          const supabase = createSupabaseBrowserClient();

          const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: credentials.email as string,
            password: credentials.password as string,
          });

          if (authError || !authData.user) {
            console.error('Supabase auth error:', authError);
            return null;
          }

          // Get user profile from Chifa.ai profiles table
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('id, full_name, email, code_ps, pharmacy_status, is_admin, demo_credits_remaining')
            .eq('id', authData.user.id)
            .single();

          if (profileError) {
            console.error('Profile fetch error:', profileError);
            // Return basic user info even if profile fetch fails
            return {
              id: authData.user.id,
              email: authData.user.email!,
              name: authData.user.user_metadata?.full_name || null,
            };
          }

          // Return user with Chifa.ai profile data
          return {
            id: authData.user.id,
            email: authData.user.email!,
            name: profileData?.full_name || authData.user.user_metadata?.full_name || null,
            codePs: profileData?.code_ps || undefined,
            pharmacyStatus: profileData?.pharmacy_status || 'not_registered',
            isAdmin: profileData?.is_admin || false,
            demoCreditsRemaining: profileData?.demo_credits_remaining || 0,
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Persist user data in JWT token
      if (user) {
        token.id = user.id as string;
        token.email = user.email as string;
        token.name = user.name;
        token.codePs = user.codePs;
        token.pharmacyStatus = user.pharmacyStatus;
        token.isAdmin = user.isAdmin;
        token.demoCreditsRemaining = user.demoCreditsRemaining;
      }
      return token;
    },
    async session({ session, token }) {
      // Send properties to the client
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name;
        session.user.codePs = token.codePs;
        session.user.pharmacyStatus = token.pharmacyStatus;
        session.user.isAdmin = token.isAdmin;
        session.user.demoCreditsRemaining = token.demoCreditsRemaining;
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
  },
});