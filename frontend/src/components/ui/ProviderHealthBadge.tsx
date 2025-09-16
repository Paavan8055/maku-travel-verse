import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, XCircle, Clock } from 'lucide-react';

interface ProviderHealthBadgeProps {
  provider: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  responseTime?: number;
  className?: string;
}

export const ProviderHealthBadge: React.FC<ProviderHealthBadgeProps> = ({
  provider,
  status,
  responseTime,
  className = ''
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'healthy':
        return {
          icon: CheckCircle,
          text: 'Healthy',
          className: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
        };
      case 'degraded':
        return {
          icon: AlertTriangle,
          text: 'Degraded',
          className: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800'
        };
      case 'unhealthy':
        return {
          icon: XCircle,
          text: 'Unhealthy',
          className: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
        };
      default:
        return {
          icon: Clock,
          text: 'Unknown',
          className: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800'
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <Badge 
      variant="outline" 
      className={`flex items-center gap-1.5 text-xs font-medium ${config.className} ${className}`}
      title={`${provider}: ${config.text}${responseTime ? ` (${responseTime}ms)` : ''}`}
    >
      <Icon className="h-3 w-3" />
      <span className="hidden sm:inline">{provider}</span>
      <span className="sm:hidden">{provider.charAt(0).toUpperCase()}</span>
      <span className="hidden md:inline">• {config.text}</span>
      {responseTime && responseTime < 3000 && (
        <span className="hidden lg:inline text-xs opacity-75">
          {responseTime}ms
        </span>
      )}
    </Badge>
  );
};