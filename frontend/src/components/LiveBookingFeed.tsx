/**
 * Live Booking Feed Component
 * Displays real-time booking activity for social proof (OTA standard feature)
 */

import { useState, useEffect } from 'react';
import { Users, MapPin, Clock, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getLivePrices } from '@/services/realtimeApi';

interface BookingActivity {
  id: string;
  userName: string;
  userLocation: string;
  destination: string;
  bookingType: 'hotel' | 'flight' | 'activity';
  timeAgo: string;
  savings?: number;
}

const LiveBookingFeed = () => {
  const [activities, setActivities] = useState<BookingActivity[]>([]);
  const [visible, setVisible] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Mock data for demonstration (in production, this would come from WebSocket/SSE)
  const mockActivities: BookingActivity[] = [
    {
      id: '1',
      userName: 'Sarah M.',
      userLocation: 'New York, USA',
      destination: 'Paris, France',
      bookingType: 'hotel',
      timeAgo: '2 minutes ago',
      savings: 127
    },
    {
      id: '2',
      userName: 'James L.',
      userLocation: 'London, UK',
      destination: 'Tokyo, Japan',
      bookingType: 'flight',
      timeAgo: '5 minutes ago',
      savings: 289
    },
    {
      id: '3',
      userName: 'Maria G.',
      userLocation: 'Sydney, Australia',
      destination: 'Bali, Indonesia',
      bookingType: 'hotel',
      timeAgo: '8 minutes ago',
      savings: 95
    },
    {
      id: '4',
      userName: 'David K.',
      userLocation: 'Mumbai, India',
      destination: 'Dubai, UAE',
      bookingType: 'activity',
      timeAgo: '12 minutes ago',
      savings: 45
    },
    {
      id: '5',
      userName: 'Emma W.',
      userLocation: 'Toronto, Canada',
      destination: 'Barcelona, Spain',
      bookingType: 'flight',
      timeAgo: '15 minutes ago',
      savings: 210
    }
  ];

  useEffect(() => {
    setActivities(mockActivities);

    // Rotate activities every 5 seconds
    const rotationInterval = setInterval(() => {
      setVisible(false);
      
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % mockActivities.length);
        setVisible(true);
      }, 300); // Fade out duration
    }, 5000);

    // Simulate new bookings every 15 seconds
    const newBookingInterval = setInterval(() => {
      // In production, this would be real-time data from WebSocket
      console.log('New booking simulation');
    }, 15000);

    return () => {
      clearInterval(rotationInterval);
      clearInterval(newBookingInterval);
    };
  }, []);

  const currentActivity = activities[currentIndex];

  if (!currentActivity || activities.length === 0) {
    return null;
  }

  const getBookingIcon = (type: string) => {
    switch (type) {
      case 'hotel':
        return '🏨';
      case 'flight':
        return '✈️';
      case 'activity':
        return '🎯';
      default:
        return '📍';
    }
  };

  const getBookingLabel = (type: string) => {
    switch (type) {
      case 'hotel':
        return 'Hotel';
      case 'flight':
        return 'Flight';
      case 'activity':
        return 'Activity';
      default:
        return 'Booking';
    }
  };

  return (
    <div className="fixed bottom-6 left-6 z-50 max-w-sm hidden md:block">
      <Card 
        className={`
          p-4 bg-white shadow-floating border-l-4 border-l-orange-500
          transition-all duration-300 transform
          ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
          hover:shadow-2xl hover:scale-105
        `}
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center text-2xl">
              {getBookingIcon(currentActivity.bookingType)}
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-semibold text-sm text-gray-900 truncate">
                {currentActivity.userName}
              </p>
              <Badge variant="secondary" className="text-xs">
                <Users className="w-3 h-3 mr-1" />
                {getBookingLabel(currentActivity.bookingType)}
              </Badge>
            </div>
            
            <div className="flex items-center gap-1 text-xs text-gray-600 mb-2">
              <MapPin className="w-3 h-3" />
              <span className="truncate">
                {currentActivity.userLocation} → {currentActivity.destination}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Clock className="w-3 h-3" />
                <span>{currentActivity.timeAgo}</span>
              </div>
              
              {currentActivity.savings && (
                <div className="flex items-center gap-1 text-xs font-medium text-green-600">
                  <TrendingUp className="w-3 h-3" />
                  <span>Saved ${currentActivity.savings}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Live indicator */}
        <div className="absolute top-2 right-2 flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs text-gray-500 font-medium">LIVE</span>
        </div>
      </Card>
    </div>
  );
};

export default LiveBookingFeed;
