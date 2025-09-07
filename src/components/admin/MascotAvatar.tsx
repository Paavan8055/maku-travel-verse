import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import makuMascot from '@/assets/maku-mascot.png';

interface MascotAvatarProps {
  category: string;
  status: string;
  healthStatus: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function MascotAvatar({ 
  category, 
  status, 
  healthStatus, 
  size = 'md',
  className = '' 
}: MascotAvatarProps) {
  const getCategoryTheme = (category: string) => {
    switch (category.toLowerCase()) {
      case 'customer':
        return {
          bgGradient: 'from-blue-500/20 to-cyan-500/20',
          borderColor: 'border-blue-500/30',
          accessories: '🎧', // Support headset
          personality: 'Helpful & Friendly'
        };
      case 'admin':
        return {
          bgGradient: 'from-purple-500/20 to-indigo-500/20',
          borderColor: 'border-purple-500/30',
          accessories: '⚙️', // Admin gear
          personality: 'Organized & Efficient'
        };
      case 'operational':
        return {
          bgGradient: 'from-green-500/20 to-emerald-500/20',
          borderColor: 'border-green-500/30',
          accessories: '🔧', // Operations tools
          personality: 'Reliable & Systematic'
        };
      case 'analytical':
        return {
          bgGradient: 'from-orange-500/20 to-amber-500/20',
          borderColor: 'border-orange-500/30',
          accessories: '📊', // Analytics charts
          personality: 'Insightful & Data-Driven'
        };
      case 'finance':
        return {
          bgGradient: 'from-emerald-600/20 to-teal-500/20',
          borderColor: 'border-emerald-500/30',
          accessories: '💼', // Business briefcase
          personality: 'Precise & Trustworthy'
        };
      case 'marketing':
        return {
          bgGradient: 'from-pink-500/20 to-rose-500/20',
          borderColor: 'border-pink-500/30',
          accessories: '📢', // Marketing megaphone
          personality: 'Creative & Engaging'
        };
      case 'security':
        return {
          bgGradient: 'from-red-500/20 to-orange-500/20',
          borderColor: 'border-red-500/30',
          accessories: '🛡️', // Security shield
          personality: 'Vigilant & Protective'
        };
      case 'hr':
        return {
          bgGradient: 'from-teal-500/20 to-cyan-500/20',
          borderColor: 'border-teal-500/30',
          accessories: '👥', // People/HR
          personality: 'Empathetic & People-Focused'
        };
      default:
        return {
          bgGradient: 'from-primary/20 to-secondary/20',
          borderColor: 'border-primary/30',
          accessories: '🤖', // Generic robot
          personality: 'Versatile & Ready'
        };
    }
  };

  const getStatusIndicator = (status: string, healthStatus: string) => {
    if (healthStatus === 'critical' || status === 'error') {
      return '😟'; // Concerned expression
    }
    if (healthStatus === 'warning' || status === 'paused') {
      return '😐'; // Neutral expression
    }
    if (status === 'active' && healthStatus === 'healthy') {
      return '😊'; // Happy expression
    }
    return '🙂'; // Default friendly expression
  };

  const getSizeClasses = (size: string) => {
    switch (size) {
      case 'sm':
        return 'h-8 w-8';
      case 'lg':
        return 'h-16 w-16';
      default:
        return 'h-10 w-10';
    }
  };

  const theme = getCategoryTheme(category);
  const statusEmoji = getStatusIndicator(status, healthStatus);
  const sizeClasses = getSizeClasses(size);

  return (
    <div className="relative">
      <Avatar className={`bg-gradient-to-br ${theme.bgGradient} border-2 ${theme.borderColor} ${sizeClasses} ${className}`}>
        <AvatarImage 
          src={makuMascot} 
          alt={`Maku ${category} agent mascot`}
          className="object-cover"
        />
        <AvatarFallback className={`bg-gradient-to-br ${theme.bgGradient} text-lg`}>
          🐕
        </AvatarFallback>
      </Avatar>
      
      {/* Category accessory overlay */}
      <div className="absolute -top-1 -right-1 bg-background rounded-full w-6 h-6 flex items-center justify-center border border-border text-xs">
        {theme.accessories}
      </div>
      
      {/* Status indicator */}
      <div className="absolute -bottom-1 -right-1 bg-background rounded-full w-5 h-5 flex items-center justify-center border border-border text-xs">
        {statusEmoji}
      </div>
    </div>
  );
}

export function MascotPersonality({ category }: { category: string }) {
  const theme = getCategoryTheme(category);
  
  return (
    <span className="text-xs text-muted-foreground italic">
      {theme.personality}
    </span>
  );
}

// Helper function to get category theme (exported for use in other components)
export function getCategoryTheme(category: string) {
  switch (category.toLowerCase()) {
    case 'customer':
      return {
        bgGradient: 'from-blue-500/20 to-cyan-500/20',
        borderColor: 'border-blue-500/30',
        accentColor: 'text-blue-600',
        accessories: '🎧',
        personality: 'Helpful & Friendly'
      };
    case 'admin':
      return {
        bgGradient: 'from-purple-500/20 to-indigo-500/20',
        borderColor: 'border-purple-500/30',
        accentColor: 'text-purple-600',
        accessories: '⚙️',
        personality: 'Organized & Efficient'
      };
    case 'operational':
      return {
        bgGradient: 'from-green-500/20 to-emerald-500/20',
        borderColor: 'border-green-500/30',
        accentColor: 'text-green-600',
        accessories: '🔧',
        personality: 'Reliable & Systematic'
      };
    case 'analytical':
      return {
        bgGradient: 'from-orange-500/20 to-amber-500/20',
        borderColor: 'border-orange-500/30',
        accentColor: 'text-orange-600',
        accessories: '📊',
        personality: 'Insightful & Data-Driven'
      };
    case 'finance':
      return {
        bgGradient: 'from-emerald-600/20 to-teal-500/20',
        borderColor: 'border-emerald-500/30',
        accentColor: 'text-emerald-600',
        accessories: '💼',
        personality: 'Precise & Trustworthy'
      };
    case 'marketing':
      return {
        bgGradient: 'from-pink-500/20 to-rose-500/20',
        borderColor: 'border-pink-500/30',
        accentColor: 'text-pink-600',
        accessories: '📢',
        personality: 'Creative & Engaging'
      };
    case 'security':
      return {
        bgGradient: 'from-red-500/20 to-orange-500/20',
        borderColor: 'border-red-500/30',
        accentColor: 'text-red-600',
        accessories: '🛡️',
        personality: 'Vigilant & Protective'
      };
    case 'hr':
      return {
        bgGradient: 'from-teal-500/20 to-cyan-500/20',
        borderColor: 'border-teal-500/30',
        accentColor: 'text-teal-600',
        accessories: '👥',
        personality: 'Empathetic & People-Focused'
      };
    default:
      return {
        bgGradient: 'from-primary/20 to-secondary/20',
        borderColor: 'border-primary/30',
        accentColor: 'text-primary',
        accessories: '🤖',
        personality: 'Versatile & Ready'
      };
  }
}