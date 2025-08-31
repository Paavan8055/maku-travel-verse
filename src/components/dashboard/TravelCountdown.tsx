import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, MapPin, Calendar } from 'lucide-react';

interface TravelCountdownProps {
  destination: string;
  departureDate: string;
  bookingType: string;
}

export const TravelCountdown: React.FC<TravelCountdownProps> = ({ 
  destination, 
  departureDate, 
  bookingType 
}) => {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
  }>({ days: 0, hours: 0, minutes: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const departure = new Date(departureDate).getTime();
      const difference = departure - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
        });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 60000); // Update every minute

    return () => clearInterval(timer);
  }, [departureDate]);

  return (
    <Card className="travel-card bg-gradient-to-br from-primary/10 to-accent/10 border-l-4 border-l-primary">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium text-muted-foreground">Next Adventure</span>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            <span className="font-semibold text-foreground">{destination}</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{timeLeft.days}</div>
              <div className="text-xs text-muted-foreground">days</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-accent">{timeLeft.hours}</div>
              <div className="text-xs text-muted-foreground">hours</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-accent">{timeLeft.minutes}</div>
              <div className="text-xs text-muted-foreground">min</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span className="capitalize">{bookingType} departure</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};