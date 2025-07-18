/**
 * Streaming Integration Tests
 * Tests for streaming functionality and error handling
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  StreamHealthMonitor, 
  CreditsAwareStream,
  StreamingErrors,
  handleStreamingError,
  withStreamingErrorHandling,
  retryStreamingOperation,
} from '@/lib/utils/streaming-error-handler';

describe('Streaming Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('StreamHealthMonitor', () => {
    it('should initialize with correct default values', () => {
      const monitor = new StreamHealthMonitor();
      const stats = monitor.getStats();
      
      expect(stats.chunkCount).toBe(0);
      expect(stats.totalBytes).toBe(0);
      expect(stats.avgChunkSize).toBe(0);
      expect(stats.chunksPerSecond).toBe(0);
    });

    it('should record chunks correctly', () => {
      const monitor = new StreamHealthMonitor();
      
      monitor.recordChunk(100);
      monitor.recordChunk(200);
      monitor.recordChunk(150);
      
      const stats = monitor.getStats();
      
      expect(stats.chunkCount).toBe(3);
      expect(stats.totalBytes).toBe(450);
      expect(stats.avgChunkSize).toBe(150);
    });

    it('should detect healthy streams', () => {
      const monitor = new StreamHealthMonitor(5000, 30000); // 5s silence, 30s total
      
      monitor.recordChunk(100);
      
      const health = monitor.checkHealth();
      expect(health.healthy).toBe(true);
      expect(health.error).toBeUndefined();
    });

    it('should detect silence timeout', async () => {
      const monitor = new StreamHealthMonitor(100, 30000); // 100ms silence timeout
      
      monitor.recordChunk(100);
      
      // Wait for silence timeout
      await new Promise(resolve => setTimeout(resolve, 150));
      
      const health = monitor.checkHealth();
      expect(health.healthy).toBe(false);
      expect(health.error?.code).toBe('STREAM_002');
    });

    it('should detect total duration timeout', async () => {
      const monitor = new StreamHealthMonitor(5000, 100); // 100ms total timeout
      
      // Wait for total timeout
      await new Promise(resolve => setTimeout(resolve, 150));
      
      const health = monitor.checkHealth();
      expect(health.healthy).toBe(false);
      expect(health.error?.code).toBe('STREAM_002');
    });

    it('should calculate statistics correctly', () => {
      const monitor = new StreamHealthMonitor();
      
      const startTime = Date.now();
      monitor.recordChunk(100);
      monitor.recordChunk(200);
      
      const stats = monitor.getStats();
      
      expect(stats.chunkCount).toBe(2);
      expect(stats.totalBytes).toBe(300);
      expect(stats.avgChunkSize).toBe(150);
      expect(stats.duration).toBeGreaterThan(0);
      expect(stats.chunksPerSecond).toBeGreaterThan(0);
    });
  });

  describe('CreditsAwareStream', () => {
    it('should initialize with correct values', () => {
      const stream = new CreditsAwareStream('user-123', 5, 10);
      
      expect(stream.canContinueStreaming()).toBe(true);
      expect(stream.getRemainingCredits()).toBe(10);
      expect(stream.isApproachingLimit()).toBe(false);
    });

    it('should track credits consumption', () => {
      const stream = new CreditsAwareStream('user-123', 5, 10);
      
      stream.recordCreditsUsed(3);
      expect(stream.getRemainingCredits()).toBe(7);
      expect(stream.canContinueStreaming()).toBe(true);
      
      stream.recordCreditsUsed(5);
      expect(stream.getRemainingCredits()).toBe(2);
      expect(stream.canContinueStreaming()).toBe(true);
      
      stream.recordCreditsUsed(3);
      expect(stream.getRemainingCredits()).toBe(0);
      expect(stream.canContinueStreaming()).toBe(false);
    });

    it('should detect approaching limit', () => {
      const stream = new CreditsAwareStream('user-123', 5, 10);
      
      stream.recordCreditsUsed(7); // 70% used
      expect(stream.isApproachingLimit(0.6)).toBe(true);
      expect(stream.isApproachingLimit(0.8)).toBe(false);
      
      stream.recordCreditsUsed(1); // 80% used
      expect(stream.isApproachingLimit(0.8)).toBe(true);
    });
  });

  describe('Streaming Error Handling', () => {
    it('should create appropriate error responses', () => {
      const timeoutError = StreamingErrors.STREAM_TIMEOUT(5000);
      
      expect(timeoutError.type).toBe('TIMEOUT');
      expect(timeoutError.code).toBe('STREAM_002');
      expect(timeoutError.retryable).toBe(true);
      expect(timeoutError.userMessage).toContain('trop de temps');
    });

    it('should handle different error types', () => {
      const networkError = new Error('Network error');
      const response = handleStreamingError(networkError, 'Test Context');
      
      expect(response.status).toBe(503);
    });

    it('should handle timeout errors', () => {
      const timeoutError = new Error('timeout');
      const response = handleStreamingError(timeoutError, 'Test Context');
      
      expect(response.status).toBe(408);
    });

    it('should handle credits errors', () => {
      const creditsError = new Error('credits exhausted');
      const response = handleStreamingError(creditsError, 'Test Context');
      
      expect(response.status).toBe(402);
    });
  });

  describe('Streaming Operations with Error Handling', () => {
    it('should execute successful operations', async () => {
      const successfulOperation = vi.fn().mockResolvedValue('success');
      
      const result = await withStreamingErrorHandling(
        successfulOperation,
        'Test Operation',
        5000
      );
      
      expect(result).toBe('success');
      expect(successfulOperation).toHaveBeenCalledTimes(1);
    });

    it('should handle operation timeouts', async () => {
      const slowOperation = vi.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 2000))
      );
      
      await expect(
        withStreamingErrorHandling(slowOperation, 'Test Operation', 100)
      ).rejects.toThrow();
    });

    it('should handle operation errors', async () => {
      const failingOperation = vi.fn().mockRejectedValue(new Error('Operation failed'));
      
      await expect(
        withStreamingErrorHandling(failingOperation, 'Test Operation', 5000)
      ).rejects.toThrow('Operation failed');
    });
  });

  describe('Retry Logic', () => {
    it('should succeed on first attempt', async () => {
      const successfulOperation = vi.fn().mockResolvedValue('success');
      
      const result = await retryStreamingOperation(successfulOperation, {
        maxRetries: 3,
        baseDelayMs: 100,
        maxDelayMs: 1000,
        backoffMultiplier: 2,
        retryableErrors: ['STREAM_001'],
      });
      
      expect(result).toBe('success');
      expect(successfulOperation).toHaveBeenCalledTimes(1);
    });

    it('should retry on retryable errors', async () => {
      const failingOperation = vi.fn()
        .mockRejectedValueOnce({ code: 'STREAM_001', message: 'Retryable error' })
        .mockRejectedValueOnce({ code: 'STREAM_001', message: 'Retryable error' })
        .mockResolvedValue('success');
      
      const result = await retryStreamingOperation(failingOperation, {
        maxRetries: 3,
        baseDelayMs: 10, // Short delay for testing
        maxDelayMs: 100,
        backoffMultiplier: 2,
        retryableErrors: ['STREAM_001'],
      });
      
      expect(result).toBe('success');
      expect(failingOperation).toHaveBeenCalledTimes(3);
    });

    it('should not retry on non-retryable errors', async () => {
      const failingOperation = vi.fn()
        .mockRejectedValue({ code: 'STREAM_004', message: 'Non-retryable error' });
      
      await expect(
        retryStreamingOperation(failingOperation, {
          maxRetries: 3,
          baseDelayMs: 10,
          maxDelayMs: 100,
          backoffMultiplier: 2,
          retryableErrors: ['STREAM_001'],
        })
      ).rejects.toEqual({ code: 'STREAM_004', message: 'Non-retryable error' });
      
      expect(failingOperation).toHaveBeenCalledTimes(1);
    });

    it('should give up after max retries', async () => {
      const failingOperation = vi.fn()
        .mockRejectedValue({ code: 'STREAM_001', message: 'Always fails' });
      
      await expect(
        retryStreamingOperation(failingOperation, {
          maxRetries: 2,
          baseDelayMs: 10,
          maxDelayMs: 100,
          backoffMultiplier: 2,
          retryableErrors: ['STREAM_001'],
        })
      ).rejects.toEqual({ code: 'STREAM_001', message: 'Always fails' });
      
      expect(failingOperation).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });
  });

  describe('Real-world Streaming Scenarios', () => {
    it('should handle partial stream interruption', async () => {
      const monitor = new StreamHealthMonitor(1000, 10000);
      
      // Simulate normal streaming
      monitor.recordChunk(100);
      monitor.recordChunk(150);
      
      let health = monitor.checkHealth();
      expect(health.healthy).toBe(true);
      
      // Simulate interruption (no chunks for a while)
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      health = monitor.checkHealth();
      expect(health.healthy).toBe(false);
      expect(health.error?.type).toBe('TIMEOUT');
    });

    it('should handle credits exhaustion during streaming', () => {
      const stream = new CreditsAwareStream('user-123', 5, 8);
      
      // Start streaming
      expect(stream.canContinueStreaming()).toBe(true);
      
      // Consume credits gradually
      stream.recordCreditsUsed(3);
      expect(stream.canContinueStreaming()).toBe(true);
      
      stream.recordCreditsUsed(3);
      expect(stream.canContinueStreaming()).toBe(true);
      
      // Exceed limit
      stream.recordCreditsUsed(3);
      expect(stream.canContinueStreaming()).toBe(false);
    });

    it('should handle mixed error scenarios', async () => {
      const monitor = new StreamHealthMonitor(500, 2000);
      const stream = new CreditsAwareStream('user-123', 3, 5);
      
      // Start with normal operation
      monitor.recordChunk(100);
      stream.recordCreditsUsed(1);
      
      expect(monitor.checkHealth().healthy).toBe(true);
      expect(stream.canContinueStreaming()).toBe(true);
      
      // Approach credits limit
      stream.recordCreditsUsed(3);
      expect(stream.isApproachingLimit(0.8)).toBe(true);
      
      // Simulate silence
      await new Promise(resolve => setTimeout(resolve, 600));
      
      const health = monitor.checkHealth();
      expect(health.healthy).toBe(false);
      
      // Credits are also exhausted
      stream.recordCreditsUsed(2);
      expect(stream.canContinueStreaming()).toBe(false);
    });
  });

  describe('Performance Tests', () => {
    it('should handle high-frequency chunk recording', () => {
      const monitor = new StreamHealthMonitor();
      
      const startTime = Date.now();
      
      // Record many chunks quickly
      for (let i = 0; i < 1000; i++) {
        monitor.recordChunk(Math.random() * 100);
      }
      
      const endTime = Date.now();
      const stats = monitor.getStats();
      
      expect(stats.chunkCount).toBe(1000);
      expect(endTime - startTime).toBeLessThan(100); // Should be fast
    });

    it('should handle large credit calculations', () => {
      const stream = new CreditsAwareStream('user-123', 1000, 10000);
      
      const startTime = Date.now();
      
      // Record many credit transactions
      for (let i = 0; i < 1000; i++) {
        stream.recordCreditsUsed(1);
      }
      
      const endTime = Date.now();
      
      expect(stream.getRemainingCredits()).toBe(9000);
      expect(endTime - startTime).toBeLessThan(50); // Should be fast
    });
  });
});