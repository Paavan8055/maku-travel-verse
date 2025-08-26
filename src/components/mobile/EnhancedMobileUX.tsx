import React, { useState, useEffect } from 'react';
import { ChevronLeft, Menu, Search, MapPin, Calendar, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface EnhancedMobileUXProps {
  children: React.ReactNode;
  showBottomNavigation?: boolean;
  enableSwipeGestures?: boolean;
  optimizeForTouch?: boolean;
}

interface SwipeState {
  startX: number;
  startY: number;
  deltaX: number;
  deltaY: number;
  swiping: boolean;
}

export const EnhancedMobileUX: React.FC<EnhancedMobileUXProps> = ({
  children,
  showBottomNavigation = true,
  enableSwipeGestures = true,
  optimizeForTouch = true
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const [swipeState, setSwipeState] = useState<SwipeState>({
    startX: 0,
    startY: 0,
    deltaX: 0,
    deltaY: 0,
    swiping: false
  });
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    // Enhanced mobile detection
    const checkMobile = () => {
      const userAgent = navigator.userAgent;
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      const isSmallScreen = window.innerWidth < 768;
      const hasTouchScreen = 'ontouchstart' in window && navigator.maxTouchPoints > 0;
      
      setIsMobile(isMobileDevice || (isSmallScreen && hasTouchScreen));
    };

    // Virtual keyboard detection
    const handleResize = () => {
      const viewport = window.visualViewport;
      if (viewport) {
        const heightDifference = window.innerHeight - viewport.height;
        setKeyboardHeight(heightDifference > 150 ? heightDifference : 0);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    if ('visualViewport' in window) {
      window.visualViewport?.addEventListener('resize', handleResize);
    }

    return () => {
      window.removeEventListener('resize', checkMobile);
      if ('visualViewport' in window) {
        window.visualViewport?.removeEventListener('resize', handleResize);
      }
    };
  }, []);

  // Touch handlers for swipe gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!enableSwipeGestures) return;
    
    const touch = e.touches[0];
    setSwipeState({
      startX: touch.clientX,
      startY: touch.clientY,
      deltaX: 0,
      deltaY: 0,
      swiping: true
    });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!enableSwipeGestures || !swipeState.swiping) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - swipeState.startX;
    const deltaY = touch.clientY - swipeState.startY;
    
    setSwipeState(prev => ({
      ...prev,
      deltaX,
      deltaY
    }));

    // Prevent scrolling for horizontal swipes
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 20) {
      e.preventDefault();
    }
  };

  const handleTouchEnd = () => {
    if (!enableSwipeGestures || !swipeState.swiping) return;
    
    const { deltaX, deltaY } = swipeState;
    const minSwipeDistance = 50;
    
    // Handle horizontal swipes (image gallery navigation)
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
      if (deltaX > 0) {
        // Swipe right - previous image
        setCurrentImageIndex(prev => Math.max(0, prev - 1));
      } else {
        // Swipe left - next image (would need image count from context)
        setCurrentImageIndex(prev => prev + 1);
      }
    }
    
    setSwipeState({
      startX: 0,
      startY: 0,
      deltaX: 0,
      deltaY: 0,
      swiping: false
    });
  };

  if (!isMobile) {
    return <>{children}</>;
  }

  return (
    <div 
      className={cn(
        "min-h-screen bg-background",
        optimizeForTouch && "touch-manipulation select-none"
      )}
      style={{ 
        paddingBottom: keyboardHeight ? `${keyboardHeight}px` : showBottomNavigation ? '72px' : '0',
        transition: 'padding-bottom 0.3s ease-in-out'
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Mobile Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="flex items-center justify-between h-14 px-4">
          <Button variant="ghost" size="sm" className="p-2">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          
          <h1 className="font-semibold text-lg">MAKU Travel</h1>
          
          <Button variant="ghost" size="sm" className="p-2">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Touch-optimized content */}
      <main 
        className="pb-safe"
        style={{
          transform: enableSwipeGestures ? `translateX(${swipeState.deltaX * 0.1}px)` : 'none',
          transition: swipeState.swiping ? 'none' : 'transform 0.3s ease-out'
        }}
      >
        {children}
      </main>

      {/* Enhanced Bottom Navigation */}
      {showBottomNavigation && (
        <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50">
          <div className="grid grid-cols-4 h-16">
            {[
              { icon: Search, label: 'Search', active: true },
              { icon: MapPin, label: 'Explore', active: false },
              { icon: Calendar, label: 'Trips', active: false },
              { icon: Users, label: 'Profile', active: false }
            ].map((item, index) => (
              <button
                key={item.label}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 touch-target transition-colors",
                  "min-h-[48px] min-w-[48px]", // Touch-friendly size
                  item.active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="text-xs font-medium">{item.label}</span>
                {item.active && (
                  <div className="w-1 h-1 rounded-full bg-primary mt-1" />
                )}
              </button>
            ))}
          </div>
        </nav>
      )}

      {/* Touch feedback overlay */}
      {swipeState.swiping && Math.abs(swipeState.deltaX) > 20 && (
        <div className="fixed inset-0 pointer-events-none z-40">
          <div 
            className={cn(
              "absolute top-1/2 transform -translate-y-1/2 px-4 py-2 rounded-full",
              "bg-black/20 text-white text-sm font-medium",
              swipeState.deltaX > 0 ? "left-4" : "right-4"
            )}
          >
            {swipeState.deltaX > 0 ? "Previous" : "Next"}
          </div>
        </div>
      )}
    </div>
  );
};

// Enhanced form input component for mobile
export const MobileFriendlyInput: React.FC<{
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
}> = ({ type = 'text', placeholder, value, onChange, className }) => {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      className={cn(
        // Base styles
        "w-full px-4 py-3 text-base", // Larger text for mobile
        "border border-border rounded-lg",
        "bg-background text-foreground",
        "focus:ring-2 focus:ring-primary focus:border-transparent",
        "transition-colors duration-200",
        // Mobile optimizations
        "min-h-[48px]", // Touch-friendly height
        "text-16px", // Prevents zoom on iOS
        className
      )}
      autoComplete="off"
      autoCapitalize="none"
      autoCorrect="off"
      spellCheck="false"
    />
  );
};