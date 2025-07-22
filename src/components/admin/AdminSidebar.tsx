'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  Users, 
  Database, 
  Settings, 
  BarChart3, 
  Shield, 
  Key,
  FileText,
  Activity,
  Zap,
  MessageSquare,
  Building2,
  CreditCard,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

interface SidebarItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  items?: SidebarItem[];
}

const sidebarItems: SidebarItem[] = [
  {
    title: 'Tableau de bord',
    href: '/admin',
    icon: BarChart3,
  },
  {
    title: 'Gestion',
    href: '#',
    icon: Database,
    items: [
      {
        title: 'Pharmacies',
        href: '/admin/pharmacies',
        icon: Building2,
      },
      {
        title: 'Utilisateurs',
        href: '/admin/users',
        icon: Users,
      },
      {
        title: 'Conversations',
        href: '/admin/conversations',
        icon: MessageSquare,
      },
    ],
  },
  {
    title: 'Authentification',
    href: '#',
    icon: Shield,
    items: [
      {
        title: 'Utilisateurs',
        href: '/admin/auth/users',
        icon: Users,
      },
      {
        title: 'Politiques',
        href: '/admin/auth/policies',
        icon: Shield,
      },
      {
        title: 'Fournisseurs',
        href: '/admin/auth/providers',
        icon: Key,
      },
    ],
  },
  {
    title: 'Configuration',
    href: '#',
    icon: Settings,
    items: [
      {
        title: 'API Keys',
        href: '/admin/config/api-keys',
        icon: Key,
      },
      {
        title: 'LiteLLM',
        href: '/admin/config/litellm',
        icon: Zap,
      },
      {
        title: 'Base de données',
        href: '/admin/config/database',
        icon: Database,
      },
    ],
  },
  {
    title: 'Monitoring',
    href: '#',
    icon: Activity,
    items: [
      {
        title: 'Logs',
        href: '/admin/monitoring/logs',
        icon: FileText,
      },
      {
        title: 'Métriques',
        href: '/admin/monitoring/metrics',
        icon: BarChart3,
      },
      {
        title: 'Santé système',
        href: '/admin/monitoring/health',
        icon: Activity,
      },
    ],
  },
  {
    title: 'Facturation',
    href: '/admin/billing',
    icon: CreditCard,
  },
];

interface AdminSidebarProps {
  className?: string;
  onItemClick?: () => void;
}

export default function AdminSidebar({ className, onItemClick }: AdminSidebarProps) {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>(['Gestion']);

  const toggleExpanded = (title: string) => {
    setExpandedItems(prev => 
      prev.includes(title) 
        ? prev.filter(item => item !== title)
        : [...prev, title]
    );
  };

  const renderSidebarItem = (item: SidebarItem, level = 0) => {
    const isActive = pathname === item.href;
    const hasChildren = item.items && item.items.length > 0;
    const isExpanded = expandedItems.includes(item.title);
    const isParentActive = hasChildren && item.items && item.items.some(child => pathname === child.href);

    if (hasChildren) {
      return (
        <div key={item.title} className="space-y-1">
          <button
            onClick={() => toggleExpanded(item.title)}
            className={cn(
              "w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors",
              isParentActive ? "bg-accent/50 text-accent-foreground" : "text-muted-foreground"
            )}
          >
            <div className="flex items-center">
              <item.icon className="mr-2 h-4 w-4" />
              {item.title}
            </div>
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
          {isExpanded && (
            <div className="space-y-1 pl-4">
              {item.items && item.items.map(child => renderSidebarItem(child, level + 1))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={item.title}
        href={item.href}
        onClick={onItemClick}
        className={cn(
          "flex items-center rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors",
          level > 0 && "ml-4",
          isActive && "bg-accent text-accent-foreground",
          !isActive && "text-muted-foreground"
        )}
      >
        <item.icon className="mr-2 h-4 w-4" />
        {item.title}
        {item.badge && (
          <span className="ml-auto rounded-full bg-primary px-2 py-1 text-xs text-primary-foreground">
            {item.badge}
          </span>
        )}
      </Link>
    );
  };

  return (
    <div className={cn("h-full w-64 flex flex-col", className)}>
      {/* Contenu scrollable */}
      <div className="flex-1 overflow-y-auto scrollbar-auto-hide">
        <div className="space-y-2 py-4 px-2">
          {sidebarItems.map(item => renderSidebarItem(item))}
        </div>
      </div>
      
      {/* Footer fixe en bas */}
      <div className="border-t border-border p-4 bg-background/95">
        <div className="text-xs text-muted-foreground text-center">
          Chifa.ai Admin v1.0
        </div>
      </div>
    </div>
  );
}