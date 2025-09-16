import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, 
  AlertCircle, 
  Info, 
  X, 
  Clock, 
  Wifi, 
  WifiOff,
  Bell,
  BellOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'booking' | 'system';
  title: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  persistent?: boolean;
  timestamp: Date;
}

interface NotificationManagerProps {
  maxVisible?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center';
  className?: string;
}

// Smart notification manager with priority queuing
export const SmartNotificationManager: React.FC<NotificationManagerProps> = ({
  maxVisible = 3,
  position = 'top-right',
  className
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isEnabled, setIsEnabled] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Listen for online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      addNotification({
        type: 'success',
        title: 'Connection Restored',
        message: 'You are back online',
        duration: 3000
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      addNotification({
        type: 'warning',
        title: 'Connection Lost',
        message: 'You are currently offline',
        persistent: true
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp'>) => {
    if (!isEnabled) return;

    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString() + Math.random(),
      timestamp: new Date()
    };

    setNotifications(prev => {
      const updated = [newNotification, ...prev];
      
      // Remove oldest non-persistent notifications if exceeding max
      if (updated.length > maxVisible) {
        return updated.filter((notif, index) => 
          index < maxVisible || notif.persistent
        );
      }
      
      return updated;
    });

    // Auto-remove non-persistent notifications
    if (!notification.persistent) {
      const duration = notification.duration || getDefaultDuration(notification.type);
      setTimeout(() => {
        removeNotification(newNotification.id);
      }, duration);
    }
  }, [isEnabled, maxVisible]);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const getDefaultDuration = (type: Notification['type']) => {
    switch (type) {
      case 'success': return 4000;
      case 'error': return 6000;
      case 'warning': return 5000;
      case 'info': return 4000;
      case 'booking': return 7000;
      case 'system': return 5000;
      default: return 4000;
    }
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'top-right': return 'top-4 right-4';
      case 'top-left': return 'top-4 left-4';
      case 'bottom-right': return 'bottom-4 right-4';
      case 'bottom-left': return 'bottom-4 left-4';
      case 'top-center': return 'top-4 left-1/2 transform -translate-x-1/2';
      default: return 'top-4 right-4';
    }
  };

  // Expose methods globally for easy access
  useEffect(() => {
    (window as any).addNotification = addNotification;
    (window as any).removeNotification = removeNotification;
    (window as any).clearAllNotifications = clearAll;
    
    return () => {
      delete (window as any).addNotification;
      delete (window as any).removeNotification;
      delete (window as any).clearAllNotifications;
    };
  }, [addNotification, removeNotification, clearAll]);

  return (
    <>
      {/* Notification Toggle */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsEnabled(!isEnabled)}
        className="fixed top-4 left-4 z-50 md:hidden"
      >
        {isEnabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
      </Button>

      {/* Notifications Container */}
      <div className={cn('fixed z-50 space-y-2', getPositionClasses(), className)}>
        <AnimatePresence>
          {notifications.slice(0, maxVisible).map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              onClose={() => removeNotification(notification.id)}
            />
          ))}
        </AnimatePresence>
        
        {notifications.length > maxVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <Button
              variant="outline"
              size="sm"
              onClick={clearAll}
              className="text-xs"
            >
              +{notifications.length - maxVisible} more • Clear all
            </Button>
          </motion.div>
        )}
      </div>
    </>
  );
};

// Individual notification card component
const NotificationCard: React.FC<{
  notification: Notification;
  onClose: () => void;
}> = ({ notification, onClose }) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!notification.persistent && notification.duration) {
      const interval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev - (100 / (notification.duration! / 100));
          return Math.max(0, newProgress);
        });
      }, 100);

      return () => clearInterval(interval);
    }
  }, [notification.persistent, notification.duration]);

  const getIcon = () => {
    switch (notification.type) {
      case 'success': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'error': return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'warning': return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case 'info': return <Info className="h-5 w-5 text-blue-600" />;
      case 'booking': return <Clock className="h-5 w-5 text-purple-600" />;
      case 'system': return <Wifi className="h-5 w-5 text-gray-600" />;
      default: return <Info className="h-5 w-5" />;
    }
  };

  const getBorderColor = () => {
    switch (notification.type) {
      case 'success': return 'border-green-200';
      case 'error': return 'border-red-200';
      case 'warning': return 'border-yellow-200';
      case 'info': return 'border-blue-200';
      case 'booking': return 'border-purple-200';
      case 'system': return 'border-gray-200';
      default: return 'border-border';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 300, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 300, scale: 0.8 }}
      transition={{ type: "spring", damping: 20, stiffness: 300 }}
      className={cn(
        "bg-background border rounded-lg shadow-lg p-4 min-w-[320px] max-w-[420px] relative overflow-hidden",
        getBorderColor()
      )}
    >
      {/* Progress bar for auto-dismiss */}
      {!notification.persistent && (
        <div className="absolute bottom-0 left-0 h-1 bg-primary/20 w-full">
          <motion.div
            className="h-full bg-primary"
            initial={{ width: "100%" }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>
      )}

      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm text-foreground">
            {notification.title}
          </h4>
          <p className="text-sm text-muted-foreground mt-1">
            {notification.message}
          </p>
          
          {notification.action && (
            <Button
              variant="outline"
              size="sm"
              onClick={notification.action.onClick}
              className="mt-2 h-7 text-xs"
            >
              {notification.action.label}
            </Button>
          )}
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-6 w-6 p-0 hover:bg-muted"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
};

// Booking-specific notification components
export const BookingNotifications = {
  searchStarted: (destination: string) => {
    (window as any).addNotification?.({
      type: 'info' as const,
      title: 'Searching...',
      message: `Looking for options in ${destination}`,
      duration: 3000
    });
  },

  searchCompleted: (resultsCount: number) => {
    (window as any).addNotification?.({
      type: 'success' as const,
      title: 'Search Complete',
      message: `Found ${resultsCount} options for you`,
      duration: 4000
    });
  },

  bookingStarted: () => {
    (window as any).addNotification?.({
      type: 'booking' as const,
      title: 'Processing Booking',
      message: 'Please wait while we confirm your reservation',
      persistent: true
    });
  },

  bookingConfirmed: (confirmationNumber: string) => {
    (window as any).addNotification?.({
      type: 'success' as const,
      title: 'Booking Confirmed!',
      message: `Confirmation: ${confirmationNumber}`,
      duration: 7000,
      action: {
        label: 'View Details',
        onClick: () => window.location.href = `/bookings/${confirmationNumber}`
      }
    });
  },

  paymentRequired: () => {
    (window as any).addNotification?.({
      type: 'warning' as const,
      title: 'Payment Required',
      message: 'Complete your payment to secure this booking',
      persistent: true,
      action: {
        label: 'Pay Now',
        onClick: () => document.getElementById('payment-section')?.scrollIntoView()
      }
    });
  },

  quotaExceeded: (provider: string) => {
    (window as any).addNotification?.({
      type: 'warning' as const,
      title: 'Service Temporarily Limited',
      message: `${provider} quota reached. Showing demo data.`,
      duration: 6000
    });
  }
};

// System notification helpers
export const SystemNotifications = {
  maintenance: (message: string) => {
    (window as any).addNotification?.({
      type: 'system' as const,
      title: 'System Maintenance',
      message,
      persistent: true
    });
  },

  update: (version: string) => {
    (window as any).addNotification?.({
      type: 'info' as const,
      title: 'App Updated',
      message: `New version ${version} is now available`,
      action: {
        label: 'Refresh',
        onClick: () => window.location.reload()
      }
    });
  },

  error: (error: string) => {
    (window as any).addNotification?.({
      type: 'error' as const,
      title: 'System Error',
      message: error,
      duration: 8000,
      action: {
        label: 'Report',
        onClick: () => console.error('User reported error:', error)
      }
    });
  }
};