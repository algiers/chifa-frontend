"use client"

import { X, Plus, Settings, MessageSquare, Trash2, Edit3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useChatStore } from "@/stores/chatStore"
import { useState } from "react"

interface GeminiSidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function GeminiSidebar({ isOpen, onClose }: GeminiSidebarProps) {
  const { conversations, currentConversationId, createNewConversation, switchConversation, clearMessages } = useChatStore()
  const [hoveredConversation, setHoveredConversation] = useState<string | null>(null)

  const handleNewConversation = () => {
    createNewConversation()
    onClose()
  }

  const handleSwitchConversation = (conversationId: string) => {
    switchConversation(conversationId)
    onClose()
  }

  const handleClearChat = () => {
    clearMessages()
  }

  const formatConversationTitle = (conversation: any) => {
    if (conversation.messages && conversation.messages.length > 0) {
      const firstUserMessage = conversation.messages.find((msg: any) => msg.role === 'user')
      if (firstUserMessage) {
        return firstUserMessage.content.slice(0, 50) + (firstUserMessage.content.length > 50 ? '...' : '')
      }
    }
    return `Conversation ${conversation.id.slice(0, 8)}`
  }

  return (
    <>
      {/* Overlay */}
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed left-0 top-0 h-full w-64 bg-background border-r border-border z-50 transform transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="text-lg font-semibold">Conversations</h2>
            <Button variant="ghost" size="icon" onClick={onClose} className="lg:hidden">
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* New Chat Button - Gemini Style */}
          <div className="p-4">
            <Button 
              onClick={handleNewConversation}
              className="w-full justify-center gap-3 h-12 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200" 
              variant="default"
            >
              <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                <Plus className="h-3 w-3" />
              </div>
              <span className="font-medium">Nouveau chat</span>
            </Button>
          </div>

          {/* Chat History */}
          <div className="flex-1 overflow-y-auto px-4 gemini-sidebar">
            <div className="space-y-2">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className="relative group"
                  onMouseEnter={() => setHoveredConversation(conversation.id)}
                  onMouseLeave={() => setHoveredConversation(null)}
                >
                  <Button
                    onClick={() => handleSwitchConversation(conversation.id)}
                    variant={currentConversationId === conversation.id ? "secondary" : "ghost"}
                    className="w-full justify-start gap-2 h-auto p-3 text-left pr-8"
                  >
                    <MessageSquare className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate text-sm">
                      {formatConversationTitle(conversation)}
                    </span>
                  </Button>

                  {/* Action buttons */}
                  {hoveredConversation === conversation.id && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation()
                          // Handle edit conversation name
                        }}
                      >
                        <Edit3 className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation()
                          // Handle delete conversation
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}

              {conversations.length === 0 && (
                <div className="text-center text-muted-foreground text-sm py-8">
                  Aucune conversation
                </div>
              )}
            </div>
          </div>

          {/* Settings */}
          <div className="p-4 border-t border-border space-y-2">
            <Button 
              onClick={handleClearChat}
              variant="ghost" 
              className="w-full justify-start gap-2 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              Effacer la conversation
            </Button>
            
            <Button variant="ghost" className="w-full justify-start gap-2">
              <Settings className="h-4 w-4" />
              Paramètres
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}