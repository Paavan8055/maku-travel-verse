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
    <Card className={`${className} border-l-4 max-h-64 ${
      occupancyData.urgencyLevel === 'high' ? 'border-l-red-500 bg-red-50/50' :
      occupancyData.urgencyLevel === 'medium' ? 'border-l-yellow-500 bg-yellow-50/50' :
      'border-l-blue-500 bg-blue-50/50'
    }`}>
      <CardContent className="p-3 space-y-2">
        {/* Header with urgency badge */}
        <div className="flex items-center justify-between">
          <Badge 
            variant="outline" 
            className={`text-xs font-medium ${getUrgencyColor(occupancyData.urgencyLevel)}`}
          >
            <Users className="h-3 w-3 mr-1" />
            {getUrgencyMessage()}
          </Badge>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-muted-foreground font-medium">LIVE</span>
          </div>
        </div>

        {/* Main stats grid */}
        <div className="grid grid-cols-1 gap-2">
          {/* Current Viewers - prominent display */}
          <div className="flex items-center justify-between p-2 bg-background/80 rounded-lg border">
            <div className="flex items-center space-x-2">
              <Eye className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">
                {occupancyData.currentViewers} viewing now
              </span>
            </div>
          </div>

          {/* Compact stats row */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            {/* Recent Bookings */}
            {occupancyData.recentBookings > 0 && (
              <div className="flex items-center space-x-1">
                <TrendingUp className="h-3 w-3 text-green-600" />
                <span>{occupancyData.recentBookings} booked/hr</span>
              </div>
            )}
            
            {/* Last Booking */}
            <div className="flex items-center space-x-1">
              <Clock className="h-3 w-3" />
              <span>{occupancyData.lastBooking}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};