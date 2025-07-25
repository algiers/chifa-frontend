"use client"

import { useState, useEffect } from "react"
import { Wifi, WifiOff } from "lucide-react"
import { cn } from "../../lib/utils"

export function GeminiConnectionStatus() {
  const [isOnline, setIsOnline] = useState(true)
  const [showStatus, setShowStatus] = useState(false)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setShowStatus(true)
      setTimeout(() => setShowStatus(false), 3000)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setShowStatus(true)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (!showStatus) return null

  return (
    <div
      className={cn(
        "fixed top-4 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300",
        isOnline
          ? "bg-green-100 text-green-800 border border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-800"
          : "bg-red-100 text-red-800 border border-red-200 dark:bg-red-900 dark:text-red-200 dark:border-red-800"
      )}
    >
      {isOnline ? (
        <>
          <Wifi className="h-4 w-4" />
          Connexion rétablie
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4" />
          Connexion perdue
        </>
      )}
    </div>
  )
}