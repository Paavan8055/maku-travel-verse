import React, { useState, useEffect } from 'react';
import { Eye, Clock, TrendingUp, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface RealTimeOccupancyProps {
  hotelId: string;
  className?: string;
}

interface OccupancyData {
  currentViewers: number;
  recentBookings: number;
  timeframe: string;
  urgencyLevel: 'low' | 'medium' | 'high';
  lastBooking: string;
}

export const RealTimeOccupancy: React.FC<RealTimeOccupancyProps> = ({
  hotelId,
  className = ""
}) => {
  const [occupancyData, setOccupancyData] = useState<OccupancyData | null>(null);

  const generateRealisticData = (): OccupancyData => {
    // Simulate realistic viewer and booking patterns
    const hour = new Date().getHours();
    const isBusinessHours = hour >= 9 && hour <= 17;
    const isPeakHours = hour >= 19 && hour <= 22; // Evening booking peak
    
    let baseViewers = 2;
    let recentBookings = 0;
    
    if (isPeakHours) {
      baseViewers = Math.floor(Math.random() * 8) + 5; // 5-12 viewers
      recentBookings = Math.floor(Math.random() * 3) + 1; // 1-3 bookings
    } else if (isBusinessHours) {
      baseViewers = Math.floor(Math.random() * 5) + 3; // 3-7 viewers
      recentBookings = Math.floor(Math.random() * 2); // 0-1 bookings
    } else {
      baseViewers = Math.floor(Math.random() * 3) + 1; // 1-3 viewers
      recentBookings = Math.floor(Math.random() * 2); // 0-1 bookings
    }
    
    // Add some randomness based on hotel ID for consistency
    const idHash = hotelId.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    const multiplier = 1 + (idHash % 3) * 0.2; // 1.0 to 1.4 multiplier
    
    const currentViewers = Math.max(1, Math.floor(baseViewers * multiplier));
    
    let urgencyLevel: 'low' | 'medium' | 'high' = 'low';
    if (currentViewers >= 8 || recentBookings >= 2) {
      urgencyLevel = 'high';
    } else if (currentViewers >= 5 || recentBookings >= 1) {
      urgencyLevel = 'medium';
    }
    
    const lastBookingMinutes = Math.floor(Math.random() * 120) + 15; // 15-135 minutes ago
    
    return {
      currentViewers,
      recentBookings,
      timeframe: 'last hour',
      urgencyLevel,
      lastBooking: `${lastBookingMinutes} minutes ago`
    };
  };

  useEffect(() => {
    // Generate initial data
    setOccupancyData(generateRealisticData());
    
    // Update data every 30-60 seconds to simulate real-time changes
    const interval = setInterval(() => {
      setOccupancyData(generateRealisticData());
    }, Math.random() * 30000 + 30000); // 30-60 seconds
    
    return () => clearInterval(interval);
  }, [hotelId]);

  if (!occupancyData) {
    return null;
  }

  const getUrgencyColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getUrgencyMessage = () => {
    if (occupancyData.urgencyLevel === 'high') {
      return 'High demand - book soon!';
    } else if (occupancyData.urgencyLevel === 'medium') {
      return 'Popular choice';
    }
    return 'Good availability';
  };

  return (
    <Card className={`${className} border-l-4 ${
      occupancyData.urgencyLevel === 'high' ? 'border-l-red-500' :
      occupancyData.urgencyLevel === 'medium' ? 'border-l-yellow-500' :
      'border-l-blue-500'
    }`}>
      <CardContent className="p-3">
        <div className="space-y-2">
          {/* Current Viewers */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                {occupancyData.currentViewers} {occupancyData.currentViewers === 1 ? 'person is' : 'people are'} viewing
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-muted-foreground">live</span>
            </div>
          </div>

          {/* Recent Bookings */}
          {occupancyData.recentBookings > 0 && (
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-sm">
                {occupancyData.recentBookings} booking{occupancyData.recentBookings > 1 ? 's' : ''} in {occupancyData.timeframe}
              </span>
            </div>
          )}

          {/* Last Booking */}
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Last booked {occupancyData.lastBooking}
            </span>
          </div>

          {/* Urgency Badge */}
          <div className="pt-1">
            <Badge 
              variant="outline" 
              className={`text-xs ${getUrgencyColor(occupancyData.urgencyLevel)}`}
            >
              <Users className="h-3 w-3 mr-1" />
              {getUrgencyMessage()}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};