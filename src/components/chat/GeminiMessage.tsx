"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Copy, ThumbsUp, ThumbsDown, RotateCcw } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import type { ChatMessage } from "@/stores/chatStore"

interface GeminiMessageProps {
  message: ChatMessage
  isLast: boolean
}

export function GeminiMessage({ message, isLast }: GeminiMessageProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const isUser = message.role === 'user'

  return (
    <div className="gemini-message-enter w-full max-w-4xl mx-auto px-4 py-6">
      <div className={cn("flex gap-6", isUser ? "flex-row-reverse" : "flex-row")}>
        {/* Avatar */}
        <div className="flex-shrink-0">
          {isUser ? (
            <div className="gemini-avatar-user w-10 h-10 rounded-full flex items-center justify-center text-white font-medium text-sm">
              U
            </div>
          ) : (
            <div className="gemini-avatar-ai w-10 h-10 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
          )}
        </div>

        {/* Message Content */}
        <div className="flex-1 min-w-0">
          <div className={cn("mb-2", isUser ? "text-right" : "text-left")}>
            <span className="text-sm font-medium text-muted-foreground">
              {isUser ? "Vous" : "Chifa.ai"}
            </span>
          </div>
          
          <div className={cn(
            "prose prose-sm max-w-none",
            isUser 
              ? "text-right" 
              : "text-left",
            "dark:prose-invert prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-code:text-foreground"
          )}>
            {message.content.split('\n').map((line, index) => (
              <p key={index} className="mb-3 last:mb-0 leading-relaxed">
                {line || '\u00A0'}
              </p>
            ))}
          </div>

          {/* Action buttons for AI messages */}
          {!isUser && (
            <div className="flex items-center gap-2 mt-4 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="h-8 px-3 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-full"
              >
                <Copy className="h-3 w-3 mr-1" />
                {copied ? "Copié" : "Copier"}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-3 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-full"
              >
                <ThumbsUp className="h-3 w-3 mr-1" />
                Utile
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-3 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-full"
              >
                <ThumbsDown className="h-3 w-3 mr-1" />
                Pas utile
              </Button>

              {isLast && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-3 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-full"
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Régénérer
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}