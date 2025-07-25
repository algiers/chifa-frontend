"use client"

import React, { useState } from "react"
import { GeminiSidebar } from "./GeminiSidebar"
import { GeminiHeader } from "./GeminiHeader"
import { GeminiChatArea } from "./GeminiChatArea"
import { GeminiInputArea } from "./GeminiInputArea"
import { GeminiConnectionStatus } from "./GeminiConnectionStatus"
import { useChatStore } from "../../stores/chatStore"

export function GeminiChatLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { messages, isLoading, currentConversationId, createNewConversation } = useChatStore()

  // Create initial conversation if none exists
  React.useEffect(() => {
    if (!currentConversationId) {
      createNewConversation()
    }
  }, [currentConversationId, createNewConversation])

  return (
    <div className="gemini-chat flex h-screen bg-background text-foreground">
      <GeminiSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col">
        <GeminiHeader onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 flex flex-col overflow-hidden">
          <GeminiChatArea messages={messages} isLoading={isLoading} />
          <GeminiInputArea />
        </main>
      </div>

      <GeminiConnectionStatus />
    </div>
  )
}