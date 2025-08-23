import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, Clock, X } from 'lucide-react';
import { useSessionRecovery } from '@/hooks/useSessionRecovery';
import { Badge } from '@/components/ui/badge';

export const SessionRecoveryBanner = () => {
  const [isVisible, setIsVisible] = useState(true);
  const { hasRecoverableSession, session, recoverSession, clearSession } = useSessionRecovery();

  if (!hasRecoverableSession || !isVisible || !session) {
    return null;
  }

  const handleRecover = () => {
    const recovery = recoverSession();
    if (recovery) {
      window.location.href = recovery.bookingUrl;
    }
  };

  const getStepName = (step?: string) => {
    switch (step) {
      case 'room-selection':
        return 'Room Selection';
      case 'checkout':
        return 'Checkout';
      case 'payment':
        return 'Payment';
      default:
        return 'Hotel Search';
    }
  };

  const timeLeft = () => {
    if (!session.timestamp) return '';
    const elapsed = Date.now() - session.timestamp;
    const remaining = (30 * 60 * 1000) - elapsed; // 30 minutes
    const minutes = Math.floor(remaining / (60 * 1000));
    return minutes > 0 ? `${minutes} min left` : 'Expiring soon';
  };

  return (
    <Card className="mx-4 my-2 border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-800">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium text-orange-900 dark:text-orange-100">
                Continue Your Booking
              </h4>
              <Badge variant="secondary" className="text-xs">
                <Clock className="h-3 w-3 mr-1" />
                {timeLeft()}
              </Badge>
            </div>
            
            <p className="text-sm text-orange-700 dark:text-orange-200 mb-3">
              You have an unfinished booking for <strong>{session.hotelName}</strong> 
              {session.checkIn && session.checkOut && (
                <span> from {new Date(session.checkIn).toLocaleDateString()} to {new Date(session.checkOut).toLocaleDateString()}</span>
              )}
              . Last step: {getStepName(session.step)}.
            </p>

            <div className="flex gap-2">
              <Button 
                size="sm" 
                onClick={handleRecover}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                Continue Booking
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => {
                  clearSession();
                  setIsVisible(false);
                }}
                className="border-orange-300 text-orange-700 hover:bg-orange-100"
              >
                Start Fresh
              </Button>
            </div>
          </div>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsVisible(false)}
            className="text-orange-500 hover:text-orange-700 hover:bg-orange-100 dark:hover:bg-orange-900 p-1 h-auto"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};