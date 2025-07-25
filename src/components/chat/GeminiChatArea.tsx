"use client"

import { useEffect, useRef } from "react"
import { GeminiMessage } from "./GeminiMessage"
import { GeminiTypingIndicator } from "./GeminiTypingIndicator"
import { GeminiErrorMessage } from "./GeminiErrorMessage"
import { useChatStore } from "../../stores/chatStore"
import { useModelConfig } from "../../hooks/useModelConfig"
import type { ChatMessage } from "../../stores/chatStore"

interface GeminiChatAreaProps {
  messages: ChatMessage[]
  isLoading: boolean
}

export function GeminiChatArea({ messages, isLoading }: GeminiChatAreaProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { error, setError, sendMessage } = useChatStore()
  const { currentModel } = useModelConfig()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-gradient-to-b from-background to-muted/20">
        <div className="text-center max-w-4xl w-full">
          {/* Gemini-style large greeting */}
          <div className="mb-16">
            <h1 className="text-6xl md:text-7xl font-light text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text mb-4">
              Bonjour
            </h1>
            <p className="text-xl text-muted-foreground font-light">
              Comment puis-je vous aider aujourd'hui ?
            </p>
          </div>

          {/* Gemini-style suggestion cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
            <div className="gemini-welcome-card group p-6 rounded-2xl border border-border/50 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-100/20 cursor-pointer transition-all duration-300 bg-card/50 backdrop-blur-sm">
              <div className="text-3xl mb-3">💊</div>
              <h3 className="font-medium mb-2 text-foreground group-hover:text-blue-600 transition-colors">
                Médicaments
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Informations sur les médicaments, interactions et posologies
              </p>
            </div>
            
            <div className="gemini-welcome-card group p-6 rounded-2xl border border-border/50 hover:border-purple-300 hover:shadow-lg hover:shadow-purple-100/20 cursor-pointer transition-all duration-300 bg-card/50 backdrop-blur-sm">
              <div className="text-3xl mb-3">🏥</div>
              <h3 className="font-medium mb-2 text-foreground group-hover:text-purple-600 transition-colors">
                Conseils Pro
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Conseils pharmaceutiques professionnels adaptés
              </p>
            </div>
            
            <div className="gemini-welcome-card group p-6 rounded-2xl border border-border/50 hover:border-green-300 hover:shadow-lg hover:shadow-green-100/20 cursor-pointer transition-all duration-300 bg-card/50 backdrop-blur-sm">
              <div className="text-3xl mb-3">📋</div>
              <h3 className="font-medium mb-2 text-foreground group-hover:text-green-600 transition-colors">
                Inventaire
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Gestion des stocks et optimisation des commandes
              </p>
            </div>
            
            <div className="gemini-welcome-card group p-6 rounded-2xl border border-border/50 hover:border-orange-300 hover:shadow-lg hover:shadow-orange-100/20 cursor-pointer transition-all duration-300 bg-card/50 backdrop-blur-sm">
              <div className="text-3xl mb-3">🔍</div>
              <h3 className="font-medium mb-2 text-foreground group-hover:text-orange-600 transition-colors">
                Recherche
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Recherche avancée dans votre base pharmaceutique
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto gemini-chat-area">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {messages.map((message, index) => (
          <GeminiMessage
            key={message.id || index}
            message={message}
            isLast={index === messages.length - 1}
          />
        ))}
        
        {isLoading && <GeminiTypingIndicator />}
        
        {error && (
          <GeminiErrorMessage 
            error={error} 
            onRetry={() => {
              setError(null)
              // Retry last message if available
              const lastUserMessage = messages.filter(m => m.role === 'user').pop()
              if (lastUserMessage) {
                sendMessage(lastUserMessage.content, currentModel)
              }
            }}
          />
        )}
        
        <div ref={messagesEndRef} />
      </div>
    </div>
  )
}