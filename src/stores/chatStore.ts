import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware'; // Optionnel pour persister l'historique du chat

// Types pour les messages et l'état du chat au format standard
export interface ChatMessage {
  id: string; // uuid pour la clé
  role: 'user' | 'assistant' | 'system' | 'function' | 'tool' | 'error';
  content: string;
  name?: string;
  function_call?: any;
  tool_calls?: any[];
  sqlQuery?: string | null; // Pour la compatibilité avec l'existant
  sqlResults?: any[] | null; // Pour la compatibilité avec l'existant
  errorMessage?: string | null; // Message d'erreur spécifique à ce message
  timestamp: Date;
}

// Interface pour une conversation
export interface Conversation {
  id: string;
  title?: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

interface ChatState {
  messages: ChatMessage[];
  currentQuery: string; // La requête en cours de saisie par l'utilisateur
  isLoading: boolean; // Si l'agent est en train de répondre
  error: string | null; // Erreur globale du chat (ex: API indisponible)
  currentConversationId: string | null; // ID de la conversation active
  conversations: Conversation[]; // Liste de toutes les conversations
  
  // Optionnel: pour stocker la dernière exécution SQL séparément si besoin
  lastSqlExecuted: string | null;
  lastSqlResults: any[] | null;

  // Actions
  addMessage: (message: Partial<ChatMessage> & { role: ChatMessage['role'], content: string }, conversationIdToSet?: string | null) => void;
  setMessages: (messages: ChatMessage[]) => void; // Pour remplacer tous les messages
  setCurrentConversationId: (conversationId: string | null) => void;
  setCurrentQuery: (query: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearChat: () => void;
  clearMessages: () => void; // Clear messages of current conversation
  
  // Conversation management
  createNewConversation: () => string; // Returns new conversation ID
  switchConversation: (conversationId: string) => void;
  deleteConversation: (conversationId: string) => void;
  updateConversationTitle: (conversationId: string, title: string) => void;
  
  // API integration
  sendMessage: (content: string, model?: string) => Promise<void>;
  
  setLastSqlExecution: (sql: string | null, results: any[] | null) => void;
  updateMessageById: (id: string, updates: Partial<ChatMessage>) => void;
  getUUID: () => string; // Exposer la fonction getUUID
}

const initialState = {
  messages: [],
  currentQuery: '',
  isLoading: false,
  error: null,
  currentConversationId: null,
  conversations: [],
  lastSqlExecuted: null,
  lastSqlResults: null,
};

// Polyfill for UUID generation
function getUUID() {
  if (typeof window !== 'undefined' && window.crypto && typeof window.crypto.randomUUID === 'function') {
    return window.crypto.randomUUID();
  }
  // Fallback: RFC4122 version 4 compliant UUID generator
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export const useChatStore = create<ChatState>()(
  // Optionnel: persist middleware si on veut sauvegarder l'état du chat (ex: messages non envoyés)
  // Pour l'historique des conversations complètes, Supabase DB est préférable.
  // persist( 
    (set, get) => ({
      ...initialState,

      setCurrentQuery: (query) => set({ currentQuery: query }),
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      setCurrentConversationId: (conversationId) => set({ currentConversationId: conversationId }),

      addMessage: (messageContent, conversationIdToSet = null) => {
        const newMessage: ChatMessage = {
          id: messageContent.id || getUUID(), // Utiliser l'ID fourni ou en générer un nouveau
          ...messageContent,
          timestamp: new Date(),
        };
        set((state) => ({ 
          messages: [...state.messages, newMessage],
          // Si un conversationIdToSet est fourni (ex: après la première réponse de l'agent pour une nouvelle conv), le définir.
          // S'il est undefined, ne pas changer currentConversationId.
          // S'il est null, cela signifie explicitement qu'il n'y a pas de conversation active (ex: après clearChat).
          currentConversationId: conversationIdToSet !== undefined ? conversationIdToSet : state.currentConversationId,
        }));
      },
      
      setMessages: (messages) => set({ messages }),

      updateMessageById: (id, updates) => {
        set((state) => ({
          messages: state.messages.map((msg) =>
            msg.id === id ? { ...msg, ...updates, timestamp: new Date() } : msg
          ),
        }));
      },
      
      setLastSqlExecution: (sql, results) => set({ lastSqlExecuted: sql, lastSqlResults: results }),

      clearChat: () => set((state) => ({ 
        messages: [], 
        currentQuery: '',
        currentConversationId: null, // Réinitialiser l'ID de la conversation
        conversations: [],
        // isLoading: false, 
        // error: null, 
        lastSqlExecuted: null,
        lastSqlResults: null,
      })),

      clearMessages: () => set((state) => {
        if (state.currentConversationId) {
          const updatedConversations = state.conversations.map(conv =>
            conv.id === state.currentConversationId
              ? { ...conv, messages: [], updatedAt: new Date() }
              : conv
          );
          return {
            messages: [],
            conversations: updatedConversations,
            lastSqlExecuted: null,
            lastSqlResults: null,
          };
        }
        return { messages: [], lastSqlExecuted: null, lastSqlResults: null };
      }),

      createNewConversation: () => {
        const newId = getUUID();
        const newConversation: Conversation = {
          id: newId,
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        set((state) => ({
          conversations: [newConversation, ...state.conversations],
          currentConversationId: newId,
          messages: [],
          currentQuery: '',
          error: null,
        }));
        
        return newId;
      },

      switchConversation: (conversationId: string) => {
        set((state) => {
          const conversation = state.conversations.find(c => c.id === conversationId);
          return {
            currentConversationId: conversationId,
            messages: conversation?.messages || [],
            currentQuery: '',
            error: null,
          };
        });
      },

      deleteConversation: (conversationId: string) => {
        set((state) => {
          const updatedConversations = state.conversations.filter(c => c.id !== conversationId);
          const isCurrentConversation = state.currentConversationId === conversationId;
          
          return {
            conversations: updatedConversations,
            currentConversationId: isCurrentConversation ? null : state.currentConversationId,
            messages: isCurrentConversation ? [] : state.messages,
          };
        });
      },

      updateConversationTitle: (conversationId: string, title: string) => {
        set((state) => ({
          conversations: state.conversations.map(conv =>
            conv.id === conversationId
              ? { ...conv, title, updatedAt: new Date() }
              : conv
          ),
        }));
      },

      sendMessage: async (content: string, model = 'gpt-4') => {
        const state = get();
        
        // Create new conversation if none exists
        let conversationId = state.currentConversationId;
        if (!conversationId) {
          conversationId = get().createNewConversation();
        }

        // Add user message
        const userMessage: ChatMessage = {
          id: getUUID(),
          role: 'user',
          content,
          timestamp: new Date(),
        };

        set((state) => ({
          messages: [...state.messages, userMessage],
          isLoading: true,
          error: null,
        }));

        // Update conversation with user message
        set((state) => ({
          conversations: state.conversations.map(conv =>
            conv.id === conversationId
              ? { ...conv, messages: [...conv.messages, userMessage], updatedAt: new Date() }
              : conv
          ),
        }));

        try {
          const response = await fetch('/api/chat/send-message', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              message: content,
              model,
              conversationId,
            }),
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const reader = response.body?.getReader();
          if (!reader) {
            throw new Error('No response body');
          }

          let assistantMessage: ChatMessage = {
            id: getUUID(),
            role: 'assistant',
            content: '',
            timestamp: new Date(),
          };

          // Add empty assistant message
          set((state) => ({
            messages: [...state.messages, assistantMessage],
          }));

          // Stream the response
          const decoder = new TextDecoder();
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') continue;

                try {
                  const parsed = JSON.parse(data);
                  if (parsed.content) {
                    assistantMessage.content += parsed.content;
                    
                    // Update the message in store
                    set((state) => ({
                      messages: state.messages.map(msg =>
                        msg.id === assistantMessage.id
                          ? { ...msg, content: assistantMessage.content }
                          : msg
                      ),
                    }));
                  }
                } catch (e) {
                  console.error('Error parsing SSE data:', e);
                }
              }
            }
          }

          // Update conversation with final assistant message
          set((state) => ({
            conversations: state.conversations.map(conv =>
              conv.id === conversationId
                ? { 
                    ...conv, 
                    messages: [...conv.messages, assistantMessage], 
                    updatedAt: new Date(),
                    title: conv.title || content.slice(0, 50) + (content.length > 50 ? '...' : '')
                  }
                : conv
            ),
            isLoading: false,
          }));

        } catch (error) {
          console.error('Error sending message:', error);
          set((state) => ({
            error: error instanceof Error ? error.message : 'Une erreur est survenue',
            isLoading: false,
          }));
        }
      },
      
      getUUID: () => getUUID(), // Exposer la fonction getUUID
    })
  //   {
  //     name: 'chat-storage', // Nom pour localStorage
  //     storage: createJSONStorage(() => localStorage),
  //     partialize: (state) => ({ messages: state.messages, currentQuery: state.currentQuery }), // Persister uniquement certains champs
  //   }
  // )
);

// Exemple d'utilisation:
// const { messages, addMessage, setLoading } = useChatStore();
// addMessage({ role: 'user', content: 'Ma question' });
// setLoading(true);
// ... après réponse de l'API ...
// addMessage({ role: 'assistant', content: 'Réponse IA', sqlQuery: 'SELECT ...', sqlResults: [...] });
// setLoading(false);
