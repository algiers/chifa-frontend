'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { Search } from 'lucide-react';
import { PlusIcon } from '@/components/icons';
import { SidebarHistory } from './sidebar-history';
import { SidebarUserNav } from './sidebar-user-nav';
import { SidebarSearch } from './sidebar-search';
import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  useSidebar,
} from '@/components/ui/sidebar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/hooks/useAuth';
import { useChatStore } from '@/stores/chatStore';
import { ChifaLogo } from '@/components/ui/chifa-logo';

export function AppSidebar() {
  const router = useRouter();
  const { setOpenMobile } = useSidebar();
  const { user } = useAuth();
  const { clearChat } = useChatStore();
  const [showSearch, setShowSearch] = useState(false);

  const handleNewChat = () => {
    clearChat();
    setOpenMobile(false);
    router.push('/dashboard');
    router.refresh();
  };

  return (
    <Sidebar className="group-data-[side=left]:border-r-0">
      <SidebarHeader>
        <SidebarMenu>
          <div className="flex flex-row justify-between items-center">
            <Link
              href="/dashboard"
              onClick={() => {
                setOpenMobile(false);
              }}
              className="flex flex-row gap-3 items-center"
            >
              <ChifaLogo size="md" className="hover:scale-105 transition-transform duration-200" />
            </Link>
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    type="button"
                    className="p-2 h-fit hover:bg-chifa-100 hover:text-chifa-600 transition-colors"
                    onClick={() => setShowSearch(!showSearch)}
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent align="end">Rechercher</TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    type="button"
                    className="p-2 h-fit hover:bg-chifa-100 hover:text-chifa-600 transition-colors"
                    onClick={handleNewChat}
                  >
                    <PlusIcon />
                  </Button>
                </TooltipTrigger>
                <TooltipContent align="end">Nouvelle conversation</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {showSearch ? (
          <SidebarSearch user={user} onClose={() => setShowSearch(false)} />
        ) : (
          <SidebarHistory user={user} />
        )}
      </SidebarContent>
      <SidebarFooter>
        {user && <SidebarUserNav user={user} />}
      </SidebarFooter>
    </Sidebar>
  );
}