import React from 'react';

// Maku.Travel Brand System Component Library
// CTO Strategic Implementation for Comprehensive Brand Integration

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
        bg-gradient-to-br from-orange-400 to-orange-500 
        rounded-full flex items-center justify-center 
        ${contextStyles[context]}
        ${theme === 'dark' ? 'shadow-lg' : 'shadow-sm'}
      `}>
        <span className="text-white font-bold text-lg">🐕</span>
      </div>
    );
  }

  if (variant === 'text') {
    return (
      <div className="flex flex-col">
        <span className={`
          font-bold bg-gradient-to-r from-orange-500 to-green-500 bg-clip-text text-transparent
          ${size === 'hero' ? 'text-4xl' : size === 'xl' ? 'text-2xl' : size === 'lg' ? 'text-xl' : 'text-lg'}
        `}>
          Maku.Travel
        </span>
        <span className={`
          text-gray-600 
          ${size === 'hero' ? 'text-base' : 'text-sm'}
        `}>
          We Make "U" Travel
        </span>
      </div>
    );
  }

  // Full logo with all elements
  return (
    <div className={`flex items-center space-x-3 ${contextStyles[context]}`}>
      <MakuLogo size={size} variant="mascot" theme={theme} context={context} />
      <MakuLogo size={size} variant="text" theme={theme} context={context} />
    </div>
  );
};

// Brand Color System
export const MakuColors = {
  primary: {
    orange: {
      50: '#fff7ed',
      100: '#ffedd5', 
      200: '#fed7aa',
      300: '#fdba74',
      400: '#fb923c',
      500: '#f97316', // Primary orange
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
      500: '#22c55e', // Primary green
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d'
    }
  },
  accent: {
    yellow: '#fbbf24', // Sun yellow
    blue: '#3b82f6',   // Sky blue
    red: '#ef4444'     // Alert red
  },
  neutral: {
    white: '#ffffff',
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      500: '#6b7280',
      800: '#1f2937',
      900: '#111827'
    }
  }
};

// Responsive Brand Components
export const MakuButton: React.FC<{
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
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
  const baseClasses = 'font-medium rounded-full transition-all duration-300 flex items-center justify-center';
  
  const variantClasses = {
    primary: 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg hover:shadow-xl',
    secondary: 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl',
    outline: 'border-2 border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white'
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