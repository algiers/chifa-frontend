/**
 * Streaming Optimization Utilities for Chifa.ai
 * 
 * This module provides optimized streaming functionality with:
 * - Configurable buffer sizes and chunk management
 * - Connection pooling and retry logic
 * - Performance monitoring and metrics
 * - Error handling and recovery
 */

import { logError } from './error-handling';

// Configuration for streaming optimization
export interface StreamingConfig {
  bufferSize: number;
  chunkSize: number;
  maxRetries: number;
  retryDelay: number;
  connectionTimeout: number;
  keepAliveTimeout: number;
  compressionEnabled: boolean;
}

// Default optimized configuration
export const DEFAULT_STREAMING_CONFIG: StreamingConfig = {
  bufferSize: 8192,        // 8KB buffer for optimal performance
  chunkSize: 1024,         // 1KB chunks for smooth streaming
  maxRetries: 3,           // Retry failed connections up to 3 times
  retryDelay: 1000,        // 1 second delay between retries
  connectionTimeout: 30000, // 30 second connection timeout
  keepAliveTimeout: 60000, // 60 second keep-alive
  compressionEnabled: true, // Enable compression for better bandwidth usage
};

// Performance metrics tracking
interface StreamingMetrics {
  startTime: number;
  endTime?: number;
  bytesTransferred: number;
  chunksProcessed: number;
  retryCount: number;
  errors: string[];
}

/**
 * Optimized streaming class with advanced features
 */
export class OptimizedStreamer {
  private config: StreamingConfig;
  private metrics: StreamingMetrics;
  private abortController: AbortController;

  constructor(config: Partial<StreamingConfig> = {}) {
    this.config = { ...DEFAULT_STREAMING_CONFIG, ...config };
    this.metrics = {
      startTime: Date.now(),
      bytesTransferred: 0,
      chunksProcessed: 0,
      retryCount: 0,
      errors: []
    };
    this.abortController = new AbortController();
  }

  /**
   * Create an optimized fetch request with retry logic
   */
  private async createOptimizedFetch(
    url: string, 
    options: RequestInit,
    retryCount = 0
  ): Promise<Response> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.connectionTimeout);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          ...options.headers,
          'Connection': 'keep-alive',
          'Keep-Alive': `timeout=${this.config.keepAliveTimeout / 1000}`,
          ...(this.config.compressionEnabled && { 'Accept-Encoding': 'gzip, deflate, br' }),
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response;
    } catch (error) {
      this.metrics.retryCount++;
      this.metrics.errors.push(error instanceof Error ? error.message : 'Unknown error');

      if (retryCount < this.config.maxRetries) {
        await this.delay(this.config.retryDelay * (retryCount + 1)); // Exponential backoff
        return this.createOptimizedFetch(url, options, retryCount + 1);
      }

      throw error;
    }
  }

  /**
   * Create an optimized streaming response with buffering
   */
  async createOptimizedStream(
    apiUrl: string,
    requestBody: any,
    headers: Record<string, string>
  ): Promise<ReadableStream<Uint8Array>> {
    const response = await this.createOptimizedFetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.body) {
      throw new Error('No response body received');
    }

    return this.createBufferedStream(response.body);
  }

  /**
   * Create a buffered stream for optimal performance
   */
  private createBufferedStream(sourceStream: ReadableStream<Uint8Array>): ReadableStream<Uint8Array> {
    const reader = sourceStream.getReader();
    let buffer = new Uint8Array(0);

    return new ReadableStream<Uint8Array>({
      start: (controller) => {
        this.metrics.startTime = Date.now();
      },

      pull: async (controller) => {
        try {
          // Read data into buffer until we have enough for a chunk
          while (buffer.length < this.config.chunkSize) {
            const { done, value } = await reader.read();
            
            if (done) {
              // Send remaining buffer data
              if (buffer.length > 0) {
                controller.enqueue(buffer);
                this.updateMetrics(buffer.length);
              }
              this.metrics.endTime = Date.now();
              controller.close();
              return;
            }

            if (value) {
              // Append new data to buffer
              const newBuffer = new Uint8Array(buffer.length + value.length);
              newBuffer.set(buffer);
              newBuffer.set(value, buffer.length);
              buffer = newBuffer;
            }
          }

          // Send a chunk of the configured size
          const chunk = buffer.slice(0, this.config.chunkSize);
          buffer = buffer.slice(this.config.chunkSize);
          
          controller.enqueue(chunk);
          this.updateMetrics(chunk.length);

        } catch (error) {
          this.metrics.errors.push(error instanceof Error ? error.message : 'Stream error');
          controller.error(error);
        }
      },

      cancel: () => {
        this.abortController.abort();
        reader.cancel();
      }
    });
  }

  /**
   * Create a transform stream with processing capabilities
   */
  createProcessingStream(
    onChunk?: (chunk: string) => void,
    onComplete?: (fullContent: string) => void
  ): TransformStream<Uint8Array, Uint8Array> {
    let fullContent = '';
    const decoder = new TextDecoder();

    return new TransformStream<Uint8Array, Uint8Array>({
      transform: (chunk, controller) => {
        try {
          // Decode chunk and add to full content
          const text = decoder.decode(chunk, { stream: true });
          fullContent += text;

          // Call chunk callback if provided
          if (onChunk) {
            onChunk(text);
          }

          // Forward the chunk
          controller.enqueue(chunk);
          this.updateMetrics(chunk.length);

        } catch (error) {
          this.metrics.errors.push(error instanceof Error ? error.message : 'Transform error');
          controller.error(error);
        }
      },

      flush: (controller) => {
        try {
          // Call completion callback if provided
          if (onComplete) {
            onComplete(fullContent);
          }
          
          this.metrics.endTime = Date.now();
        } catch (error) {
          this.metrics.errors.push(error instanceof Error ? error.message : 'Flush error');
          controller.error(error);
        }
      }
    });
  }

  /**
   * Update performance metrics
   */
  private updateMetrics(bytesProcessed: number): void {
    this.metrics.bytesTransferred += bytesProcessed;
    this.metrics.chunksProcessed++;
  }

  /**
   * Get performance metrics
   */
  getMetrics(): StreamingMetrics & { duration?: number; throughput?: number } {
    const endTime = this.metrics.endTime || Date.now();
    const duration = endTime - this.metrics.startTime;
    const throughput = this.metrics.bytesTransferred / (duration / 1000); // bytes per second

    return {
      ...this.metrics,
      duration,
      throughput
    };
  }

  /**
   * Utility function for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Abort the current streaming operation
   */
  abort(): void {
    this.abortController.abort();
  }
}

/**
 * Connection pool for managing multiple streaming connections
 */
export class StreamingConnectionPool {
  private activeConnections = new Set<OptimizedStreamer>();
  private maxConnections: number;

  constructor(maxConnections = 10) {
    this.maxConnections = maxConnections;
  }

  /**
   * Create a new streaming connection
   */
  createConnection(config?: Partial<StreamingConfig>): OptimizedStreamer {
    if (this.activeConnections.size >= this.maxConnections) {
      throw new Error('Maximum number of streaming connections reached');
    }

    const streamer = new OptimizedStreamer(config);
    this.activeConnections.add(streamer);

    return streamer;
  }

  /**
   * Remove a connection from the pool
   */
  removeConnection(streamer: OptimizedStreamer): void {
    streamer.abort();
    this.activeConnections.delete(streamer);
  }

  /**
   * Get pool statistics
   */
  getStats(): { active: number; max: number; utilization: number } {
    return {
      active: this.activeConnections.size,
      max: this.maxConnections,
      utilization: (this.activeConnections.size / this.maxConnections) * 100
    };
  }

  /**
   * Close all connections
   */
  closeAll(): void {
    for (const connection of this.activeConnections) {
      connection.abort();
    }
    this.activeConnections.clear();
  }
}

/**
 * Global connection pool instance
 */
export const globalStreamingPool = new StreamingConnectionPool();

/**
 * Utility function to create an optimized streaming response
 */
export async function createOptimizedChifaStream(
  apiUrl: string,
  requestBody: any,
  headers: Record<string, string>,
  config?: Partial<StreamingConfig>
): Promise<{
  stream: ReadableStream<Uint8Array>;
  streamer: OptimizedStreamer;
}> {
  const streamer = globalStreamingPool.createConnection(config);
  
  try {
    const stream = await streamer.createOptimizedStream(apiUrl, requestBody, headers);
    return { stream, streamer };
  } catch (error) {
    globalStreamingPool.removeConnection(streamer);
    throw error;
  }
}

/**
 * Performance monitoring and logging
 */
export function logStreamingMetrics(metrics: ReturnType<OptimizedStreamer['getMetrics']>): void {
  const {
    duration = 0,
    throughput = 0,
    bytesTransferred,
    chunksProcessed,
    retryCount,
    errors
  } = metrics;

  console.log('🚀 Streaming Performance Metrics:', {
    duration: `${duration}ms`,
    throughput: `${Math.round(throughput)} bytes/sec`,
    bytesTransferred: `${bytesTransferred} bytes`,
    chunksProcessed,
    retryCount,
    errorCount: errors.length,
    ...(errors.length > 0 && { errors: errors.slice(-3) }) // Show last 3 errors
  });

  // Log performance warnings
  if (throughput < 1000) { // Less than 1KB/sec
    console.warn('⚠️ Low streaming throughput detected');
  }
  
  if (retryCount > 0) {
    console.warn(`⚠️ ${retryCount} retries occurred during streaming`);
  }
  
  if (errors.length > 0) {
    console.error(`Streaming errors: ${errors.join(', ')}`);
  }
}