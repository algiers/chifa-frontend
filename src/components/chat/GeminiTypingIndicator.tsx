"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export function GeminiTypingIndicator() {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6">
      <div className="flex gap-6">
        {/* AI Avatar */}
        <div className="flex-shrink-0">
          <div className="gemini-avatar-ai w-10 h-10 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
        </div>

        {/* Typing content */}
        <div className="flex-1 min-w-0">
          <div className="mb-2">
            <span className="text-sm font-medium text-muted-foreground">Chifa.ai</span>
          </div>
          
          <div className="flex items-center gap-1 py-2">
            <div className="typing-indicator">
              <div className="typing-dot bg-blue-500"></div>
              <div className="typing-dot bg-purple-500"></div>
              <div className="typing-dot bg-cyan-500"></div>
            </div>
            <span className="text-sm text-muted-foreground ml-2">réfléchit...</span>
          </div>
        </div>
      </div>
    </div>
  )
}