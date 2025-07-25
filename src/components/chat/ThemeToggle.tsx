'use client';

import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 hover-lift focus-visible:focus"
      aria-label={`Basculer vers le mode ${theme === 'light' ? 'sombre' : 'clair'}`}
      title={`Mode ${theme === 'light' ? 'sombre' : 'clair'}`}
    >
      {theme === 'light' ? (
        <Moon className="w-5 h-5 text-gray-600 dark:text-gray-400 transition-transform duration-200 hover:scale-110" />
      ) : (
        <Sun className="w-5 h-5 text-yellow-500 dark:text-yellow-400 transition-transform duration-200 hover:scale-110" />
      )}
    </button>
  );
}