import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  Calendar, 
  Users, 
  Wifi, 
  Car, 
  Coffee,
  MapPin,
  Clock,
  DollarSign,
  Star,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

interface HotelInsight {
  type: 'occupancy' | 'pricing' | 'events' | 'amenities' | 'booking_pattern';
  title: string;
  description: string;
  value?: number;
  trend?: 'up' | 'down' | 'stable';
  severity?: 'info' | 'warning' | 'success';
  icon: React.ReactNode;
}

interface IntelligentHotelInfoProps {
  destination: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  className?: string;
}

export const IntelligentHotelInfo: React.FC<IntelligentHotelInfoProps> = ({
  destination,
  checkIn,
  checkOut,
  guests = 2,
  className = ''
}) => {
  const [insights, setInsights] = useState<HotelInsight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate intelligent hotel insights generation
    const generateInsights = async () => {
      setLoading(true);
      
      // Simulated intelligent insights based on real travel patterns
      const hotelInsights: HotelInsight[] = [
        {
          type: 'occupancy',
          title: 'High Demand Period',
          description: `${destination} hotels are 85% booked for these dates. Consider booking soon.`,
          value: 85,
          trend: 'up',
          severity: 'warning',
          icon: <Users className="h-4 w-4" />
        },
        {
          type: 'pricing',
          title: 'Optimal Booking Window',
          description: 'Hotel prices typically drop 15% when booked 2-3 weeks in advance.',
          value: 15,
          trend: 'down',
          severity: 'success',
          icon: <DollarSign className="h-4 w-4" />
        },
        {
          type: 'events',
          title: 'Local Events Impact',
          description: 'Major conference in the city may affect hotel availability and pricing.',
          severity: 'info',
          icon: <Calendar className="h-4 w-4" />
        },
        {
          type: 'amenities',
          title: 'Popular Amenities',
          description: 'Business travelers in this area prioritize: WiFi (98%), Gym (76%), Parking (65%)',
          severity: 'info',
          icon: <Wifi className="h-4 w-4" />
        },
        {
          type: 'booking_pattern',
          title: 'Booking Trend',
          description: `${guests > 2 ? 'Group bookings' : 'Couple bookings'} are trending 23% higher this month.`,
          value: 23,
          trend: 'up',
          severity: 'success',
          icon: <TrendingUp className="h-4 w-4" />
        }
      ];

      // Add date-specific insights if dates are provided
      if (checkIn && checkOut) {
        const checkInDate = new Date(checkIn);
        const isWeekend = checkInDate.getDay() === 0 || checkInDate.getDay() === 6;
        
        if (isWeekend) {
          hotelInsights.unshift({
            type: 'pricing',
            title: 'Weekend Premium',
            description: 'Weekend rates are typically 30-40% higher. Consider weekday alternatives.',
            value: 35,
            trend: 'up',
            severity: 'warning',
            icon: <Calendar className="h-4 w-4" />
          });
        }
      }

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      setInsights(hotelInsights);
      setLoading(false);
    };

    if (destination) {
      generateInsights();
    }
  }, [destination, checkIn, checkOut, guests]);

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'warning': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'success': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const getTrendIcon = (trend?: string) => {
    if (trend === 'up') return <TrendingUp className="h-3 w-3 text-red-500" />;
    if (trend === 'down') return <TrendingUp className="h-3 w-3 text-green-500 rotate-180" />;
    return null;
  };

  if (loading) {
    return (
      <Card className={`${className}`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Hotel Market Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${className} border-l-4 border-l-primary`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Hotel Market Insights for {destination}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {insights.map((insight, index) => (
          <div 
            key={index}
            className={`p-3 rounded-lg border ${getSeverityColor(insight.severity)}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                <div className="mt-0.5">{insight.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-sm">{insight.title}</h4>
                    {insight.trend && getTrendIcon(insight.trend)}
                    {insight.value && (
                      <Badge variant="secondary" className="text-xs">
                        {insight.value}%
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm opacity-90">{insight.description}</p>
                  
                  {insight.type === 'occupancy' && insight.value && (
                    <div className="mt-2">
                      <Progress value={insight.value} className="h-2" />
                      <p className="text-xs mt-1 opacity-75">Occupancy Rate</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        
        <div className="pt-3 border-t border-border/50">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};