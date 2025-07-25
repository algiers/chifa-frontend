"use client"

import { GeminiChatLayout } from "../../components/chat/GeminiChatLayout"
import { ThemeProvider } from "next-themes"
import "../../styles/gemini-chat.css"

export default function GeminiChatPage() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <GeminiChatLayout />
    </ThemeProvider>
  )
}