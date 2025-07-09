import { createBrowserClient } from '@supabase/ssr'

// Client principal pour les composants côté client - singleton pattern
let supabaseInstance: ReturnType<typeof createBrowserClient> | null = null

export function createSupabaseBrowserClient() {
  if (!supabaseInstance) {
    supabaseInstance = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name) => {
            if (typeof document !== 'undefined') {
              const value = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)')?.pop()
              return value || undefined
            }
            return undefined
          },
          set: (name, value, options) => {
            if (typeof document !== 'undefined') {
              // Configuration des cookies compatible HTTP et HTTPS
              const isSecure = window.location.protocol === 'https:'
              const cookieString = `${name}=${value}; Path=/; SameSite=Lax${isSecure ? '; Secure' : ''}${options?.maxAge ? `; Max-Age=${options.maxAge}` : ''}${options?.domain ? `; Domain=${options.domain}` : ''}`
              document.cookie = cookieString
              console.log('[Supabase Client] Cookie set:', name, cookieString)
            }
          },
          remove: (name, options) => {
            if (typeof document !== 'undefined') {
              const isSecure = window.location.protocol === 'https:'
              const cookieString = `${name}=; Path=/; SameSite=Lax${isSecure ? '; Secure' : ''}; Max-Age=0${options?.domain ? `; Domain=${options.domain}` : ''}`
              document.cookie = cookieString
              console.log('[Supabase Client] Cookie removed:', name, cookieString)
            }
          }
        },
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      }
    )
  }
  return supabaseInstance
}

// Alias pour compatibilité
export const supabase = createSupabaseBrowserClient()

export default supabase
