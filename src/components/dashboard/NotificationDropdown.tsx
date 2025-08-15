import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Bell, 
  Plane, 
  AlertTriangle, 
  TrendingDown,
  MapPin,
  Clock,
  CheckCircle,
  X,
  Settings,
  ExternalLink
} from 'lucide-react';
import type { Notification } from '@/hooks/useNotifications';

interface NotificationDropdownProps {
  notifications: Notification[];
  unreadCount: number;
  onMarkAsRead: (id: string) => void;
  onDeleteNotification: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClose: () => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  notifications,
  unreadCount,
  onMarkAsRead,
  onDeleteNotification,
  onMarkAllAsRead,
  onClose
}) => {
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'flight_delay':
        return <Plane className="h-4 w-4 text-red-500" />;
      case 'price_drop':
        return <TrendingDown className="h-4 w-4 text-green-500" />;
      case 'check_in':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'weather_alert':
        return <MapPin className="h-4 w-4 text-orange-500" />;
      case 'document_expiry':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Bell className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-muted text-muted-foreground border-muted';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  const criticalNotifications = notifications.filter(n => n.priority === 'high' || !n.isRead).slice(0, 5);

  return (
    <Card className="absolute right-0 top-full mt-2 w-96 shadow-lg border z-50 bg-background">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="h-4 w-4 text-primary" />
            Notifications
            {unreadCount > 0 && (
              <Badge className="bg-red-500 text-white text-xs">
                {unreadCount}
              </Badge>
            )}
          </CardTitle>
          <div className="flex gap-1">
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={onMarkAllAsRead} className="h-7 px-2">
                <CheckCircle className="h-3 w-3" />
              </Button>
            )}
            <Button variant="ghost" size="sm" className="h-7 px-2">
              <Settings className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-7 px-2">
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        {criticalNotifications.length > 0 ? (
          <ScrollArea className="max-h-80">
            <div className="space-y-1 p-4">
              {criticalNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors hover:bg-accent ${
                    notification.isRead 
                      ? 'bg-muted/30 border-muted' 
                      : 'bg-background border-primary/20 shadow-sm'
                  }`}
                  onClick={() => !notification.isRead && onMarkAsRead(notification.id)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2 flex-1">
                      {getNotificationIcon(notification.type)}
                      <h4 className={`font-medium text-sm truncate ${!notification.isRead ? 'font-semibold' : ''}`}>
                        {notification.title}
                      </h4>
                      {!notification.isRead && (
                        <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Badge className={`text-xs ${getPriorityColor(notification.priority)}`}>
                        {notification.priority}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteNotification(notification.id);
                        }}
                        className="h-6 w-6 p-0 hover:bg-red-100"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                    {notification.message}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {formatTimeAgo(notification.timestamp)}
                    </span>
                    {notification.actionUrl && (
                      <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                        <ExternalLink className="h-3 w-3 mr-1" />
                        View
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="text-center py-8 px-4">
            <Bell className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <h3 className="text-sm font-medium mb-1">All caught up!</h3>
            <p className="text-xs text-muted-foreground">No new notifications</p>
          </div>
        )}
        
        {notifications.length > 5 && (
          <>
            <Separator />
            <div className="p-3">
              <Button variant="ghost" size="sm" className="w-full text-xs">
                View All Notifications ({notifications.length})
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};