'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUIStore } from '@/stores/uiStore'; // Import UI store
import { LayoutDashboard, History, Settings, X } from 'lucide-react'; // Importer les icônes + X pour fermer
import { Button } from '@/components/ui/button'; // Importer Button pour le bouton de fermeture

interface NavItem {
  href: string;
  label: string;
  icon?: React.ElementType; // Décommenter et typer l'icône
}

// Helper function pour créer les icônes avec le bon typage
const createIcon = (IconComponent: React.ElementType | undefined, className: string) => {
  if (!IconComponent) return null;
  const Component = IconComponent as React.ComponentType<{ className?: string }>;
  return <Component className={className} />;
};

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/history', label: 'Historique', icon: History },
  { href: '/settings', label: 'Paramètres', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { isMobileSidebarOpen, setMobileSidebarOpen, toggleMobileSidebar } = useUIStore();

  // Fermer le sidebar mobile lors d'un changement de route
  useEffect(() => {
    if (isMobileSidebarOpen) {
      setMobileSidebarOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, setMobileSidebarOpen]);

  const sidebarContent = (
    <>
      <div className="flex justify-between items-center md:block">
        <div className="flex items-center space-x-2 mb-6 px-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <LayoutDashboard className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Chifa.ai</h2>
            <p className="text-xs text-gray-400">Assistant IA</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden text-gray-300 hover:text-white"
          onClick={toggleMobileSidebar}
          aria-label="Fermer le menu"
        >
          <X className="h-6 w-6" />
        </Button>
      </div>
      <nav>
        <ul>
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg hover:bg-gray-700 transition-colors duration-200
                  ${pathname === item.href ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-300 hover:text-white hover:bg-gray-700'}`}
                onClick={() => isMobileSidebarOpen && setMobileSidebarOpen(false)}
              >
                {createIcon(item.icon, 'w-5 h-5')}
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );

  return (
    <>
      {/* Sidebar pour écrans larges */}
      <aside className="w-64 bg-gray-800 text-white p-4 space-y-2 hidden md:flex md:flex-col h-full">
        {sidebarContent}
      </aside>

      {/* Sidebar pour mobile (overlay) */}
      {isMobileSidebarOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setMobileSidebarOpen(false)}
            aria-hidden="true"
          />
          {/* Contenu du Sidebar Mobile */}
          <aside className="fixed top-0 left-0 w-64 h-full bg-gray-800 text-white p-4 space-y-2 z-50 transform transition-transform ease-in-out duration-300 md:hidden flex flex-col">
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  );
}
