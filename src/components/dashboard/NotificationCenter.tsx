import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Bell, 
  Plane, 
  AlertTriangle, 
  TrendingDown,
  MapPin,
  Clock,
  CheckCircle,
  X,
  Settings
} from 'lucide-react';

interface Notification {
  id: string;
  type: 'flight_delay' | 'price_drop' | 'check_in' | 'weather_alert' | 'document_expiry';
  title: string;
  message: string;
  timestamp: string;
  priority: 'high' | 'medium' | 'low';
  isRead: boolean;
  actionUrl?: string;
}

export const NotificationCenter: React.FC<{ className?: string }> = ({ className }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Mock data for demonstration
  useEffect(() => {
    const mockNotifications: Notification[] = [
      {
        id: '1',
        type: 'flight_delay',
        title: 'Flight Delay Alert',
        message: 'Your flight JQ123 to Tokyo is delayed by 2 hours. New departure: 8:30 PM',
        timestamp: '2024-01-15T10:30:00Z',
        priority: 'high',
        isRead: false
      },
      {
        id: '2',
        type: 'check_in',
        title: 'Check-in Reminder',
        message: 'Check-in opens in 6 hours for your flight to Tokyo. Save time by checking in early!',
        timestamp: '2024-01-15T09:00:00Z',
        priority: 'medium',
        isRead: false
      },
      {
        id: '3',
        type: 'price_drop',
        title: 'Price Drop Alert',
        message: 'Great news! Hotel prices in Bali dropped by 25%. Book now to save $200!',
        timestamp: '2024-01-15T08:15:00Z',
        priority: 'medium',
        isRead: true
      },
      {
        id: '4',
        type: 'weather_alert',
        title: 'Weather Update',
        message: 'Heavy rain expected in Tokyo during your visit. Pack an umbrella!',
        timestamp: '2024-01-15T07:00:00Z',
        priority: 'low',
        isRead: true
      }
    ];
    
    setNotifications(mockNotifications);
    setUnreadCount(mockNotifications.filter(n => !n.isRead).length);
  }, []);

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
        return <Bell className="h-4 w-4 text-gray-500" />;
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
        return 'bg-gray-100 text-gray-800 border-gray-200';
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

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, isRead: true } : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, isRead: true }))
    );
    setUnreadCount(0);
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
    const notif = notifications.find(n => n.id === id);
    if (notif && !notif.isRead) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Notifications
              {unreadCount > 0 && (
                <Badge className="bg-red-500 text-white">
                  {unreadCount}
                </Badge>
              )}
            </CardTitle>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <Button variant="outline" size="sm" onClick={markAllAsRead}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark All Read
                </Button>
              )}
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {notifications.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 rounded-lg border transition-colors cursor-pointer ${
                    notification.isRead 
                      ? 'bg-muted/30 border-muted' 
                      : 'bg-background border-primary/20 shadow-sm'
                  }`}
                  onClick={() => !notification.isRead && markAsRead(notification.id)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getNotificationIcon(notification.type)}
                      <h4 className={`font-medium ${!notification.isRead ? 'font-semibold' : ''}`}>
                        {notification.title}
                      </h4>
                      {!notification.isRead && (
                        <div className="w-2 h-2 bg-primary rounded-full" />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getPriorityColor(notification.priority)}>
                        {notification.priority}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.id);
                        }}
                        className="h-6 w-6 p-0 hover:bg-red-100"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-2">
                    {notification.message}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {formatTimeAgo(notification.timestamp)}
                    </span>
                    {notification.actionUrl && (
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">All caught up!</h3>
              <p className="text-muted-foreground">No new notifications at the moment.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};