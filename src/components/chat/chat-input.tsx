'use client';

import { useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowUpIcon, LoaderIcon, StopIcon } from '@/components/icons';

interface ChatInputProps {
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
}

export function ChatInput({
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  }, [input]);
  
  // Focus textarea on mount
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);
  
  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isLoading) {
        handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>);
      }
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="relative">
      <Textarea
        ref={textareaRef}
        tabIndex={0}
        placeholder="Posez votre question..."
        value={input}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        rows={1}
        autoFocus
        spellCheck={false}
        className="min-h-[60px] w-full resize-none bg-background pr-12 text-base chifa-border-focus border-chifa-200 focus-visible:ring-1 focus-visible:ring-chifa-500 focus-visible:ring-offset-0 transition-all duration-200"
        disabled={isLoading}
      />
      <div className="absolute right-4 top-4">
        <Button
          type="submit"
          size="icon"
          disabled={input.trim().length === 0 || isLoading}
          className="h-8 w-8 rounded-md chifa-button"
        >
          {isLoading ? (
            <LoaderIcon size={16} />
          ) : (
            <ArrowUpIcon size={16} />
          )}
          <span className="sr-only">
            {isLoading ? 'Chargement' : 'Envoyer'}
          </span>
        </Button>
      </div>
    </form>
  );
}