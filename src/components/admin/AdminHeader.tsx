'use client';

import React from 'react';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '../ui/dropdown-menu';
import { Badge } from '../ui/badge';
import { useAuthStore } from '../../stores/authStore';
import { createSupabaseBrowserClient } from '../../lib/supabase/client';
import { LogOut, Settings, User, Bell, HelpCircle, Menu } from 'lucide-react';

interface AdminHeaderProps {
  onMenuClick?: () => void;
}

export default function AdminHeader({ onMenuClick }: AdminHeaderProps) {
  const user = useAuthStore((s) => s.user);
  const fullName = useAuthStore((s) => s.fullName);
  const supabase = createSupabaseBrowserClient();

  const handleLogout = async () => {
    if (!window.confirm("Êtes-vous sûr de vouloir vous déconnecter ?")) return;
    
    try {
      console.log('[AdminHeader] Starting logout process...');
      
      // Déconnexion via Supabase
      const { error: signOutError } = await supabase.auth.signOut();
      
      if (signOutError) {
        console.error('[AdminHeader] SignOut error:', signOutError);
      } else {
        console.log('[AdminHeader] SignOut successful');
      }
    } catch (error) {
      console.error('[AdminHeader] SignOut exception:', error);
    }
    
    // Nettoyage côté client
    console.log('[AdminHeader] Clearing client-side data...');
    
    useAuthStore.getState().clearAuth();
    
    const keysToRemove = [
      'sb-ddeibfjxpwnisguehnmo-auth-token',
      'auth-storage',
      'supabase.auth.token'
    ];
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
    
    const cookiesToClear = ['sb-ddeibfjxpwnisguehnmo-auth-token'];
    
    cookiesToClear.forEach(cookieName => {
      document.cookie = `${cookieName}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax`;
      document.cookie = `${cookieName}=; Path=/; Domain=${window.location.hostname}; Expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax`;
    });
    
    console.log('[AdminHeader] Redirecting to login...');
    window.location.replace('/login');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
      <div className="flex h-full items-center justify-between px-4 sm:px-6">
        {/* Menu hamburger + Logo */}
        <div className="flex items-center space-x-4">
          {/* Menu hamburger pour toutes les tailles d'écran */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onMenuClick}
            className="hover:bg-gray-100"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle sidebar</span>
          </Button>
          
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 rounded-lg bg-green-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-lg">Chifa.ai</span>
              <Badge variant="secondary" className="text-xs w-fit">
                Admin Panel
              </Badge>
            </div>
          </div>
        </div>

        {/* Navigation centrale */}
        <div className="hidden xl:flex items-center space-x-1">
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            Production
          </Button>
          <div className="w-px h-4 bg-border mx-2" />
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            <Bell className="w-4 h-4 mr-2" />
            Notifications
          </Button>
        </div>

        {/* Menu utilisateur */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          <Button variant="ghost" size="sm" className="hidden lg:flex">
            <HelpCircle className="w-4 h-4 mr-2" />
            <span className="hidden xl:inline">Aide</span>
          </Button>

          {/* Bouton déconnexion visible sur mobile */}
          <Button 
            variant="ghost" 
            size="sm" 
            className="lg:hidden text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" />
          </Button>
          
          <div className="relative">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="relative h-10 w-10 rounded-full ring-2 ring-transparent hover:ring-green-200 transition-all cursor-pointer">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-green-100 text-green-700 font-semibold">
                      {fullName ? getInitials(fullName) : 'AD'}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </DropdownMenuTrigger>
            <DropdownMenuContent 
              className="w-64" 
              align="end" 
              sideOffset={8}
              alignOffset={0}
              collisionPadding={16}
              sticky="always"
            >
              <div className="flex flex-col space-y-1 p-3 bg-green-50">
                <p className="text-sm font-semibold leading-none text-green-900">
                  {fullName || 'Administrateur'}
                </p>
                <p className="text-xs leading-none text-green-700">
                  {user?.email}
                </p>
                <div className="mt-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Admin
                  </span>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="hover:bg-gray-50 cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                <span>Profil</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="hover:bg-gray-50 cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                <span>Paramètres</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleLogout} 
                className="text-red-600 hover:text-red-700 hover:bg-red-50 font-medium cursor-pointer focus:bg-red-50 focus:text-red-700"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Déconnexion</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}