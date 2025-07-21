/**
 * Authentication Integration Tests
 * Tests for the complete authentication flow including hooks, adapters, and session persistence
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { SessionProvider } from 'next-auth/react';
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { 
  signInWithSupabase, 
  signUpWithSupabase, 
  signOutFromSupabase,
  getSupabaseSession,
  getSupabaseUser 
} from '@/lib/auth/supabase-auth-adapter';

// Mock Supabase client
const mockSupabaseClient = {
  auth: {
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(),
  },
};

// Mock the Supabase client creation
vi.mock('@/lib/supabase/client', () => ({
  createSupabaseBrowserClient: () => mockSupabaseClient,
}));

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: () => mockSupabaseClient,
}));

// Mock Next.js cookies
vi.mock('next/headers', () => ({
  cookies: () => ({}),
}));

describe('Authentication Integration Tests', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();
    
    // Default mock implementations
    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });
    
    mockSupabaseClient.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // Helper pour wrapper le hook dans un SessionProvider
  const withSessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <SessionProvider session={null}>{children}</SessionProvider>
  );

  describe('Authentication Hooks', () => {
    it('should initialize with no user when not authenticated', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper: withSessionProvider });
      expect(result.current.user).toBeNull();
      expect(result.current.isLoading).toBe(true);
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should handle successful login', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: { full_name: 'Test User' },
        created_at: '2024-01-01T00:00:00Z',
      };

      const mockSession = {
        user: mockUser,
        access_token: 'mock-token',
        refresh_token: 'mock-refresh-token',
      };

      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      const { result } = renderHook(() => useAuth(), { wrapper: withSessionProvider });

      await act(async () => {
        await result.current.signIn('test@example.com', 'password123');
      });

      expect(mockSupabaseClient.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        avatar_url: undefined,
        created_at: '2024-01-01T00:00:00Z',
      });
    });

    it('should handle login errors', async () => {
      const mockError = new Error('Invalid credentials');
      
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: mockError,
      });

      const { result } = renderHook(() => useAuth(), { wrapper: withSessionProvider });

      await act(async () => {
        try {
          await result.current.signIn('test@example.com', 'wrongpassword');
        } catch (error) {
          expect(error).toEqual(mockError);
        }
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });

    it('should handle successful registration', async () => {
      const mockUser = {
        id: 'user-456',
        email: 'newuser@example.com',
        user_metadata: { full_name: 'New User' },
        created_at: '2024-01-01T00:00:00Z',
      };

      mockSupabaseClient.auth.signUp.mockResolvedValue({
        data: { user: mockUser, session: null }, // Usually no session immediately after signup
        error: null,
      });

      const { result } = renderHook(() => useAuth(), { wrapper: withSessionProvider });

      await act(async () => {
        await result.current.signUp('newuser@example.com', 'password123', 'New User');
      });

      expect(mockSupabaseClient.auth.signUp).toHaveBeenCalledWith({
        email: 'newuser@example.com',
        password: 'password123',
        options: {
          data: {
            full_name: 'New User',
          },
        },
      });
    });

    it('should handle logout', async () => {
      // First set up authenticated state
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: { full_name: 'Test User' },
        created_at: '2024-01-01T00:00:00Z',
      };

      const mockSession = {
        user: mockUser,
        access_token: 'mock-token',
        refresh_token: 'mock-refresh-token',
      };

      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      mockSupabaseClient.auth.signOut.mockResolvedValue({
        error: null,
      });

      const { result } = renderHook(() => useAuth(), { wrapper: withSessionProvider });

      // Simulate logout
      await act(async () => {
        await result.current.signOut();
      });

      expect(mockSupabaseClient.auth.signOut).toHaveBeenCalled();
    });
  });

  describe('Authentication Adapter Functions', () => {
    it('should get current session', async () => {
      const mockSession = {
        user: { id: 'user-123', email: 'test@example.com' },
        access_token: 'mock-token',
      };

      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      const session = await getSupabaseSession();
      expect(session).toEqual(mockSession);
    });

    it('should get current user', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: { 
          full_name: 'Test User',
          avatar_url: 'https://example.com/avatar.jpg'
        },
        created_at: '2024-01-01T00:00:00Z',
      };

      const mockSession = {
        user: mockUser,
        access_token: 'mock-token',
      };

      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      const user = await getSupabaseUser();
      
      expect(user).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        avatar_url: 'https://example.com/avatar.jpg',
        created_at: '2024-01-01T00:00:00Z',
      });
    });

    it('should return null when no user is authenticated', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const user = await getSupabaseUser();
      expect(user).toBeNull();
    });

    it('should handle sign in with adapter', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      };

      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: { user: mockUser } },
        error: null,
      });

      const user = await signInWithSupabase('test@example.com', 'password123');
      
      expect(mockSupabaseClient.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
      
      expect(user).toEqual(mockUser);
    });

    it('should handle sign up with adapter', async () => {
      const mockUser = {
        id: 'user-456',
        email: 'newuser@example.com',
      };

      mockSupabaseClient.auth.signUp.mockResolvedValue({
        data: { user: mockUser, session: null },
        error: null,
      });

      const user = await signUpWithSupabase('newuser@example.com', 'password123', 'New User');
      
      expect(mockSupabaseClient.auth.signUp).toHaveBeenCalledWith({
        email: 'newuser@example.com',
        password: 'password123',
        options: {
          data: {
            full_name: 'New User',
          },
        },
      });
      
      expect(user).toEqual(mockUser);
    });

    it('should handle sign out with adapter', async () => {
      mockSupabaseClient.auth.signOut.mockResolvedValue({
        error: null,
      });

      const result = await signOutFromSupabase();
      
      expect(mockSupabaseClient.auth.signOut).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should throw error on failed sign in', async () => {
      const mockError = { message: 'Invalid credentials' };
      
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: mockError,
      });

      await expect(signInWithSupabase('test@example.com', 'wrongpassword'))
        .rejects.toThrow('Invalid credentials');
    });

    it('should throw error on failed sign up', async () => {
      const mockError = { message: 'Email already exists' };
      
      mockSupabaseClient.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: mockError,
      });

      await expect(signUpWithSupabase('existing@example.com', 'password123'))
        .rejects.toThrow('Email already exists');
    });

    it('should throw error on failed sign out', async () => {
      const mockError = { message: 'Network error' };
      
      mockSupabaseClient.auth.signOut.mockResolvedValue({
        error: mockError,
      });

      await expect(signOutFromSupabase())
        .rejects.toThrow('Network error');
    });
  });

  describe('Session Persistence', () => {
    it('should persist session across page reloads', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: { full_name: 'Test User' },
        created_at: '2024-01-01T00:00:00Z',
      };

      const mockSession = {
        user: mockUser,
        access_token: 'mock-token',
        refresh_token: 'mock-refresh-token',
      };

      // Simulate existing session on page load
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      const { result } = renderHook(() => useAuth(), { wrapper: withSessionProvider });

      // Wait for the hook to initialize
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        avatar_url: undefined,
        created_at: '2024-01-01T00:00:00Z',
      });
    });

    it('should handle session expiration', async () => {
      // First, simulate valid session
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      };

      const mockSession = {
        user: mockUser,
        access_token: 'mock-token',
      };

      mockSupabaseClient.auth.getSession.mockResolvedValueOnce({
        data: { session: mockSession },
        error: null,
      });

      const { result } = renderHook(() => useAuth(), { wrapper: withSessionProvider });

      // Then simulate session expiration
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'Session expired' },
      });

      // Trigger auth state change
      await act(async () => {
        const authStateChangeCallback = mockSupabaseClient.auth.onAuthStateChange.mock.calls[0][0];
        authStateChangeCallback('SIGNED_OUT', null);
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      mockSupabaseClient.auth.getSession.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useAuth(), { wrapper: withSessionProvider });

      // Should not crash and should remain in loading state or show error
      expect(result.current.user).toBeNull();
    });

    it('should handle malformed session data', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: { user: null } }, // Malformed session
        error: null,
      });

      const user = await getSupabaseUser();
      expect(user).toBeNull();
    });
  });
});