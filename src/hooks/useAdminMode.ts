import { useAuthStore } from '@/stores/authStore';

/**
 * Hook pour détecter si l'utilisateur est en mode admin
 * Combine la variable d'environnement et le rôle utilisateur
 */
export function useAdminMode() {
  const { user } = useAuthStore();
  
  // Vérifier la variable d'environnement
  const sqlDebugEnabled = process.env.NEXT_PUBLIC_SHOW_SQL_DEBUG === 'true';
  
  // Vérifier si l'utilisateur est admin (vous pouvez ajuster cette logique)
  const isUserAdmin = user?.email?.includes('admin') || 
                      user?.user_metadata?.role === 'admin' ||
                      user?.app_metadata?.role === 'admin';
  
  return {
    showSqlDebug: sqlDebugEnabled && isUserAdmin,
    isAdmin: isUserAdmin,
    sqlDebugEnabled
  };
}