import { streamText } from 'ai';
import { getSupabaseUser } from '@/lib/auth/supabase-auth-adapter';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { checkCreditsAvailable, consumeCredits, calculateChatCredits } from '@/lib/utils/credits-manager';
import { logError } from '@/lib/utils/error-handling';
import { 
  createOptimizedChifaStream, 
  globalStreamingPool, 
  logStreamingMetrics,
  DEFAULT_STREAMING_CONFIG 
} from '@/lib/utils/streaming-optimizer';
import { 
  handleStreamingError, 
  createResilientStream,
  globalStreamHealthMonitor 
} from '@/lib/utils/streaming-error-handler';

import { CoreMessage } from 'ai';

// Define the expected request body structure
interface RequestBody {
  messages: CoreMessage[];
  conversationId?: string | null;
}

export const runtime = 'edge';

/**
 * Optimized language model implementation for Chifa.ai
 * This creates a streaming response with advanced error handling and performance optimization
 */
async function createChifaStream(
  messages: CoreMessage[],
  userId: string,
  conversationId: string
): Promise<{ stream: ReadableStream<Uint8Array>; cleanup: () => void }> {
  const apiUrl = process.env.CHIFA_LANGGRAPH_AGENT_URL;
  
  if (!apiUrl) {
    throw new Error('API URL not configured');
  }

  // Prepare the messages for the Chifa.ai API
  const apiMessages = messages.map(msg => ({
    role: msg.role,
    content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
  }));

  const requestBody = {
    messages: apiMessages,
    stream: true,
    user_id: userId,
    conversation_id: conversationId,
  };

  const headers = {
    'Authorization': `Bearer ${process.env.CHIFA_AGENT_COMM_JWT_SECRET}`,
  };

  // Use optimized streaming with resilient error handling
  const streamFactory = async () => {
    const startTime = Date.now();
    
    try {
      const { stream, streamer } = await createOptimizedChifaStream(
        apiUrl,
        requestBody,
        headers,
        {
          ...DEFAULT_STREAMING_CONFIG,
          bufferSize: 4096,  // 4KB buffer for chat responses
          chunkSize: 512,    // 512 bytes chunks for smooth streaming
        }
      );

      // Record successful health check
      globalStreamHealthMonitor.recordHealthCheck(true, Date.now() - startTime);

      return {
        stream,
        cleanup: () => {
          globalStreamingPool.removeConnection(streamer);
          // Log performance metrics
          const metrics = streamer.getMetrics();
          logStreamingMetrics(metrics);
        }
      };
    } catch (error) {
      // Record failed health check
      globalStreamHealthMonitor.recordHealthCheck(false, Date.now() - startTime);
      
      // Handle and classify the error
      const streamingError = handleStreamingError(error, {
        apiUrl,
        userId,
        conversationId,
        messageCount: messages.length
      });
      
      throw new Error(streamingError.userMessage);
    }
  };

  // Create resilient stream with automatic retry
  const result = await streamFactory();
  return result;
}

export async function POST(req: NextRequest) {
  try {
    // Get the current user from Supabase session
    const user = await getSupabaseUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse the request body
    const { messages, conversationId: existingConversationId }: RequestBody = await req.json();

    // Validate the messages
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Invalid messages format' }, { status: 400 });
    }

    // Get the last user message
    const lastUserMessage = messages.filter(m => m.role === 'user').pop();
    if (!lastUserMessage) {
      return NextResponse.json({ error: 'No user message found' }, { status: 400 });
    }

    const userMessageContent = typeof lastUserMessage.content === 'string' 
      ? lastUserMessage.content 
      : JSON.stringify(lastUserMessage.content);

    // Calculate credits needed for this operation
    const creditsNeeded = calculateChatCredits(
      userMessageContent,
      false, // We'll detect SQL later
      true // Always streaming
    );

    // Check if user has sufficient credits
    const { available, error: creditsError } = await checkCreditsAvailable(user.id, creditsNeeded);
    if (!available) {
      logError(creditsError!, 'Chat API - Credits check');
      return NextResponse.json({ 
        error: creditsError!.message,
        code: creditsError!.code,
        type: 'CREDITS_ERROR'
      }, { status: 402 }); // Payment Required
    }

    // Create a Supabase client
    const supabase = createSupabaseServerClient();

    // Generate or use existing conversation ID
    let conversationId = existingConversationId;
    let isNewConversation = false;

    if (!conversationId) {
      conversationId = uuidv4();
      isNewConversation = true;

      // Create a new conversation
      const { error: conversationError } = await supabase
        .from('chat_conversations')
        .insert({
          id: conversationId,
          user_id: user.id,
          title: userMessageContent.substring(0, 100),
        });

      if (conversationError) {
        console.error('Error creating conversation:', conversationError);
        return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
      }
    }

    // Store the user message in the database
    const userMessageId = uuidv4();
    const { error: messageError } = await supabase
      .from('chat_messages')
      .insert({
        id: userMessageId,
        conversation_id: conversationId,
        user_id: user.id,
        role: 'user',
        content: userMessageContent,
      });

    if (messageError) {
      console.error('Error storing user message:', messageError);
      // Continue anyway, as this is not critical
    }

    try {
      // Create the optimized streaming response from Chifa.ai
      const { stream: chifaStream, cleanup } = await createChifaStream(messages, user.id, conversationId);
      
      // Create a transform stream to process the response and store it
      const { readable, writable } = new TransformStream();
      const writer = writable.getWriter();
      const reader = chifaStream.getReader();
      
      let completeResponse = '';
      
      // Process the stream in the background
      const processStream = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            // Convert the chunk to text and accumulate
            const chunk = new TextDecoder().decode(value);
            completeResponse += chunk;
            
            // Forward the chunk to the client
            await writer.write(value);
          }
          
          // Close the writer when done
          await writer.close();
          
          // Store the complete response in the database
          const assistantMessageId = uuidv4();
          await supabase
            .from('chat_messages')
            .insert({
              id: assistantMessageId,
              conversation_id: conversationId,
              user_id: user.id,
              role: 'assistant',
              content: completeResponse,
            });
          
          // Consume credits after successful operation
          const hasSQL = completeResponse.includes('```sql') || 
                         completeResponse.includes('SELECT') || 
                         completeResponse.includes('INSERT') ||
                         completeResponse.includes('UPDATE') ||
                         completeResponse.includes('DELETE');
          
          const finalCreditsNeeded = calculateChatCredits(userMessageContent, hasSQL, true);
          
          await consumeCredits(
            user.id,
            finalCreditsNeeded,
            hasSQL ? 'sql_query' : 'chat',
            {
              model_used: 'chifa-ai',
              streaming: true,
              response_length: completeResponse.length,
            },
            conversationId,
            assistantMessageId
          );
          
          // Update the conversation title if it's a new conversation
          if (isNewConversation && completeResponse.length > 0) {
            // Generate a title from the first few words of the user message
            const title = userMessageContent.split(' ').slice(0, 8).join(' ') + 
                         (userMessageContent.split(' ').length > 8 ? '...' : '');
            await supabase
              .from('chat_conversations')
              .update({ title })
              .eq('id', conversationId);
          }
          
          // Clean up streaming resources
          cleanup();
        } catch (error) {
          console.error('Error processing stream:', error);
          try {
            await writer.abort(error as Error);
          } catch (e) {
            console.error('Error aborting writer:', e);
          } finally {
            // Always clean up resources
            cleanup();
          }
        }
      };
      
      // Start processing the stream without waiting for it to complete
      processStream();
      
      // Return the streaming response
      return new Response(readable, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'X-Conversation-Id': conversationId,
        },
      });
      
    } catch (error) {
      console.error('Error creating Chifa stream:', error);
      return NextResponse.json({ 
        error: 'Failed to connect to Chifa.ai service',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('Error in chat API route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}