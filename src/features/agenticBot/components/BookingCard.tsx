import React from 'react';
import { ChevronRight, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface BookingCardProps {
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
  icon?: React.ReactNode;
  variant?: 'default' | 'monitoring' | 'success' | 'error';
  loading?: boolean;
  price?: string;
  savings?: string;
}

const variantConfig = {
  default: {
    cardClass: 'hover:shadow-card transition-shadow duration-200 hover-scale',
    badgeVariant: 'default' as const,
    iconColor: 'text-primary'
  },
  monitoring: {
    cardClass: 'border-travel-sunset bg-travel-sunset/5',
    badgeVariant: 'secondary' as const,
    iconColor: 'text-travel-sunset'
  },
  success: {
    cardClass: 'border-travel-forest bg-travel-forest/5',
    badgeVariant: 'default' as const,
    iconColor: 'text-travel-forest'
  },
  error: {
    cardClass: 'border-destructive bg-destructive/5',
    badgeVariant: 'destructive' as const,
    iconColor: 'text-destructive'
  }
};

const BookingCard: React.FC<BookingCardProps> = ({
  title,
  description,
  actionLabel,
  onAction,
  icon,
  variant = 'default',
  loading = false,
  price,
  savings
}) => {
  const config = variantConfig[variant];

  const getStatusIcon = () => {
    if (loading) return <Loader2 className="h-4 w-4 animate-spin" />;
    if (variant === 'success') return <CheckCircle className="h-4 w-4" />;
    if (variant === 'error') return <AlertTriangle className="h-4 w-4" />;
    return null;
  };

  return (
    <Card className={`${config.cardClass} cursor-pointer animate-fade-in`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            {icon && (
              <div className={`${config.iconColor} mt-1`}>
                {icon}
              </div>
            )}
            <div className="flex-1">
              <CardTitle className="text-sm font-medium leading-tight">
                {title}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                {description}
              </p>
            </div>
          </div>
          {getStatusIcon()}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {price && (
              <Badge variant="outline" className="text-xs">
                {price}
              </Badge>
            )}
            {savings && (
              <Badge variant={config.badgeVariant} className="text-xs">
                Save {savings}
              </Badge>
            )}
          </div>
          
          <Button
            size="sm"
            variant={variant === 'monitoring' ? 'outline' : 'default'}
            onClick={onAction}
            disabled={loading}
            className="text-xs"
          >
            {loading ? (
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
            ) : (
              <ChevronRight className="h-3 w-3 mr-1" />
            )}
            {actionLabel}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default BookingCard;