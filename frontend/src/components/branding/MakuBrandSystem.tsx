import React from 'react';
import MakuLogoOfficial from '@/assets/maku-logo-official.png';

// Maku.Travel Brand System Component Library
// Official Logo Implementation with Actual Logo File

export interface MakuBrandConfig {
  size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  variant: 'full' | 'icon' | 'mascot' | 'text';
  theme: 'light' | 'dark' | 'gradient';
  context: 'header' | 'footer' | 'card' | 'button' | 'loading' | 'error' | 'success';
}

export const MakuLogo: React.FC<MakuBrandConfig> = ({ 
  size = 'md', 
  variant = 'full', 
  theme = 'light',
  context = 'header' 
}) => {
  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8', 
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
    hero: 'w-32 h-32'
  };

  const contextStyles = {
    header: 'shadow-sm hover:scale-105 transition-transform duration-200',
    footer: 'opacity-90 hover:opacity-100 transition-opacity',
    card: 'shadow-md',
    button: 'cursor-pointer hover:shadow-lg transition-all duration-300',
    loading: 'animate-pulse',
    error: 'opacity-50',
    success: 'animate-bounce'
  };

  if (variant === 'mascot') {
    return (
      <div className={`
        ${sizeClasses[size]} 
        rounded-full flex items-center justify-center 
        ${contextStyles[context]}
        ${theme === 'dark' ? 'shadow-lg' : 'shadow-md'}
        overflow-hidden bg-transparent
      `}>
        <img 
          src={MakuLogoOfficial} 
          alt="Maku Travel - Official Logo" 
          className="w-full h-full object-contain"
        />
      </div>
    );
  }

  if (variant === 'icon') {
    return (
      <div className={`
        ${sizeClasses[size]} 
        rounded-xl flex items-center justify-center 
        ${contextStyles[context]}
        overflow-hidden bg-transparent
      `}>
        <img 
          src={MakuLogoOfficial} 
          alt="Maku Travel Icon" 
          className="w-full h-full object-contain"
        />
      </div>
    );
  }

  if (variant === 'full') {
    // Full logo already includes text, so just show the complete logo
    return (
      <div className={`
        ${contextStyles[context]}
        ${size === 'hero' ? 'w-48 h-48' : size === 'xl' ? 'w-36 h-36' : size === 'lg' ? 'w-28 h-28' : size === 'md' ? 'w-20 h-20' : size === 'sm' ? 'w-16 h-16' : 'w-12 h-12'}
      `}>
        <img 
          src={MakuLogoOfficial} 
          alt="Maku Travel - Official Complete Logo" 
          className="w-full h-full object-contain"
        />
      </div>
    );
  }

  if (variant === 'text') {
    return (
      <div className="flex flex-col">
        <span className={`
          font-bold bg-gradient-to-r from-orange-500 via-orange-400 to-green-500 bg-clip-text text-transparent
          ${size === 'hero' ? 'text-4xl' : size === 'xl' ? 'text-2xl' : size === 'lg' ? 'text-xl' : size === 'lg' ? 'text-lg' : 'text-base'}
        `}>
          Maku.Travel
        </span>
        <span className={`
          text-gray-600 font-medium
          ${size === 'hero' ? 'text-base' : size === 'xl' ? 'text-sm' : 'text-xs'}
        `}>
          We Make "U" Travel
        </span>
      </div>
    );
  }

  // Default to full logo
  return <MakuLogo size={size} variant="full" theme={theme} context={context} />;
};

// Brand Color System - Updated to match actual Maku.Travel logo
export const MakuColors = {
  primary: {
    orange: {
      50: '#fff7ed',
      100: '#ffedd5', 
      200: '#fed7aa',
      300: '#fdba74',
      400: '#fb923c',
      500: '#f97316', // Primary orange from logo
      600: '#ea580c',
      700: '#c2410c',
      800: '#9a3412',
      900: '#7c2d12'
    },
    green: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0', 
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e', // Primary green from logo
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d'
    }
  },
  accent: {
    sunYellow: '#fbbf24', // Sun yellow from logo
    skyBlue: '#3b82f6',   // Airplane blue
    vintageRed: '#dc2626', // Bandana red
    vintagebrown: '#92400e' // Suitcase brown
  },
  neutral: {
    white: '#ffffff',
    cream: '#fefce8', // Warm off-white
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      500: '#6b7280',
      800: '#1f2937',
      900: '#111827'
    }
  }
};

// Enhanced Button Components with Tricolor Arc Design Inspiration
export const MakuButton: React.FC<{
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'tricolor' | 'sun';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  className?: string;
}> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  onClick,
  className = '' 
}) => {
  const baseClasses = 'font-medium rounded-full transition-all duration-300 flex items-center justify-center border-0 outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantClasses = {
    primary: 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg hover:shadow-xl focus:ring-orange-500',
    secondary: 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl focus:ring-green-500',
    outline: 'border-2 border-orange-500 text-orange-600 hover:bg-orange-500 hover:text-white focus:ring-orange-500',
    tricolor: 'bg-gradient-to-r from-orange-500 via-yellow-400 to-green-500 hover:from-orange-600 hover:via-yellow-500 hover:to-green-600 text-white shadow-lg hover:shadow-xl focus:ring-orange-500',
    sun: 'bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white shadow-lg hover:shadow-xl focus:ring-yellow-500'
  };
  
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  };

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {children}
    </button>
  );
};

// Card System with Maku Branding
export const MakuCard: React.FC<{
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined';
  className?: string;
}> = ({ children, variant = 'default', className = '' }) => {
  const variantClasses = {
    default: 'bg-white shadow-sm border border-orange-100',
    elevated: 'bg-white shadow-lg border border-orange-200',
    outlined: 'bg-white border-2 border-orange-300'
  };

  return (
    <div className={`rounded-2xl ${variantClasses[variant]} ${className}`}>
      {children}
    </div>
  );
};

export default {
  MakuLogo,
  MakuColors,
  MakuButton,
  MakuCard
};