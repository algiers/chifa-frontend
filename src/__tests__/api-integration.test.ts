/**
 * API Integration Tests
 * Tests for the chat API integration with Chifa.ai backend
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/chat/chifa/route';

// Mock the auth functions
const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  name: 'Test User',
};

vi.mock('@/lib/auth/supabase-auth-adapter', () => ({
  getSupabaseUser: vi.fn(),
  createSupabaseServerClient: vi.fn(),
}));

// Mock the credits manager
vi.mock('@/lib/utils/credits-manager', () => ({
  checkCreditsAvailable: vi.fn(),
  consumeCredits: vi.fn(),
  calculateChatCredits: vi.fn(),
}));

// Mock the error handling
vi.mock('@/lib/utils/error-handling', () => ({
  logError: vi.fn(),
}));

// Mock Next.js cookies
vi.mock('next/headers', () => ({
  cookies: () => ({}),
}));

// Mock UUID
vi.mock('uuid', () => ({
  v4: () => 'mock-uuid-123',
}));

// Mock Supabase client
const mockSupabaseClient = {
  from: vi.fn(() => ({
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(),
      })),
    })),
    update: vi.fn(() => ({
      eq: vi.fn(),
    })),
  })),
};

describe('Chat API Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mocks
    const { getSupabaseUser, createSupabaseServerClient } = require('@/lib/auth/supabase-auth-adapter');
    const { checkCreditsAvailable, consumeCredits, calculateChatCredits } = require('@/lib/utils/credits-manager');
    
    getSupabaseUser.mockResolvedValue(mockUser);
    createSupabaseServerClient.mockReturnValue(mockSupabaseClient);
    checkCreditsAvailable.mockResolvedValue({ available: true, credits: { remaining_credits: 10 } });
    consumeCredits.mockResolvedValue({ success: true, remainingCredits: 9 });
    calculateChatCredits.mockReturnValue(1);
    
    // Mock successful database operations
    mockSupabaseClient.from.mockReturnValue({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: { id: 'conv-123' }, error: null }),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ error: null }),
      })),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Authentication Tests', () => {
    it('should return 401 when user is not authenticated', async () => {
      const { getSupabaseUser } = require('@/lib/auth/supabase-auth-adapter');
      getSupabaseUser.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/chat/chifa', {
        method: 'POST',
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Hello' }],
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should proceed when user is authenticated', async () => {
      // Mock fetch to simulate Chifa.ai API
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: new ReadableStream({
          start(controller) {
            controller.enqueue(new TextEncoder().encode('Hello response'));
            controller.close();
          },
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/chat/chifa', {
        method: 'POST',
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Hello' }],
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('X-Conversation-Id')).toBeTruthy();
    });
  });

  describe('Message Validation Tests', () => {
    it('should return 400 for empty messages array', async () => {
      const request = new NextRequest('http://localhost:3000/api/chat/chifa', {
        method: 'POST',
        body: JSON.stringify({
          messages: [],
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid messages format');
    });

    it('should return 400 for invalid messages format', async () => {
      const request = new NextRequest('http://localhost:3000/api/chat/chifa', {
        method: 'POST',
        body: JSON.stringify({
          messages: 'invalid',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid messages format');
    });

    it('should return 400 when no user message is found', async () => {
      const request = new NextRequest('http://localhost:3000/api/chat/chifa', {
        method: 'POST',
        body: JSON.stringify({
          messages: [{ role: 'assistant', content: 'Hello' }],
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('No user message found');
    });

    it('should accept valid messages', async () => {
      // Mock fetch to simulate Chifa.ai API
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: new ReadableStream({
          start(controller) {
            controller.enqueue(new TextEncoder().encode('Response'));
            controller.close();
          },
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/chat/chifa', {
        method: 'POST',
        body: JSON.stringify({
          messages: [
            { role: 'user', content: 'Hello' },
            { role: 'assistant', content: 'Hi there!' },
            { role: 'user', content: 'How are you?' },
          ],
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
    });
  });

  describe('Credits System Tests', () => {
    it('should return 402 when user has insufficient credits', async () => {
      const { checkCreditsAvailable } = require('@/lib/utils/credits-manager');
      checkCreditsAvailable.mockResolvedValue({
        available: false,
        credits: { remaining_credits: 0 },
        error: { message: 'Insufficient credits', code: 'CREDITS_002' },
      });

      const request = new NextRequest('http://localhost:3000/api/chat/chifa', {
        method: 'POST',
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Hello' }],
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(402);
      expect(data.type).toBe('CREDITS_ERROR');
      expect(data.code).toBe('CREDITS_002');
    });

    it('should calculate credits correctly for different message types', async () => {
      const { calculateChatCredits } = require('@/lib/utils/credits-manager');
      
      // Mock different credit calculations
      calculateChatCredits.mockReturnValueOnce(1); // Simple message
      calculateChatCredits.mockReturnValueOnce(3); // SQL message
      calculateChatCredits.mockReturnValueOnce(2); // Long message

      // Test simple message
      let request = new NextRequest('http://localhost:3000/api/chat/chifa', {
        method: 'POST',
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Hello' }],
        }),
      });

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: new ReadableStream({
          start(controller) {
            controller.enqueue(new TextEncoder().encode('Simple response'));
            controller.close();
          },
        }),
      });

      await POST(request);
      expect(calculateChatCredits).toHaveBeenCalledWith('Hello', false, true);
    });

    it('should consume credits after successful operation', async () => {
      const { consumeCredits } = require('@/lib/utils/credits-manager');

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: new ReadableStream({
          start(controller) {
            controller.enqueue(new TextEncoder().encode('Response with ```sql SELECT * FROM users```'));
            controller.close();
          },
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/chat/chifa', {
        method: 'POST',
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Show me users' }],
        }),
      });

      await POST(request);

      // Wait a bit for the async processing to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(consumeCredits).toHaveBeenCalled();
    });
  });

  describe('Chifa.ai Backend Integration Tests', () => {
    it('should handle successful API response', async () => {
      const mockResponse = 'This is a response from Chifa.ai';
      
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: new ReadableStream({
          start(controller) {
            controller.enqueue(new TextEncoder().encode(mockResponse));
            controller.close();
          },
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/chat/chifa', {
        method: 'POST',
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Hello' }],
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(global.fetch).toHaveBeenCalledWith(
        process.env.CHIFA_LANGGRAPH_AGENT_URL,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.CHIFA_AGENT_COMM_JWT_SECRET}`,
          }),
          body: expect.stringContaining('Hello'),
        })
      );
    });

    it('should handle API errors gracefully', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Internal server error'),
      });

      const request = new NextRequest('http://localhost:3000/api/chat/chifa', {
        method: 'POST',
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Hello' }],
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to connect to Chifa.ai service');
    });

    it('should handle network errors', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const request = new NextRequest('http://localhost:3000/api/chat/chifa', {
        method: 'POST',
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Hello' }],
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to connect to Chifa.ai service');
    });

    it('should handle missing API URL configuration', async () => {
      const originalUrl = process.env.CHIFA_LANGGRAPH_AGENT_URL;
      delete process.env.CHIFA_LANGGRAPH_AGENT_URL;

      const request = new NextRequest('http://localhost:3000/api/chat/chifa', {
        method: 'POST',
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Hello' }],
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to connect to Chifa.ai service');

      // Restore the original URL
      if (originalUrl) {
        process.env.CHIFA_LANGGRAPH_AGENT_URL = originalUrl;
      }
    });
  });

  describe('Streaming Tests', () => {
    it('should handle streaming response correctly', async () => {
      const chunks = ['Hello ', 'world', '!'];
      let chunkIndex = 0;

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: new ReadableStream({
          start(controller) {
            const sendChunk = () => {
              if (chunkIndex < chunks.length) {
                controller.enqueue(new TextEncoder().encode(chunks[chunkIndex]));
                chunkIndex++;
                setTimeout(sendChunk, 10);
              } else {
                controller.close();
              }
            };
            sendChunk();
          },
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/chat/chifa', {
        method: 'POST',
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Hello' }],
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('text/plain; charset=utf-8');
      expect(response.headers.get('X-Conversation-Id')).toBeTruthy();
    });

    it('should handle empty stream body', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: null,
      });

      const request = new NextRequest('http://localhost:3000/api/chat/chifa', {
        method: 'POST',
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Hello' }],
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to connect to Chifa.ai service');
    });
  });

  describe('Database Integration Tests', () => {
    it('should create new conversation when none provided', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: new ReadableStream({
          start(controller) {
            controller.enqueue(new TextEncoder().encode('Response'));
            controller.close();
          },
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/chat/chifa', {
        method: 'POST',
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Hello' }],
        }),
      });

      await POST(request);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('chat_conversations');
    });

    it('should use existing conversation when provided', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: new ReadableStream({
          start(controller) {
            controller.enqueue(new TextEncoder().encode('Response'));
            controller.close();
          },
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/chat/chifa', {
        method: 'POST',
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Hello' }],
          conversationId: 'existing-conv-123',
        }),
      });

      await POST(request);

      // Should still store the message
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('chat_messages');
    });

    it('should handle database errors gracefully', async () => {
      // Mock database error
      mockSupabaseClient.from.mockReturnValue({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ 
              data: null, 
              error: { message: 'Database error' } 
            })),
          })),
        })),
      });

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: new ReadableStream({
          start(controller) {
            controller.enqueue(new TextEncoder().encode('Response'));
            controller.close();
          },
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/chat/chifa', {
        method: 'POST',
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Hello' }],
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to create conversation');
    });
  });

  describe('Error Handling Tests', () => {
    it('should handle malformed JSON request', async () => {
      const request = new NextRequest('http://localhost:3000/api/chat/chifa', {
        method: 'POST',
        body: 'invalid json',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });

    it('should handle unexpected errors', async () => {
      const { getSupabaseUser } = require('@/lib/auth/supabase-auth-adapter');
      getSupabaseUser.mockRejectedValue(new Error('Unexpected error'));

      const request = new NextRequest('http://localhost:3000/api/chat/chifa', {
        method: 'POST',
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Hello' }],
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });

  describe('SQL Detection Tests', () => {
    it('should detect SQL in response and adjust credits', async () => {
      const sqlResponse = 'Here is your query: ```sql\\nSELECT * FROM users WHERE active = true\\n```';
      
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: new ReadableStream({
          start(controller) {
            controller.enqueue(new TextEncoder().encode(sqlResponse));
            controller.close();
          },
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/chat/chifa', {
        method: 'POST',
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Show me active users' }],
        }),
      });

      await POST(request);

      // Wait for async processing
      await new Promise(resolve => setTimeout(resolve, 100));

      const { consumeCredits } = require('@/lib/utils/credits-manager');
      expect(consumeCredits).toHaveBeenCalledWith(
        mockUser.id,
        expect.any(Number),
        'sql_query',
        expect.objectContaining({
          model_used: 'chifa-ai',
          streaming: true,
        }),
        expect.any(String),
        expect.any(String)
      );
    });

    it('should handle non-SQL responses', async () => {
      const normalResponse = 'This is a normal response without SQL.';
      
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: new ReadableStream({
          start(controller) {
            controller.enqueue(new TextEncoder().encode(normalResponse));
            controller.close();
          },
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/chat/chifa', {
        method: 'POST',
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Hello' }],
        }),
      });

      await POST(request);

      // Wait for async processing
      await new Promise(resolve => setTimeout(resolve, 100));

      const { consumeCredits } = require('@/lib/utils/credits-manager');
      expect(consumeCredits).toHaveBeenCalledWith(
        mockUser.id,
        expect.any(Number),
        'chat',
        expect.objectContaining({
          model_used: 'chifa-ai',
          streaming: true,
        }),
        expect.any(String),
        expect.any(String)
      );
    });
  });
});