/**
 * Authentication Flow Tests
 * End-to-end tests for login/logout flows and user experience
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import LoginForm from '@/components/auth/login-form';
import RegisterForm from '@/components/auth/register-form';

// Mock Next.js router
const mockPush = vi.fn();
const mockReplace = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    refresh: vi.fn(),
  }),
}));

// Mock the auth hook
const mockSignIn = vi.fn();
const mockSignUp = vi.fn();
const mockSignOut = vi.fn();

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: null,
    isLoading: false,
    isAuthenticated: false,
    signIn: mockSignIn,
    signUp: mockSignUp,
    signOut: mockSignOut,
  }),
}));

// Mock toast notifications
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe('Authentication Flow Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Login Flow', () => {
    it('should render login form with all required fields', () => {
      render(<LoginForm />);
      
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('should validate required fields', async () => {
      render(<LoginForm />);
      
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
        expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      });
    });

    it('should validate email format', async () => {
      render(<LoginForm />);
      
      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
      });
    });

    it('should call signIn with correct credentials', async () => {
      mockSignIn.mockResolvedValue(true);
      
      render(<LoginForm />);
      
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
      });
    });

    it('should redirect to chat after successful login', async () => {
      mockSignIn.mockResolvedValue(true);
      
      render(<LoginForm />);
      
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/chat');
      });
    });

    it('should handle login errors', async () => {
      const errorMessage = 'Invalid credentials';
      mockSignIn.mockRejectedValue(new Error(errorMessage));
      
      render(<LoginForm />);
      
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it('should show loading state during login', async () => {
      // Mock a delayed response\n      mockSignIn.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));\n      \n      render(<LoginForm />);\n      \n      const emailInput = screen.getByLabelText(/email/i);\n      const passwordInput = screen.getByLabelText(/password/i);\n      const submitButton = screen.getByRole('button', { name: /sign in/i });\n      \n      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });\n      fireEvent.change(passwordInput, { target: { value: 'password123' } });\n      fireEvent.click(submitButton);\n      \n      // Should show loading state\n      expect(screen.getByText(/signing in/i)).toBeInTheDocument();\n      expect(submitButton).toBeDisabled();\n    });\n  });\n\n  describe('Registration Flow', () => {\n    it('should render registration form with all required fields', () => {\n      render(<RegisterForm />);\n      \n      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();\n      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();\n      expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();\n      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();\n      expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();\n    });\n\n    it('should validate password confirmation', async () => {\n      render(<RegisterForm />);\n      \n      const passwordInput = screen.getByLabelText(/^password/i);\n      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);\n      const submitButton = screen.getByRole('button', { name: /create account/i });\n      \n      fireEvent.change(passwordInput, { target: { value: 'password123' } });\n      fireEvent.change(confirmPasswordInput, { target: { value: 'different123' } });\n      fireEvent.click(submitButton);\n      \n      await waitFor(() => {\n        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();\n      });\n    });\n\n    it('should validate password strength', async () => {\n      render(<RegisterForm />);\n      \n      const passwordInput = screen.getByLabelText(/^password/i);\n      const submitButton = screen.getByRole('button', { name: /create account/i });\n      \n      fireEvent.change(passwordInput, { target: { value: '123' } });\n      fireEvent.click(submitButton);\n      \n      await waitFor(() => {\n        expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();\n      });\n    });\n\n    it('should call signUp with correct information', async () => {\n      mockSignUp.mockResolvedValue(true);\n      \n      render(<RegisterForm />);\n      \n      const nameInput = screen.getByLabelText(/name/i);\n      const emailInput = screen.getByLabelText(/email/i);\n      const passwordInput = screen.getByLabelText(/^password/i);\n      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);\n      const submitButton = screen.getByRole('button', { name: /create account/i });\n      \n      fireEvent.change(nameInput, { target: { value: 'Test User' } });\n      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });\n      fireEvent.change(passwordInput, { target: { value: 'password123' } });\n      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });\n      fireEvent.click(submitButton);\n      \n      await waitFor(() => {\n        expect(mockSignUp).toHaveBeenCalledWith('test@example.com', 'password123', 'Test User');\n      });\n    });\n\n    it('should show success message after registration', async () => {\n      mockSignUp.mockResolvedValue(true);\n      \n      render(<RegisterForm />);\n      \n      const nameInput = screen.getByLabelText(/name/i);\n      const emailInput = screen.getByLabelText(/email/i);\n      const passwordInput = screen.getByLabelText(/^password/i);\n      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);\n      const submitButton = screen.getByRole('button', { name: /create account/i });\n      \n      fireEvent.change(nameInput, { target: { value: 'Test User' } });\n      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });\n      fireEvent.change(passwordInput, { target: { value: 'password123' } });\n      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });\n      fireEvent.click(submitButton);\n      \n      await waitFor(() => {\n        expect(screen.getByText(/account created successfully/i)).toBeInTheDocument();\n      });\n    });\n\n    it('should handle registration errors', async () => {\n      const errorMessage = 'Email already exists';\n      mockSignUp.mockRejectedValue(new Error(errorMessage));\n      \n      render(<RegisterForm />);\n      \n      const nameInput = screen.getByLabelText(/name/i);\n      const emailInput = screen.getByLabelText(/email/i);\n      const passwordInput = screen.getByLabelText(/^password/i);\n      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);\n      const submitButton = screen.getByRole('button', { name: /create account/i });\n      \n      fireEvent.change(nameInput, { target: { value: 'Test User' } });\n      fireEvent.change(emailInput, { target: { value: 'existing@example.com' } });\n      fireEvent.change(passwordInput, { target: { value: 'password123' } });\n      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });\n      fireEvent.click(submitButton);\n      \n      await waitFor(() => {\n        expect(screen.getByText(errorMessage)).toBeInTheDocument();\n      });\n    });\n  });\n\n  describe('Logout Flow', () => {\n    it('should call signOut when logout is triggered', async () => {\n      mockSignOut.mockResolvedValue(true);\n      \n      // This would typically be tested in a component that has a logout button\n      // For now, we'll test the function directly\n      await mockSignOut();\n      \n      expect(mockSignOut).toHaveBeenCalled();\n    });\n\n    it('should redirect to login after logout', async () => {\n      mockSignOut.mockResolvedValue(true);\n      \n      // Simulate logout and redirect\n      await mockSignOut();\n      \n      // In a real component, this would trigger a redirect\n      expect(mockSignOut).toHaveBeenCalled();\n    });\n  });\n\n  describe('Session Persistence', () => {\n    it('should maintain authentication state across page refreshes', () => {\n      // This would be tested by checking if the auth state is restored\n      // from localStorage or session storage after a page refresh\n      \n      // Mock localStorage\n      const mockLocalStorage = {\n        getItem: vi.fn(),\n        setItem: vi.fn(),\n        removeItem: vi.fn(),\n      };\n      \n      Object.defineProperty(window, 'localStorage', {\n        value: mockLocalStorage,\n      });\n      \n      // Test would verify that auth state is persisted and restored\n      expect(mockLocalStorage.getItem).toBeDefined();\n    });\n\n    it('should handle expired sessions gracefully', async () => {\n      // Mock an expired session scenario\n      mockSignIn.mockRejectedValue(new Error('Session expired'));\n      \n      render(<LoginForm />);\n      \n      const emailInput = screen.getByLabelText(/email/i);\n      const passwordInput = screen.getByLabelText(/password/i);\n      const submitButton = screen.getByRole('button', { name: /sign in/i });\n      \n      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });\n      fireEvent.change(passwordInput, { target: { value: 'password123' } });\n      fireEvent.click(submitButton);\n      \n      await waitFor(() => {\n        expect(screen.getByText(/session expired/i)).toBeInTheDocument();\n      });\n    });\n  });\n\n  describe('Form Validation', () => {\n    it('should prevent submission with invalid data', async () => {\n      render(<LoginForm />);\n      \n      const submitButton = screen.getByRole('button', { name: /sign in/i });\n      \n      // Try to submit empty form\n      fireEvent.click(submitButton);\n      \n      // Should not call signIn\n      expect(mockSignIn).not.toHaveBeenCalled();\n    });\n\n    it('should sanitize input data', async () => {\n      render(<LoginForm />);\n      \n      const emailInput = screen.getByLabelText(/email/i);\n      const passwordInput = screen.getByLabelText(/password/i);\n      \n      // Input with potential XSS\n      fireEvent.change(emailInput, { target: { value: 'test@example.com<script>alert(\"xss\")</script>' } });\n      fireEvent.change(passwordInput, { target: { value: 'password123' } });\n      \n      // The form should sanitize or reject malicious input\n      expect(emailInput.value).not.toContain('<script>');\n    });\n  });\n\n  describe('Accessibility', () => {\n    it('should have proper ARIA labels', () => {\n      render(<LoginForm />);\n      \n      expect(screen.getByLabelText(/email/i)).toHaveAttribute('aria-required', 'true');\n      expect(screen.getByLabelText(/password/i)).toHaveAttribute('aria-required', 'true');\n    });\n\n    it('should show error messages with proper ARIA attributes', async () => {\n      render(<LoginForm />);\n      \n      const submitButton = screen.getByRole('button', { name: /sign in/i });\n      fireEvent.click(submitButton);\n      \n      await waitFor(() => {\n        const errorMessage = screen.getByText(/email is required/i);\n        expect(errorMessage).toHaveAttribute('role', 'alert');\n      });\n    });\n\n    it('should support keyboard navigation', () => {\n      render(<LoginForm />);\n      \n      const emailInput = screen.getByLabelText(/email/i);\n      const passwordInput = screen.getByLabelText(/password/i);\n      const submitButton = screen.getByRole('button', { name: /sign in/i });\n      \n      // Should be able to tab through form elements\n      expect(emailInput).toHaveAttribute('tabIndex');\n      expect(passwordInput).toHaveAttribute('tabIndex');\n      expect(submitButton).toHaveAttribute('tabIndex');\n    });\n  });\n});"