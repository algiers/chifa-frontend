'use client';

import { useState, useRef, useEffect, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  ArrowUpIcon, 
  LoaderIcon, 
  StopIcon
} from '@/components/icons';
import { Lightbulb, CreditCard, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { getDemoUsage } from '@/lib/utils/credits-manager';
import { 
  useOptimizedCallback, 
  useOptimizedMemo, 
  usePerformanceMonitor,
  useDebounce,
  useThrottle
} from '@/lib/utils/react-performance';

// Lazy load non-critical components
import dynamic from 'next/dynamic';

const SuggestedPrompts = dynamic(() => import('./suggested-prompts').then(mod => ({ 
  default: mod.SuggestedPrompts 
})), {
  loading: () => (
    <div className="space-y-2 animate-pulse">
      <div className="h-8 bg-muted/30 rounded-md w-3/4"></div>
      <div className="h-8 bg-muted/30 rounded-md w-1/2"></div>
      <div className="h-8 bg-muted/30 rounded-md w-2/3"></div>
    </div>
  ),
  ssr: false
});

interface ChatPanelProps {
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
  showSuggestions?: boolean;
  className?: string;
}

export const ChatPanel = memo(function ChatPanel({
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
  showSuggestions = false,
  className,
}: ChatPanelProps) {
  // Monitor performance
  usePerformanceMonitor('ChatPanel');
  
  const [showPrompts, setShowPrompts] = useState(showSuggestions);
  const [demoUsage, setDemoUsage] = useState<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { user } = useAuth();
  
  // Debounce input changes for better performance
  const debouncedInput = useDebounce(input, 100);
  
  // Load demo usage if user is in demo mode
  useEffect(() => {
    const loadDemoUsage = async () => {
      if (user) {
        const usage = await getDemoUsage(user.id);
        setDemoUsage(usage);
      }
    };
    
    loadDemoUsage();
  }, [user]);
  
  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  }, [input]);
  
  // Focus textarea on mount
  useEffect(() => {
    if (textareaRef.current && !showPrompts) {
      textareaRef.current.focus();
    }
  }, [showPrompts]);
  
  // Handle keyboard shortcuts - optimized with useOptimizedCallback
  const handleKeyDown = useOptimizedCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (input.trim() && !isLoading) {
          handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>);
          setShowPrompts(false);
        }
      }
      
      if (e.key === 'Escape') {
        setShowPrompts(false);
      }
    },
    [input, isLoading, handleSubmit, setShowPrompts],
    'handleKeyDown'
  );
  
  // Handle prompt selection - optimized with useOptimizedCallback
  const handlePromptSelect = useOptimizedCallback(
    (prompt: string) => {
      const syntheticEvent = {
        target: { value: prompt }
      } as React.ChangeEvent<HTMLTextAreaElement>;
      
      handleInputChange(syntheticEvent);
      setShowPrompts(false);
      
      // Focus textarea after selecting prompt
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(prompt.length, prompt.length);
        }
      }, 100);
    },
    [handleInputChange, setShowPrompts],
    'handlePromptSelect'
  );
  
  // Handle form submission - optimized with useOptimizedCallback
  const handleFormSubmit = useOptimizedCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (input.trim() && !isLoading) {
        handleSubmit(e);
        setShowPrompts(false);
      }
    },
    [input, isLoading, handleSubmit, setShowPrompts],
    'handleFormSubmit'
  );
  
  return (
    <div className={cn("space-y-4", className)}>
      {/* Demo usage indicator */}
      {demoUsage && (
        <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-medium">Mode Démonstration</span>
              </div>
              <Badge variant="outline" className="text-xs">
                {demoUsage.remainingMessages}/{demoUsage.totalMessages} messages
              </Badge>
            </div>
            {demoUsage.remainingMessages <= 2 && (
              <p className="text-xs text-orange-600 mt-2">
                Plus que {demoUsage.remainingMessages} message{demoUsage.remainingMessages > 1 ? 's' : ''} restant{demoUsage.remainingMessages > 1 ? 's' : ''}. 
                Créez un compte pour continuer.
              </p>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* Suggested prompts */}
      {showPrompts && (
        <Card className="max-h-96 overflow-y-auto">
          <CardContent className="p-4">
            <SuggestedPrompts onPromptSelect={handlePromptSelect} />
          </CardContent>
        </Card>
      )}
      
      {/* Input form */}
      <form onSubmit={handleFormSubmit} className="relative">
        <div className="relative">
          <Textarea
            ref={textareaRef}
            tabIndex={0}
            placeholder={showPrompts ? "Ou tapez votre question..." : "Posez votre question sur votre pharmacie..."}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            rows={1}
            autoFocus={!showPrompts}
            spellCheck={false}
            className="min-h-[60px] w-full resize-none bg-background pr-20 text-base focus-visible:ring-1 focus-visible:ring-green-600 focus-visible:ring-offset-0"
            disabled={isLoading}
          />
          
          {/* Action buttons */}
          <div className="absolute right-2 top-2 flex items-center gap-1">
            {!showPrompts && input.length === 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowPrompts(true)}
                    className="h-8 w-8"
                  >
                    <Lightbulb className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Voir les suggestions</TooltipContent>
              </Tooltip>
            )}
            
            <Button
              type="submit"
              size="icon"
              disabled={input.trim().length === 0 || isLoading}
              className="h-8 w-8 rounded-md bg-green-600 hover:bg-green-700"
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
        </div>
        
        {/* Help text */}
        <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>Entrée pour envoyer, Maj+Entrée pour nouvelle ligne</span>
            {process.env.CHIFA_STREAMING_ENABLED === 'true' && (
              <div className="flex items-center gap-1">
                <Zap className="w-3 h-3" />
                <span>Streaming activé</span>
              </div>
            )}
          </div>
          
          {demoUsage && demoUsage.dailyRemaining <= 1 && (
            <span className="text-orange-600">
              {demoUsage.dailyRemaining} message quotidien restant
            </span>
          )}
        </div>
      </form>
    </div>
  );
});