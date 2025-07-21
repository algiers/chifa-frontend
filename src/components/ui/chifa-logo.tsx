import React from 'react';

interface ChifaLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'full' | 'icon';
}

export function ChifaLogo({ 
  className = '', 
  size = 'md',
  variant = 'full' 
}: ChifaLogoProps) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8', 
    lg: 'h-12 w-12'
  };

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-3xl'
  };

  if (variant === 'icon') {
    return (
      <div className={`${sizeClasses[size]} ${className} flex items-center justify-center rounded-lg chifa-gradient`}>
        <span className="text-white font-bold text-sm">C</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`${sizeClasses[size]} flex items-center justify-center rounded-lg chifa-gradient`}>
        <span className="text-white font-bold text-sm">C</span>
      </div>
      <span className={`font-bold gradient-text ${textSizeClasses[size]}`}>
        Chifa.ai
      </span>
    </div>
  );
}