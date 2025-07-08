import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware'; // Optionnel pour persister l'historique du chat

// Types pour les messages et l'état du chat
export interface ChatMessage {
  id: string; // uuid ou timestamp pour la clé
  role: 'user' | 'assistant' | 'system' | 'error';
  content: string;
  sqlQuery?: string | null; // SQL généré par l'assistant
  sqlResults?: any[] | null; // Résultats SQL formatés (ex: tableau d'objets)
  errorMessage?: string | null; // Message d'erreur spécifique à ce message
  timestamp: Date;
}

interface ChatState {
  messages: ChatMessage[];
  currentQuery: string; // La requête en cours de saisie par l'utilisateur
  isLoading: boolean; // Si l'agent est en train de répondre
  error: string | null; // Erreur globale du chat (ex: API indisponible)
  currentConversationId: string | null; // ID de la conversation active
  
  // Optionnel: pour stocker la dernière exécution SQL séparément si besoin
  lastSqlExecuted: string | null;
  lastSqlResults: any[] | null;

  // Actions
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>, conversationIdToSet?: string | null) => void;
  setMessages: (messages: ChatMessage[]) => void; // Pour remplacer tous les messages
  setCurrentConversationId: (conversationId: string | null) => void;
  setCurrentQuery: (query: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearChat: () => void;
  
  setLastSqlExecution: (sql: string | null, results: any[] | null) => void;
  updateMessageById: (id: string, updates: Partial<ChatMessage>) => void;
}

const initialState = {
  messages: [],
  currentQuery: '',
  isLoading: false,
  error: null,
  currentConversationId: null,
  lastSqlExecuted: null,
  lastSqlResults: null,
};

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
          id: crypto.randomUUID(), // Générer un ID unique simple
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
        // isLoading: false, 
        // error: null, 
        lastSqlExecuted: null,
        lastSqlResults: null,
      })),
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
