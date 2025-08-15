import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/context/AuthContext';

export interface Notification {
  id: string;
  type: 'flight_delay' | 'price_drop' | 'check_in' | 'weather_alert' | 'document_expiry';
  title: string;
  message: string;
  timestamp: string;
  priority: 'high' | 'medium' | 'low';
  isRead: boolean;
  actionUrl?: string;
  userId?: string;
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();

  // Mock real-time notifications for demo
  useEffect(() => {
    const mockNotifications: Notification[] = [
      {
        id: '1',
        type: 'flight_delay',
        title: 'Flight Delay Alert',
        message: 'Your flight JQ123 to Tokyo is delayed by 2 hours. New departure: 8:30 PM',
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 mins ago
        priority: 'high',
        isRead: false
      },
      {
        id: '2',
        type: 'check_in',
        title: 'Check-in Available',
        message: 'Check-in is now open for your flight to Tokyo. Complete it now to save time!',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        priority: 'medium',
        isRead: false
      },
      {
        id: '3',
        type: 'price_drop',
        title: 'Price Drop Alert',
        message: 'Great news! Hotel prices in Bali dropped by 25%. Book now to save $200!',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
        priority: 'medium',
        isRead: true
      },
      {
        id: '4',
        type: 'document_expiry',
        title: 'Passport Expiry Warning',
        message: 'Your passport expires in 6 months. Renew it to avoid travel disruptions.',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        priority: 'high',
        isRead: false
      }
    ];
    
    setNotifications(mockNotifications);
    setUnreadCount(mockNotifications.filter(n => !n.isRead).length);

    // Simulate real-time notifications
    const interval = setInterval(() => {
      // Randomly add new notifications (10% chance every 30 seconds)
      if (Math.random() < 0.1) {
        const newNotification: Notification = {
          id: Date.now().toString(),
          type: 'price_drop',
          title: 'New Price Alert',
          message: 'Price dropped for your watched destination!',
          timestamp: new Date().toISOString(),
          priority: 'medium',
          isRead: false
        };
        
        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(prev => prev + 1);

        // Browser push notification for high priority
        if (newNotification.priority === 'high' && 'Notification' in window) {
          Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
              new Notification(newNotification.title, {
                body: newNotification.message,
                icon: '/favicon.ico'
              });
            }
          });
        }
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

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
    const notif = notifications.find(n => n.id === id);
    setNotifications(prev => prev.filter(notif => notif.id !== id));
    if (notif && !notif.isRead) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'userId'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      userId: user?.id
    };
    
    setNotifications(prev => [newNotification, ...prev]);
    if (!newNotification.isRead) {
      setUnreadCount(prev => prev + 1);
    }

    // Browser push notification for high priority
    if (newNotification.priority === 'high' && 'Notification' in window) {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification(newNotification.title, {
            body: newNotification.message,
            icon: '/favicon.ico'
          });
        }
      });
    }
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    addNotification
  };
};