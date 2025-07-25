'use client';

import React, { useState, useEffect } from 'react';
import AdminHeader from './AdminHeader';
import AdminSidebar from './AdminSidebar';
import { cn } from '../../lib/utils';
import '../../styles/admin-dashboard.css';

interface AdminLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export default function AdminLayout({ children, className }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Charger l'état de la sidebar depuis localStorage au montage
  useEffect(() => {
    const saved = localStorage.getItem('admin-sidebar-open');
    if (saved !== null) {
      setSidebarOpen(JSON.parse(saved));
    } else {
      // Par défaut, fermer sur mobile, ouvrir sur desktop
      setSidebarOpen(window.innerWidth >= 1024);
    }
  }, []);

  // Sauvegarder l'état de la sidebar dans localStorage
  const toggleSidebar = () => {
    const newState = !sidebarOpen;
    setSidebarOpen(newState);
    localStorage.setItem('admin-sidebar-open', JSON.stringify(newState));
  };

  // Gérer le redimensionnement de la fenêtre
  useEffect(() => {
    const handleResize = () => {
      // Sur mobile, fermer automatiquement la sidebar si elle est ouverte
      if (window.innerWidth < 1024 && sidebarOpen) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarOpen]);

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader onMenuClick={toggleSidebar} />
      
      {/* Overlay pour mobile uniquement */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black/50 lg:hidden" 
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar - Position fixe sur mobile, normale sur desktop */}
        <aside className={cn(
          "border-r border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-300 ease-in-out overflow-hidden",
          // Mobile : position fixe avec slide
          "fixed left-0 top-16 z-30 h-[calc(100vh-4rem)] lg:static lg:top-auto lg:z-auto",
          // Largeur et visibilité
          sidebarOpen 
            ? "w-64 translate-x-0" 
            : "w-0 lg:w-16 -translate-x-full lg:translate-x-0"
        )}>
          <div className={cn(
            "h-full transition-opacity duration-300",
            sidebarOpen ? "opacity-100" : "opacity-0 lg:opacity-100"
          )}>
            <AdminSidebar 
              onItemClick={() => {
                // Fermer la sidebar uniquement sur mobile après clic
                if (window.innerWidth < 1024) {
                  setSidebarOpen(false);
                }
              }}
              collapsed={!sidebarOpen}
            />
          </div>
        </aside>
        
        {/* Main content */}
        <main className={cn(
          "flex-1 overflow-auto min-w-0",
          className
        )}>
          <div className="p-4 sm:p-6 w-full h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}