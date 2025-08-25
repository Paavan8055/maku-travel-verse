import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { X, ChevronUp, ChevronDown, Menu, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

// Mobile-optimized Bottom Sheet
export const MobileBottomSheet = ({
  isOpen,
  onClose,
  title,
  children,
  snapPoints = [0.3, 0.6, 0.9],
  defaultSnap = 1,
  className
}: {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  snapPoints?: number[];
  defaultSnap?: number;
  className?: string;
}) => {
  const [currentSnap, setCurrentSnap] = useState(defaultSnap);
  const [isDragging, setIsDragging] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  const handleDragEnd = (event: any, info: PanInfo) => {
    const velocity = info.velocity.y;
    const currentHeight = window.innerHeight * snapPoints[currentSnap];
    
    if (velocity > 500) {
      // Fast downward swipe - close or go to lower snap
      if (currentSnap === 0) {
        onClose();
      } else {
        setCurrentSnap(Math.max(0, currentSnap - 1));
      }
    } else if (velocity < -500) {
      // Fast upward swipe - go to higher snap
      setCurrentSnap(Math.min(snapPoints.length - 1, currentSnap + 1));
    } else {
      // Determine based on position
      const newY = currentHeight + info.offset.y;
      const newSnapIndex = snapPoints.reduce((closest, snap, index) => {
        const snapHeight = window.innerHeight * snap;
        const currentClosest = window.innerHeight * snapPoints[closest];
        return Math.abs(newY - snapHeight) < Math.abs(newY - currentClosest) ? index : closest;
      }, 0);
      
      if (newSnapIndex === 0 && info.offset.y > 100) {
        onClose();
      } else {
        setCurrentSnap(newSnapIndex);
      }
    }
    setIsDragging(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />
          
          {/* Bottom Sheet */}
          <motion.div
            ref={sheetRef}
            initial={{ y: "100%" }}
            animate={{ 
              y: `${(1 - snapPoints[currentSnap]) * 100}%`,
              transition: isDragging ? { duration: 0 } : { type: "spring", damping: 25, stiffness: 300 }
            }}
            exit={{ y: "100%" }}
            drag="y"
            dragConstraints={{ top: 0, bottom: window.innerHeight }}
            dragElastic={0.1}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={handleDragEnd}
            className={cn(
              "fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-2xl shadow-2xl",
              "border-t border-border max-h-screen overflow-hidden",
              className
            )}
            style={{ height: `${snapPoints[currentSnap] * 100}%` }}
          >
            {/* Handle */}
            <div className="flex justify-center p-3 cursor-grab active:cursor-grabbing">
              <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
            </div>
            
            {/* Header */}
            {title && (
              <div className="flex items-center justify-between px-4 pb-3 border-b">
                <h2 className="text-lg font-semibold">{title}</h2>
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            
            {/* Content */}
            <div className="flex-1 overflow-auto p-4">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// Mobile-optimized Search Bar
export const MobileSearchBar = ({
  value,
  onChange,
  onSubmit,
  placeholder = "Search...",
  suggestions = [],
  showFilters = false,
  onFilterClick,
  className
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  placeholder?: string;
  suggestions?: string[];
  showFilters?: boolean;
  onFilterClick?: () => void;
  className?: string;
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(value);
    setShowSuggestions(false);
    inputRef.current?.blur();
  };

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion);
    onSubmit(suggestion);
    setShowSuggestions(false);
    inputRef.current?.blur();
  };

  return (
    <div className={cn("relative w-full", className)}>
      <form onSubmit={handleSubmit} className="relative">
        <div className={cn(
          "flex items-center bg-background border rounded-full transition-all duration-200",
          isFocused ? "border-primary shadow-lg scale-105" : "border-border"
        )}>
          <Search className="h-5 w-5 text-muted-foreground ml-4" />
          
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => {
              setIsFocused(true);
              setShowSuggestions(suggestions.length > 0);
            }}
            onBlur={() => {
              setIsFocused(false);
              setTimeout(() => setShowSuggestions(false), 200);
            }}
            placeholder={placeholder}
            className="flex-1 px-4 py-3 bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
          />
          
          {showFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onFilterClick}
              className="mr-2 h-8 w-8 p-0"
            >
              <Filter className="h-4 w-4" />
            </Button>
          )}
        </div>
      </form>
      
      {/* Suggestions */}
      <AnimatePresence>
        {showSuggestions && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute top-full left-0 right-0 z-50 mt-2 bg-background border rounded-xl shadow-xl max-h-60 overflow-auto"
          >
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full px-4 py-3 text-left hover:bg-muted transition-colors border-b last:border-b-0"
              >
                <div className="flex items-center space-x-3">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <span>{suggestion}</span>
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Mobile-optimized Card with swipe actions
export const SwipeableCard = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  leftAction,
  rightAction,
  className
}: {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  leftAction?: { icon: React.ReactNode; color: string; label: string };
  rightAction?: { icon: React.ReactNode; color: string; label: string };
  className?: string;
}) => {
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnd = (event: any, info: PanInfo) => {
    const threshold = 100;
    
    if (info.offset.x > threshold && onSwipeRight) {
      onSwipeRight();
    } else if (info.offset.x < -threshold && onSwipeLeft) {
      onSwipeLeft();
    }
    
    setDragX(0);
    setIsDragging(false);
  };

  return (
    <div className="relative overflow-hidden rounded-lg">
      {/* Background Actions */}
      {(leftAction || rightAction) && (
        <div className="absolute inset-0 flex">
          {rightAction && (
            <div 
              className={cn("flex-1 flex items-center justify-start pl-6", rightAction.color)}
              style={{ opacity: Math.min(1, Math.max(0, dragX / 100)) }}
            >
              <div className="flex items-center space-x-2 text-white">
                {rightAction.icon}
                <span className="font-medium">{rightAction.label}</span>
              </div>
            </div>
          )}
          
          {leftAction && (
            <div 
              className={cn("flex-1 flex items-center justify-end pr-6", leftAction.color)}
              style={{ opacity: Math.min(1, Math.max(0, -dragX / 100)) }}
            >
              <div className="flex items-center space-x-2 text-white">
                <span className="font-medium">{leftAction.label}</span>
                {leftAction.icon}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Card Content */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -200, right: 200 }}
        dragElastic={0.2}
        onDragStart={() => setIsDragging(true)}
        onDrag={(event, info) => setDragX(info.offset.x)}
        onDragEnd={handleDragEnd}
        animate={{ x: isDragging ? dragX : 0 }}
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
        className={cn("bg-background relative z-10", className)}
      >
        {children}
      </motion.div>
    </div>
  );
};

// Mobile-optimized Tab Navigation
export const MobileTabNavigation = ({
  tabs,
  activeTab,
  onTabChange,
  className
}: {
  tabs: { id: string; label: string; icon?: React.ReactNode; badge?: number }[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}) => {
  const [indicatorStyle, setIndicatorStyle] = useState({});
  const tabRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});

  useEffect(() => {
    const activeTabElement = tabRefs.current[activeTab];
    if (activeTabElement) {
      const { offsetLeft, offsetWidth } = activeTabElement;
      setIndicatorStyle({
        left: offsetLeft,
        width: offsetWidth,
      });
    }
  }, [activeTab]);

  return (
    <div className={cn("relative bg-background border-b", className)}>
      <div className="flex overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            ref={(el) => (tabRefs.current[tab.id] = el)}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "flex items-center space-x-2 px-4 py-3 whitespace-nowrap transition-colors relative",
              "min-w-0 flex-shrink-0",
              activeTab === tab.id
                ? "text-primary font-medium"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.icon && <span className="h-4 w-4">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className="bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>
      
      {/* Active indicator */}
      <motion.div
        className="absolute bottom-0 h-0.5 bg-primary"
        animate={indicatorStyle}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
      />
    </div>
  );
};

// Mobile-optimized Sticky Header
export const MobileStickyHeader = ({
  title,
  subtitle,
  leftAction,
  rightAction,
  showShadow = true,
  className
}: {
  title: string;
  subtitle?: string;
  leftAction?: React.ReactNode;
  rightAction?: React.ReactNode;
  showShadow?: boolean;
  className?: string;
}) => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.header
      className={cn(
        "sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b transition-all duration-200",
        showShadow && isScrolled && "shadow-sm",
        className
      )}
      animate={{
        backdropFilter: isScrolled ? "blur(8px)" : "blur(0px)",
        backgroundColor: isScrolled ? "hsl(var(--background) / 0.95)" : "hsl(var(--background))"
      }}
    >
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-3 min-w-0 flex-1">
          {leftAction}
          <div className="min-w-0 flex-1">
            <h1 className="font-semibold text-lg truncate">{title}</h1>
            {subtitle && (
              <p className="text-sm text-muted-foreground truncate">{subtitle}</p>
            )}
          </div>
        </div>
        
        {rightAction && (
          <div className="flex-shrink-0 ml-3">
            {rightAction}
          </div>
        )}
      </div>
    </motion.header>
  );
};