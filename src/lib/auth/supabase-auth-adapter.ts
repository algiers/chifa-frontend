import { createSupabaseBrowserClient } from '@/lib/supabase/client';

// Client-side adapter
export const createSupabaseClientClient = createSupabaseBrowserClient;

/**
 * Supabase Auth Adapter for NextAuth.js
 * This adapter bridges Supabase Auth with NextAuth.js for the Vercel AI Chatbot integration
 */

export type SupabaseUser = {
  id: string;
  email?: string;
  name?: string;
  avatar_url?: string;
  created_at?: string;
};

export async function getSupabaseSession() {
  const supabase = createSupabaseBrowserClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export async function getSupabaseUser(): Promise<SupabaseUser | null> {
  const session = await getSupabaseSession();
  
  if (!session?.user) {
    return null;
  }
  
  const user: SupabaseUser = {
    id: session.user.id,
    email: session.user.email,
    name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
    avatar_url: session.user.user_metadata?.avatar_url,
    created_at: session.user.created_at,
  };
  
  return user;
}

export async function signInWithSupabase(email: string, password: string) {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) {
    throw new Error(error.message);
  }
  
  return data.user;
}


export async function signUpWithSupabase(email: string, password: string, name?: string) {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name,
      },
    },
  });
  
  if (error) {
    throw new Error(error.message);
  }
  
  return data.user;
}

export async function signOutFromSupabase() {
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    throw new Error(error.message);
  }
  
  return true;
}

export async function getSupabaseUserById(userId: string) {
  const supabase = createSupabaseBrowserClient();
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
  
  return data;
}