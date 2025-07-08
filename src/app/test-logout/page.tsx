'use client';

import { createBrowserClient } from '@supabase/ssr';
import { useRouter }
from 'next/navigation';
import { useState } from 'react';

// Ensure these are defined in your .env.local and prefixed with NEXT_PUBLIC_
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export default function TestLogoutPage() {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleTestLogout = async () => {
    setIsLoading(true);
    setMessage('');
    console.log('[TestLogoutPage] Attempting logout...');

    if (!supabaseUrl || !supabaseAnonKey) {
      const errorMsg = '[TestLogoutPage] Supabase URL or Anon Key is missing. Check .env.local and ensure they are prefixed with NEXT_PUBLIC_.';
      console.error(errorMsg);
      setMessage(errorMsg);
      setIsLoading(false);
      return;
    }

    console.log('[TestLogoutPage] Using Supabase URL:', supabaseUrl);
    console.log('[TestLogoutPage] Using Supabase Anon Key:', supabaseAnonKey ? 'Exists' : 'MISSING');

    const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
    console.log('[TestLogoutPage] Supabase client created:', supabase);

    try {
      console.log('[TestLogoutPage] Calling supabase.auth.signOut()...');
      const { error } = await supabase.auth.signOut();
      console.log('[TestLogoutPage] supabase.auth.signOut() call completed.');

      if (error) {
        console.error('[TestLogoutPage] Logout error:', error);
        setMessage(`Logout failed: ${error.message}`);
      } else {
        console.log('[TestLogoutPage] Logout successful. Clearing local state and redirecting...');
        setMessage('Logout successful! Redirecting to /login...');
        // Add any local state clearing if necessary, e.g., store.clearUser();
        router.push('/login');
        router.refresh(); // Force a refresh to ensure server components re-evaluate
      }
    } catch (e: any) {
      console.error('[TestLogoutPage] Exception during logout:', e);
      setMessage(`Exception during logout: ${e.message}`);
    } finally {
      setIsLoading(false);
      console.log('[TestLogoutPage] Logout process finished.');
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Test Logout Page</h1>
      <p>This page attempts a Supabase logout in isolation.</p>
      <button
        onClick={handleTestLogout}
        disabled={isLoading}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          backgroundColor: isLoading ? '#ccc' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
        }}
      >
        {isLoading ? 'Logging out...' : 'Attempt Logout'}
      </button>
      {message && (
        <div style={{ marginTop: '20px', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}>
          <p>{message}</p>
        </div>
      )}
      <div style={{ marginTop: '20px' }}>
        <h2>Instructions:</h2>
        <ol>
          <li>Open your browser's developer console (Network and Console tabs).</li>
          <li>Click the "Attempt Logout" button.</li>
          <li>Observe the console for logs from [TestLogoutPage].</li>
          <li>Check the Network tab to see if a request to `/auth/v1/logout` is made.</li>
          <li>Report back the console output and any network activity or errors.</li>
        </ol>
      </div>
    </div>
  );
}
