'use client';

import { ChevronUp } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { getDemoUsage } from '@/lib/utils/credits-manager';
import { useState, useEffect } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';
import { LoaderIcon } from '@/components/icons';

interface SidebarUserNavProps {
  user: any;
}

export function SidebarUserNav({ user }: SidebarUserNavProps) {
  const router = useRouter();
  const { logout, isLoading } = useAuth();
  const { setTheme, resolvedTheme } = useTheme();
  const [demoUsage, setDemoUsage] = useState<any>(null);

  // Load demo usage if user is in demo mode
  useEffect(() => {
    const loadDemoUsage = async () => {
      if (user) {
        const usage = await getDemoUsage(user.id);
        setDemoUsage(usage);
      }
    };
    
    loadDemoUsage();
  }, [user]);

  const handleSignOut = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            {isLoading ? (
              <SidebarMenuButton className="data-[state=open]:bg-sidebar-accent bg-background data-[state=open]:text-sidebar-accent-foreground h-10 justify-between">
                <div className="flex flex-row gap-2">
                  <div className="size-6 bg-zinc-500/30 rounded-full animate-pulse" />
                  <span className="bg-zinc-500/30 text-transparent rounded-md animate-pulse">
                    Chargement...
                  </span>
                </div>
                <div className="animate-spin text-zinc-500">
                  <LoaderIcon />
                </div>
              </SidebarMenuButton>
            ) : (
              <SidebarMenuButton
                className="data-[state=open]:bg-sidebar-accent bg-background data-[state=open]:text-sidebar-accent-foreground h-10"
              >
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-600 text-white text-xs font-medium">
                  {user?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="flex flex-col items-start flex-1 min-w-0">
                  <span className="truncate text-sm">
                    {user?.name || user?.email?.split('@')[0] || 'Utilisateur'}
                  </span>
                  {demoUsage && (
                    <Badge variant="outline" className="text-xs h-4 px-1">
                      {demoUsage.remainingMessages}/{demoUsage.totalMessages} messages
                    </Badge>
                  )}
                </div>
                <ChevronUp className="ml-auto flex-shrink-0" />
              </SidebarMenuButton>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="top"
            className="w-[--radix-popper-anchor-width]"
          >
            <DropdownMenuItem
              className="cursor-pointer"
              onSelect={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            >
              {`Basculer en mode ${resolvedTheme === 'light' ? 'sombre' : 'clair'}`}
            </DropdownMenuItem>
            
            <DropdownMenuItem
              className="cursor-pointer"
              onSelect={() => router.push('/settings')}
            >
              Paramètres
            </DropdownMenuItem>
            
            {demoUsage && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer"
                  onSelect={() => router.push('/upgrade')}
                >
                  Passer à un compte complet
                </DropdownMenuItem>
              </>
            )}
            
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <button
                type="button"
                className="w-full cursor-pointer"
                onClick={handleSignOut}
              >
                Se déconnecter
              </button>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}