import React, { useState, useEffect } from 'react';
import { ChevronDown, X, Check, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface MobileBookingOptimizationProps {
  isMobile?: boolean;
  children: React.ReactNode;
  onBookingStart?: () => void;
  onBookingComplete?: () => void;
}

export const MobileBookingOptimization: React.FC<MobileBookingOptimizationProps> = ({
  isMobile = false,
  children,
  onBookingStart,
  onBookingComplete
}) => {
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [bookingStep, setBookingStep] = useState(0);
  const [touchOptimized, setTouchOptimized] = useState(false);

  useEffect(() => {
    // Detect mobile device and touch capability
    const checkMobile = () => {
      const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isSmallScreen = window.innerWidth < 768;
      setTouchOptimized(hasTouchScreen && isSmallScreen);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!touchOptimized && !isMobile) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      {/* Mobile-optimized content */}
      <div className="md:hidden">
        {children}
        
        {/* Sticky bottom action bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4 z-50">
          <Button 
            className="w-full h-12 text-lg font-semibold rounded-2xl"
            onClick={() => {
              setIsBottomSheetOpen(true);
              onBookingStart?.();
            }}
          >
            Book Now - Quick & Easy
          </Button>
        </div>

        {/* Mobile bottom sheet for booking */}
        {isBottomSheetOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
            <div className="bg-background rounded-t-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-background border-b border-border p-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold">Complete Booking</h3>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setIsBottomSheetOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="p-4 space-y-4">
                {/* Mobile-optimized booking steps */}
                <div className="grid gap-3">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium">
                          1
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">Quick Details</p>
                          <p className="text-sm text-muted-foreground">Name & contact info</p>
                        </div>
                        <Check className="h-5 w-5 text-primary" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                          2
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">Payment</p>
                          <p className="text-sm text-muted-foreground">Secure & fast checkout</p>
                        </div>
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* One-tap booking options */}
                <div className="space-y-3">
                  <Badge variant="secondary" className="w-full justify-center py-2">
                    🔒 Secure booking in under 30 seconds
                  </Badge>
                  
                  <Button 
                    className="w-full h-12 text-lg font-semibold rounded-2xl"
                    onClick={() => {
                      onBookingComplete?.();
                      setIsBottomSheetOpen(false);
                    }}
                  >
                    Complete Booking
                  </Button>
                  
                  <Button variant="outline" className="w-full h-12 rounded-2xl">
                    <Phone className="h-4 w-4 mr-2" />
                    Call to Book
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Desktop content unchanged */}
      <div className="hidden md:block">
        {children}
      </div>
    </div>
  );
};

export default MobileBookingOptimization;
