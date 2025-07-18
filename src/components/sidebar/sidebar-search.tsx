'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { searchConversations } from '@/lib/utils/conversation-utils';
import { ChifaConversation } from '@/lib/adapters/chat-adapters';
import { SidebarHistoryItem } from './sidebar-history-item';
import { useParams } from 'next/navigation';
import { useSidebar } from '@/components/ui/sidebar';

interface SidebarSearchProps {
  user: any;
  onClose: () => void;
}

export function SidebarSearch({ user, onClose }: SidebarSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ChifaConversation[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { id } = useParams();
  const { setOpenMobile } = useSidebar();

  // Focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      if (!user) return;

      setIsSearching(true);
      try {
        const searchResults = await searchConversations(user.id, query.trim(), 20);
        // Transform search results to ChifaConversation format
        const adaptedResults = searchResults.map(result => ({
          id: result.id,
          user_id: user.id,
          title: result.title,
          created_at: result.createdAt.toISOString(),
          updated_at: result.updatedAt.toISOString(),
          metadata: {},
        }));
        setResults(adaptedResults);
        setHasSearched(true);
      } catch (error) {
        console.error('Error searching conversations:', error);
        setResults([]);
        setHasSearched(true);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, user]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleDelete = (conversationId: string) => {
    setResults(prev => prev.filter(conv => conv.id !== conversationId));
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search Header */}
      <div className="flex items-center gap-2 p-3 border-b">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            placeholder="Rechercher dans les conversations..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-8 pr-8"
          />
          {query && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              onClick={() => setQuery('')}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Search Results */}
      <div className="flex-1 overflow-y-auto p-2">
        {isSearching && (
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-muted-foreground">Recherche en cours...</div>
          </div>
        )}

        {!isSearching && hasSearched && results.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Search className="h-8 w-8 text-muted-foreground mb-2" />
            <div className="text-sm text-muted-foreground">
              Aucune conversation trouvée pour "{query}"
            </div>
          </div>
        )}

        {!isSearching && results.length > 0 && (
          <div className="space-y-1">
            <div className="flex items-center justify-between px-2 py-1">
              <span className="text-xs text-muted-foreground">
                Résultats de recherche
              </span>
              <Badge variant="secondary" className="text-xs">
                {results.length}
              </Badge>
            </div>
            
            {results.map((conversation) => (
              <SidebarHistoryItem
                key={conversation.id}
                conversation={conversation}
                isActive={conversation.id === id}
                onDelete={handleDelete}
                setOpenMobile={setOpenMobile}
              />
            ))}
          </div>
        )}

        {!hasSearched && !query && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Search className="h-8 w-8 text-muted-foreground mb-2" />
            <div className="text-sm text-muted-foreground">
              Tapez pour rechercher dans vos conversations
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Recherche dans les titres et le contenu
            </div>
          </div>
        )}
      </div>

      {/* Search Tips */}
      {!hasSearched && query.length > 0 && query.length < 3 && (
        <div className="p-3 border-t bg-muted/30">
          <div className="text-xs text-muted-foreground">
            💡 Tapez au moins 3 caractères pour une recherche plus précise
          </div>
        </div>
      )}
    </div>
  );
}