import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ProfessionalCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'featured' | 'premium' | 'success';
  shadow?: 'sm' | 'md' | 'lg' | 'xl';
  hover?: boolean;
}

export const ProfessionalCard: React.FC<ProfessionalCardProps> = ({
  children,
  className,
  variant = 'default',
  shadow = 'md',
  hover = true
}) => {
  const variantStyles = {
    default: 'border-gray-200 bg-white',
    featured: 'border-orange-500 bg-gradient-to-br from-orange-50 to-green-50 ring-2 ring-orange-200',
    premium: 'border-purple-500 bg-gradient-to-br from-purple-50 to-blue-50 ring-2 ring-purple-200',
    success: 'border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 ring-2 ring-green-200'
  };

  const shadowStyles = {
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl'
  };

  return (
    <Card 
      className={cn(
        variantStyles[variant],
        shadowStyles[shadow],
        hover && 'hover:shadow-xl hover:-translate-y-1 transition-all duration-300',
        className
      )}
    >
      {children}
    </Card>
  );
};

interface ValuePropositionCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  color?: string;
  badge?: string;
  featured?: boolean;
}

export const ValuePropositionCard: React.FC<ValuePropositionCardProps> = ({
  title,
  value,
  description,
  icon,
  color = 'from-blue-500 to-purple-500',
  badge,
  featured = false
}) => (
  <ProfessionalCard variant={featured ? 'featured' : 'default'} shadow="lg">
    <CardContent className="p-8 text-center">
      <div className={`w-16 h-16 bg-gradient-to-br ${color} rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg`}>
        {icon}
      </div>
      
      <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{value}</h3>
      <h4 className="font-semibold text-gray-800 mb-3">{title}</h4>
      <p className="text-gray-600 mb-4">{description}</p>
      
      {badge && (
        <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-300">
          {badge}
        </Badge>
      )}
    </CardContent>
  </ProfessionalCard>
);

interface ProgressCardProps {
  title: string;
  current: number;
  total: number;
  label: string;
  icon: React.ReactNode;
  color?: string;
  showPercentage?: boolean;
}

export const ProgressCard: React.FC<ProgressCardProps> = ({
  title,
  current,
  total,
  label,
  icon,
  color = 'bg-blue-500',
  showPercentage = true
}) => {
  const percentage = Math.round((current / total) * 100);
  
  return (
    <ProfessionalCard shadow="lg">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`w-12 h-12 ${color} rounded-lg flex items-center justify-center shadow-md`}>
            {icon}
          </div>
          {showPercentage && (
            <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-300">
              {percentage}%
            </Badge>
          )}
        </div>
        
        <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-600 mb-4">{label}</p>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Progress</span>
            <span className="font-medium">{current} / {total}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-orange-500 to-green-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </CardContent>
    </ProfessionalCard>
  );
};

interface TierComparisonCardProps {
  tier: {
    name: string;
    icon: React.ReactNode;
    points: string;
    multiplier: string;
    benefits: string[];
    color: string;
    current?: boolean;
  };
  onSelect?: (tierName: string) => void;
}

export const TierComparisonCard: React.FC<TierComparisonCardProps> = ({ tier, onSelect }) => (
  <ProfessionalCard 
    variant={tier.current ? 'featured' : 'default'}
    className="cursor-pointer"
    onClick={() => onSelect?.(tier.name)}
  >
    {tier.current && (
      <div className="bg-orange-500 text-white text-center py-2 text-sm font-semibold">
        YOUR CURRENT TIER
      </div>
    )}
    
    <CardHeader className="text-center">
      <div className={`w-16 h-16 bg-gradient-to-br ${tier.color} rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg`}>
        {tier.icon}
      </div>
      
      <CardTitle className="text-2xl font-bold text-gray-900">
        {tier.name}
      </CardTitle>
      
      <div className="space-y-2">
        <p className="text-lg font-semibold text-orange-600">{tier.points}</p>
        <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-300">
          {tier.multiplier} multiplier
        </Badge>
      </div>
    </CardHeader>

    <CardContent>
      <div className="space-y-3">
        {tier.benefits.map((benefit, index) => (
          <div key={index} className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
              <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 8 8">
                <path d="M0 4l2-2 1 1L7 0l1 1-6 6z"/>
              </svg>
            </div>
            <span className="text-sm text-gray-700">{benefit}</span>
          </div>
        ))}
      </div>
    </CardContent>
  </ProfessionalCard>
);

export { Card, CardContent, CardDescription, CardHeader, CardTitle };