"use client"

import { AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "../ui/button"

interface GeminiErrorMessageProps {
  error: string
  onRetry?: () => void
}

export function GeminiErrorMessage({ error, onRetry }: GeminiErrorMessageProps) {
  return (
    <div className="flex justify-start">
      <div className="flex-1 max-w-3xl">
        <div className="border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
              <span className="text-red-800 dark:text-red-200">{error}</span>
            </div>
            {onRetry && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="ml-4 h-8 border-red-300 text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Réessayer
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}