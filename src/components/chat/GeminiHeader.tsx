"use client"

import { Menu, Sun, Moon, Settings } from "lucide-react"
import { Button } from "../ui/button"
import { Avatar, AvatarFallback } from "../ui/avatar"
import { useTheme } from "next-themes"
import { Badge } from "../ui/badge"
import ModelIndicator from "./ModelIndicator"
import { useModelParams } from "../../hooks/useModelConfig"

interface GeminiHeaderProps {
  onMenuClick: () => void
}

export function GeminiHeader({ onMenuClick }: GeminiHeaderProps) {
  const { theme, setTheme } = useTheme()
  const { displayName } = useModelParams()

  return (
    <header className="flex items-center justify-between px-6 py-3 border-b border-border/30 bg-background/95 backdrop-blur-sm">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onMenuClick} 
          className="lg:hidden h-9 w-9 rounded-full hover:bg-muted/50"
        >
          <Menu className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <h1 className="text-lg font-medium gemini-gradient-text">Chifa.ai</h1>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <div className="hidden sm:flex items-center gap-2 px-2 py-1 rounded-full bg-muted/30 text-xs text-muted-foreground">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
          <span>{displayName || 'AI'}</span>
        </div>
        
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="h-8 w-8 rounded-full hover:bg-muted/50"
        >
          {theme === "dark" ? <Sun className="h-3 w-3" /> : <Moon className="h-3 w-3" />}
        </Button>

        <div className="gemini-avatar-user w-8 h-8 rounded-full flex items-center justify-center text-white font-medium text-xs ml-1">
          U
        </div>
      </div>
    </header>
  )
}
